import ipaddress
import json
import socket
import sys
import types
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch
from urllib.robotparser import RobotFileParser


# Keep the unit suite dependency-free; the production image supplies Scrapling.
fetchers = types.ModuleType("scrapling.fetchers")
fetchers.Fetcher = object
fetchers.DynamicFetcher = object
scrapling = types.ModuleType("scrapling")
scrapling.fetchers = fetchers
sys.modules.setdefault("scrapling", scrapling)
sys.modules.setdefault("scrapling.fetchers", fetchers)
curl_cffi = types.ModuleType("curl_cffi")
curl_cffi.CurlOpt = SimpleNamespace(
    RESOLVE="resolve",
    MAXFILESIZE_LARGE="max_filesize_large",
)
sys.modules.setdefault("curl_cffi", curl_cffi)
sys.path.insert(0, str(Path(__file__).parent))

import crawl


class FakeSelection:
    def __init__(self, values):
        self.values = values

    def getall(self):
        return self.values


class FakePage:
    def __init__(self, json_ld):
        self.json_ld = json_ld

    def css(self, selector):
        if selector == 'script[type="application/ld+json"]::text':
            return FakeSelection([json.dumps(self.json_ld)])
        return FakeSelection([])


class CrawlSafetyTests(unittest.TestCase):
    def test_rejects_ip_targets(self):
        with self.assertRaises(ValueError):
            crawl.canonicalize_domain("127.0.0.1")

    def test_rejects_external_and_insecure_urls(self):
        with patch.object(crawl, "assert_public_host"):
            with self.assertRaises(ValueError):
                crawl.validate_url("http://example.com/careers", "example.com")
            with self.assertRaises(ValueError):
                crawl.validate_url("https://attacker.example/jobs", "example.com")

    def test_rejects_url_credentials_and_nonstandard_https_ports(self):
        with patch.object(crawl, "assert_public_host"):
            with self.assertRaises(ValueError):
                crawl.validate_url("https://user:secret@example.com/careers", "example.com")
            with self.assertRaises(ValueError):
                crawl.validate_url("https://example.com:8443/careers", "example.com")
            self.assertEqual(
                crawl.validate_url("https://example.com:443/careers", "example.com"),
                "https://example.com:443/careers",
            )

    def test_rejects_private_dns_results(self):
        private_result = [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.5", 443))]
        with patch.object(socket, "getaddrinfo", return_value=private_result):
            with self.assertRaises(ValueError):
                crawl.assert_public_host("example.com")

    def test_static_fetch_pins_validated_dns_address(self):
        response = SimpleNamespace(status=200, body=b"<html></html>", headers={})
        get = Mock(return_value=response)
        with (
            patch.object(crawl, "Fetcher", SimpleNamespace(get=get)),
            patch.object(crawl, "assert_public_host", return_value=("8.8.8.8",)),
        ):
            crawl.fetch_static("https://example.com/careers", "example.com")

        options = get.call_args.kwargs["curl_options"]
        self.assertEqual(options["resolve"], ["example.com:443:8.8.8.8"])
        self.assertEqual(options["max_filesize_large"], crawl.MAX_RESPONSE_BYTES)

    def test_static_fetch_timeout_is_bounded_and_propagated_for_worker_retry(self):
        get = Mock(side_effect=TimeoutError("upstream timed out"))
        with (
            patch.object(crawl, "Fetcher", SimpleNamespace(get=get)),
            patch.object(crawl, "assert_public_host", return_value=("8.8.8.8",)),
        ):
            with self.assertRaises(TimeoutError):
                crawl.fetch_static("https://example.com/careers", "example.com")

        self.assertEqual(get.call_args.kwargs["timeout"], 15)
        self.assertEqual(get.call_args.kwargs["retries"], 1)

    def test_rejects_redirect_whose_dns_changes_to_private_ip(self):
        response = SimpleNamespace(
            status=302,
            body=b"",
            headers={"location": "https://careers.example.com/jobs"},
        )

        def addresses(host, *_args, **_kwargs):
            address = "10.0.0.5" if host == "careers.example.com" else "8.8.8.8"
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, 443))]

        with (
            patch.object(crawl, "Fetcher", SimpleNamespace(get=Mock(return_value=response))),
            patch.object(socket, "getaddrinfo", side_effect=addresses),
        ):
            with self.assertRaises(ValueError):
                crawl.fetch_static("https://example.com/careers", "example.com")

    def test_dynamic_fetch_pins_origin_and_disables_async_dns(self):
        fetch = Mock(return_value=object())
        with (
            patch.object(crawl, "DynamicFetcher", SimpleNamespace(fetch=fetch)),
            patch.object(crawl, "assert_public_host", return_value=("8.8.8.8",)),
        ):
            crawl.fetch_dynamic("https://example.com/careers", "example.com")

        flags = fetch.call_args.kwargs["extra_flags"]
        self.assertIn("--host-resolver-rules=MAP example.com 8.8.8.8,EXCLUDE localhost", flags)
        self.assertIn("--disable-features=AsyncDns", flags)

    def test_robots_denial_is_respected(self):
        policy = RobotFileParser()
        policy.parse(["User-agent: *", "Disallow: /careers"])
        self.assertFalse(crawl.can_fetch(policy, "https://example.com/careers"))


class CrawlExtractionTests(unittest.TestCase):
    def test_identifies_company_and_each_supported_ats_adapter(self):
        self.assertEqual(crawl.adapter_for_url("https://example.com/careers", "example.com"), "company")
        self.assertEqual(crawl.adapter_for_url("https://boards.greenhouse.io/acme", "example.com"), "greenhouse")
        self.assertEqual(crawl.adapter_for_url("https://jobs.lever.co/acme", "example.com"), "lever")
        self.assertEqual(crawl.adapter_for_url("https://jobs.ashbyhq.com/acme", "example.com"), "ashby")
        self.assertEqual(crawl.adapter_for_url("https://apply.workable.com/acme", "example.com"), "workable")

    def test_extracts_job_posting_json_ld(self):
        page = FakePage(
            {
                "@context": "https://schema.org",
                "@type": "JobPosting",
                "title": "Director of Revenue Operations",
                "occupationalCategory": "Revenue Operations",
                "identifier": {"value": "REQ-123"},
                "datePosted": "2026-07-10",
                "url": "https://example.com/jobs/revops",
                "jobLocation": {
                    "address": {
                        "addressLocality": "Cairo",
                        "addressCountry": "EG",
                    }
                },
            }
        )
        jobs = crawl.parse_json_ld(page, "https://example.com/careers")
        self.assertEqual(jobs[0]["title"], "Director of Revenue Operations")
        self.assertEqual(jobs[0]["department"], "Revenue Operations")
        self.assertEqual(jobs[0]["requisition_id"], "REQ-123")
        self.assertEqual(jobs[0]["location"], "Cairo, EG")

    def test_resolves_relative_json_ld_job_url_against_page(self):
        page = FakePage(
            {
                "@context": "https://schema.org",
                "@type": "JobPosting",
                "title": "Sales Manager",
                "datePosted": "2026-07-10",
                "url": "/jobs/sales-manager",
            }
        )

        jobs = crawl.parse_json_ld(page, "https://example.com/careers/openings")

        self.assertEqual(jobs[0]["source_url"], "https://example.com/jobs/sales-manager")

    def test_json_ld_survives_dom_restructure_via_graph_payload(self):
        page = FakePage(
            {
                "@context": "https://schema.org",
                "@graph": [
                    {"@type": "Organization", "name": "Example"},
                    {
                        "@type": ["Thing", "JobPosting"],
                        "title": "Enterprise Account Executive",
                        "datePosted": "2026-07-12",
                        "url": "/positions/enterprise-ae",
                    },
                ],
            }
        )

        jobs = crawl.parse_json_ld(page, "https://example.com/careers")

        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]["title"], "Enterprise Account Executive")
        self.assertEqual(
            jobs[0]["source_url"],
            "https://example.com/positions/enterprise-ae",
        )

    def test_deduplicates_equivalent_jobs(self):
        jobs = [
            {
                "title": "Sales Manager",
                "department": "Sales",
                "location": "Remote",
                "posted_at": "2026-07-10",
                "source_url": "https://example.com/jobs/1",
            },
            {
                "title": "  Sales   Manager ",
                "department": "sales",
                "location": "Remote",
                "posted_at": "2026-07-10T08:00:00Z",
                "source_url": "https://jobs.lever.co/example/sales-manager",
            },
        ]
        with patch.object(crawl, "assert_public_host"):
            deduped = crawl.deduplicate_jobs(jobs, "example.com")
        self.assertEqual(len(deduped), 1)

    def test_preserves_distinct_requisition_ids(self):
        jobs = [
            {
                "title": "Account Executive",
                "department": "Sales",
                "location": "Remote",
                "posted_at": "2026-07-10",
                "requisition_id": "REQ-1",
                "source_url": "https://example.com/jobs/1",
            },
            {
                "title": "Account Executive",
                "department": "Sales",
                "location": "Remote",
                "posted_at": "2026-07-10",
                "requisition_id": "REQ-2",
                "source_url": "https://boards.greenhouse.io/example/jobs/2",
            },
        ]
        with patch.object(crawl, "assert_public_host"):
            deduped = crawl.deduplicate_jobs(jobs, "example.com")
        self.assertEqual(len(deduped), 2)

    def test_result_payload_normalizes_mixed_naive_and_aware_posting_dates(self):
        result = crawl.result_payload(
            "example.com",
            "hiring-v2",
            "ok",
            [
                {"title": "Sales Manager", "posted_at": "2026-07-10", "source_url": "https://example.com/jobs/1"},
                {"title": "Account Executive", "posted_at": "2026-07-11T08:30:00Z", "source_url": "https://example.com/jobs/2"},
            ],
            ["https://example.com/careers"],
            "official_link",
        )

        self.assertEqual(result["observed_at"], "2026-07-11T08:30:00Z")

    def test_approved_ats_candidate_can_use_guarded_browser_fallback(self):
        homepage = SimpleNamespace(status=200)
        static_ats_page = SimpleNamespace(status=200)
        dynamic_ats_page = object()
        ats_url = "https://jobs.ashbyhq.com/example"
        job = {
            "title": "Director of Sales",
            "department": "Sales",
            "location": "Remote",
            "posted_at": "2026-07-10",
            "source_url": f"{ats_url}/director-sales",
        }

        with (
            patch.dict(crawl.os.environ, {"SCRAPLING_BROWSER_ENABLED": "true"}),
            patch.object(crawl, "assert_public_host", return_value=("8.8.8.8",)),
            patch.object(crawl, "robots_policy", return_value=None),
            patch.object(crawl, "fetch_static", side_effect=[homepage, static_ats_page]),
            patch.object(crawl, "discover_candidates", return_value=[ats_url]),
            patch.object(crawl, "fetch_dynamic", return_value=dynamic_ats_page) as dynamic_fetch,
            patch.object(crawl, "parse_json_ld", side_effect=[[], [job]]),
            patch.object(crawl, "parse_job_links", return_value=[]),
            patch.object(crawl.time, "sleep"),
        ):
            result = crawl.crawl("example.com", "hiring-v2")

        dynamic_fetch.assert_called_once_with(ats_url, "example.com")
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["evidence"]["job_count"], 1)
        self.assertEqual(result["evidence"]["adapters"], ["ashby"])

    def test_follows_verified_ats_link_from_first_party_careers_page(self):
        homepage = SimpleNamespace(status=200)
        careers_page = SimpleNamespace(status=200)
        lever_page = SimpleNamespace(status=200)
        careers_url = "https://example.com/careers"
        lever_url = "https://jobs.lever.co/example"
        job = {
            "title": "Revenue Operations Manager",
            "department": "Revenue Operations",
            "location": "Remote",
            "posted_at": "2026-07-10",
            "source_url": f"{lever_url}/revops-manager",
        }

        with (
            patch.object(crawl, "assert_public_host", return_value=("8.8.8.8",)),
            patch.object(crawl, "robots_policy", return_value=None),
            patch.object(crawl, "fetch_static", side_effect=[homepage, careers_page, lever_page]),
            patch.object(crawl, "discover_candidates", side_effect=[[careers_url], [lever_url]]) as discover,
            patch.object(crawl, "parse_json_ld", side_effect=[[], [job]]),
            patch.object(crawl, "parse_job_links", return_value=[]),
            patch.object(crawl.time, "sleep"),
        ):
            result = crawl.crawl("example.com", "hiring-v2")

        self.assertEqual(discover.call_count, 2)
        self.assertEqual(result["evidence"]["adapters"], ["lever"])
        self.assertEqual(result["evidence"]["job_count"], 1)

    def test_follows_ats_link_rendered_by_javascript_on_careers_page(self):
        homepage = SimpleNamespace(status=200)
        static_careers_page = SimpleNamespace(status=200)
        dynamic_careers_page = object()
        lever_page = SimpleNamespace(status=200)
        careers_url = "https://example.com/careers"
        lever_url = "https://jobs.lever.co/example"
        job = {
            "title": "Sales Operations Director",
            "department": "Sales Operations",
            "location": "Remote",
            "posted_at": "2026-07-10",
            "source_url": f"{lever_url}/sales-operations-director",
        }

        def candidates(page, *_args, **_kwargs):
            if page is homepage:
                return [careers_url]
            if page is dynamic_careers_page:
                return [lever_url]
            return []

        with (
            patch.dict(crawl.os.environ, {"SCRAPLING_BROWSER_ENABLED": "true"}),
            patch.object(crawl, "assert_public_host", return_value=("8.8.8.8",)),
            patch.object(crawl, "robots_policy", return_value=None),
            patch.object(
                crawl,
                "fetch_static",
                side_effect=[homepage, static_careers_page, lever_page],
            ),
            patch.object(crawl, "discover_candidates", side_effect=candidates) as discover,
            patch.object(crawl, "fetch_dynamic", return_value=dynamic_careers_page) as dynamic_fetch,
            patch.object(crawl, "parse_json_ld", side_effect=[[], [], [job]]),
            patch.object(crawl, "parse_job_links", return_value=[]),
            patch.object(crawl.time, "sleep"),
        ):
            result = crawl.crawl("example.com", "hiring-v2")

        dynamic_fetch.assert_called_once_with(careers_url, "example.com")
        self.assertEqual(discover.call_count, 2)
        self.assertEqual(result["evidence"]["adapters"], ["lever"])
        self.assertEqual(result["evidence"]["job_count"], 1)

    def test_rejects_wrong_company_ats_tenant(self):
        jobs = [{
            "title": "Sales Manager",
            "location": "Remote",
            "source_url": "https://jobs.lever.co/acme/job-1",
            "organization_name": "Different Corporation",
            "organization_url": "https://different.example",
        }]
        with patch.object(crawl, "assert_public_host"):
            self.assertEqual(crawl.deduplicate_jobs(jobs, "acme.com"), [])

    def test_only_global_dns_addresses_are_accepted(self):
        self.assertFalse(ipaddress.ip_address("192.168.1.2").is_global)
        self.assertTrue(ipaddress.ip_address("8.8.8.8").is_global)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Constrained first-party careers crawler used by the hiring refresh worker."""

from __future__ import annotations

import argparse
import ipaddress
import json
import os
import re
import socket
import sys
import time
from datetime import datetime, timezone
from html import unescape
from typing import Any
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

from scrapling.fetchers import DynamicFetcher, Fetcher


USER_AGENT = "VesperWiseHiringBot/1.0 (+https://vesperwise.com)"
ATS_HOSTS = {
    "boards.greenhouse.io",
    "job-boards.greenhouse.io",
    "jobs.lever.co",
    "jobs.ashbyhq.com",
    "apply.workable.com",
}
ATS_ADAPTERS = {
    "boards.greenhouse.io": "greenhouse",
    "job-boards.greenhouse.io": "greenhouse",
    "jobs.lever.co": "lever",
    "jobs.ashbyhq.com": "ashby",
    "apply.workable.com": "workable",
}
CAREER_HINTS = ("career", "careers", "jobs", "open-positions", "join-us", "work-with-us")
JOB_PATH_HINTS = ("/job/", "/jobs/", "/position/", "/positions/", "/opening/", "/openings/")
MAX_CANDIDATE_PAGES = 20
REQUEST_DELAY_SECONDS = 1.0
MAX_RESPONSE_BYTES = 5 * 1024 * 1024


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def canonicalize_domain(value: str) -> str:
    parsed = urlparse(value if "://" in value else f"https://{value}")
    host = (parsed.hostname or "").rstrip(".").lower()
    try:
        host = host.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ValueError("Invalid domain") from exc
    if not host or "." not in host or len(host) > 253:
        raise ValueError("A public fully-qualified domain is required")
    try:
        ipaddress.ip_address(host)
    except ValueError:
        return host
    raise ValueError("IP address targets are not allowed")


def assert_public_host(host: str) -> tuple[str, ...]:
    addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
    if not addresses:
        raise ValueError(f"Unable to resolve {host}")
    validated: list[str] = []
    for item in addresses:
        address = ipaddress.ip_address(item[4][0])
        if not address.is_global:
            raise ValueError(f"Non-public address rejected for {host}")
        normalized = address.compressed
        if normalized not in validated:
            validated.append(normalized)
    return tuple(validated)


def is_allowed_host(host: str, company_domain: str) -> bool:
    return host == company_domain or host.endswith(f".{company_domain}") or host in ATS_HOSTS


def validate_url(url: str, company_domain: str) -> str:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    try:
        effective_port = parsed.port or 443
    except ValueError as exc:
        raise ValueError("URL has an invalid port") from exc
    if (
        parsed.scheme != "https"
        or parsed.username is not None
        or parsed.password is not None
        or effective_port != 443
        or not is_allowed_host(host, company_domain)
    ):
        raise ValueError("URL is outside the approved HTTPS domains")
    assert_public_host(host)
    return parsed._replace(fragment="").geturl()


def fetch_static(url: str, company_domain: str):
    current_url = validate_url(url, company_domain)
    for _ in range(6):
        host = urlparse(current_url).hostname or ""
        addresses = assert_public_host(host)
        # Pin the public addresses that passed validation so DNS rebinding
        # cannot swap in an internal address before the connection is made.
        from curl_cffi import CurlOpt

        pinned: list[str] = []
        for address in addresses:
            formatted_address = f"[{address}]" if ":" in address else address
            pinned.append(f"{host}:443:{formatted_address}")
        response = Fetcher.get(
            current_url,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"},
            stealthy_headers=False,
            follow_redirects=False,
            timeout=15,
            retries=1,
            retry_delay=1,
            curl_options={
                CurlOpt.RESOLVE: pinned,
                CurlOpt.MAXFILESIZE_LARGE: MAX_RESPONSE_BYTES,
            },
        )
        if response.status in {301, 302, 303, 307, 308}:
            location = response.headers.get("location")
            if not location:
                raise RuntimeError("Redirect response missing Location header")
            current_url = validate_url(urljoin(current_url, location), company_domain)
            time.sleep(REQUEST_DELAY_SECONDS)
            continue
        if len(response.body) > MAX_RESPONSE_BYTES:
            raise RuntimeError("Response body exceeds 5 MB limit")
        return response
    raise RuntimeError("Redirect limit exceeded")


def fetch_dynamic(url: str, company_domain: str):
    target_url = validate_url(url, company_domain)
    target_host = urlparse(target_url).hostname or ""
    addresses = assert_public_host(target_host)
    pinned_address = next((value for value in addresses if ":" not in value), addresses[0])
    resolver_address = f"[{pinned_address}]" if ":" in pinned_address else pinned_address

    def guard_requests(page) -> None:
        def handle(route) -> None:
            try:
                request_url = validate_url(route.request.url, company_domain)
                if (urlparse(request_url).hostname or "") != target_host:
                    raise ValueError("Cross-origin browser request rejected")
            except (OSError, ValueError):
                route.abort()
                return
            route.continue_()

        page.route("**/*", handle)

    return DynamicFetcher.fetch(
        target_url,
        headless=True,
        google_search=False,
        extra_headers={"User-Agent": USER_AGENT},
        network_idle=True,
        disable_resources=True,
        timeout=30_000,
        retries=0,
        page_setup=guard_requests,
        dns_over_https=False,
        extra_flags=[
            f"--host-resolver-rules=MAP {target_host} {resolver_address},EXCLUDE localhost",
            "--disable-features=AsyncDns",
        ],
    )


def robots_policy(base_url: str, company_domain: str) -> RobotFileParser | None:
    robots_url = urljoin(base_url, "/robots.txt")
    response = fetch_static(robots_url, company_domain)
    if response.status == 404:
        return None
    if response.status != 200:
        raise RuntimeError(f"robots.txt returned {response.status}")
    parser = RobotFileParser()
    parser.set_url(robots_url)
    parser.parse(response.body.decode(response.encoding or "utf-8", errors="replace").splitlines())
    return parser


def can_fetch(policy: RobotFileParser | None, url: str) -> bool:
    return policy is None or policy.can_fetch(USER_AGENT, url)


def clean_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", unescape(value or "")).strip()


def job_identifier(value: Any) -> str | None:
    if isinstance(value, dict):
        value = value.get("value") or value.get("name")
    if not isinstance(value, (str, int)):
        return None
    identifier = clean_text(str(value))
    return identifier or None


def normalized_posted_date(value: Any) -> str:
    if not isinstance(value, str) or not value.strip():
        return ""
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc)
        return parsed.date().isoformat()
    except ValueError:
        return ""


def flatten_json_ld(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        items: list[dict[str, Any]] = []
        for child in value:
            items.extend(flatten_json_ld(child))
        return items
    if not isinstance(value, dict):
        return []
    items = [value]
    graph = value.get("@graph")
    if graph:
        items.extend(flatten_json_ld(graph))
    return items


def parse_json_ld(page, page_url: str) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    for raw in page.css('script[type="application/ld+json"]::text').getall():
        try:
            payload = json.loads(raw)
        except (TypeError, json.JSONDecodeError):
            continue
        for item in flatten_json_ld(payload):
            item_type = item.get("@type")
            types = item_type if isinstance(item_type, list) else [item_type]
            if "JobPosting" not in types:
                continue
            location = item.get("jobLocation")
            if isinstance(location, list):
                location = location[0] if location else None
            if isinstance(location, dict):
                address = location.get("address", location)
                if isinstance(address, dict):
                    location = ", ".join(
                        clean_text(address.get(key))
                        for key in ("addressLocality", "addressRegion", "addressCountry")
                        if address.get(key)
                    )
            organization = item.get("hiringOrganization")
            organization_name = None
            organization_url = None
            if isinstance(organization, dict):
                organization_name = clean_text(organization.get("name")) or None
                raw_organization_url = organization.get("sameAs") or organization.get("url")
                if isinstance(raw_organization_url, list):
                    raw_organization_url = raw_organization_url[0] if raw_organization_url else None
                if isinstance(raw_organization_url, str):
                    organization_url = raw_organization_url
            raw_source_url = item.get("url")
            source_url = urljoin(page_url, raw_source_url) if isinstance(raw_source_url, str) else page_url
            jobs.append(
                {
                    "title": clean_text(item.get("title")),
                    "department": clean_text(item.get("occupationalCategory")) or None,
                    "location": clean_text(location if isinstance(location, str) else None) or None,
                    "posted_at": item.get("datePosted"),
                    "source_url": source_url,
                    "requisition_id": job_identifier(item.get("identifier")),
                    "organization_name": organization_name,
                    "organization_url": organization_url,
                }
            )
    return jobs


def parse_job_links(page, page_url: str) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    for anchor in page.css("a"):
        href = anchor.attrib.get("href")
        if not href:
            continue
        absolute = urljoin(page_url, href)
        path = urlparse(absolute).path.lower()
        if not any(hint in path for hint in JOB_PATH_HINTS):
            continue
        title = clean_text(" ".join(anchor.css("::text").getall()))
        if len(title) < 3:
            continue
        jobs.append(
            {
                "title": title,
                "department": None,
                "location": None,
                "posted_at": None,
                "source_url": absolute,
                "requisition_id": None,
            }
        )
    return jobs


def discover_candidates(
    page,
    company_domain: str,
    page_url: str | None = None,
    include_defaults: bool = True,
) -> list[str]:
    candidates: list[str] = []
    base_url = page_url or f"https://{company_domain}/"
    for href in page.css("a::attr(href)").getall():
        absolute = urljoin(base_url, href)
        parsed = urlparse(absolute)
        host = (parsed.hostname or "").lower()
        searchable = f"{host}{parsed.path}".lower()
        if is_allowed_host(host, company_domain) and (
            host in ATS_HOSTS or any(hint in searchable for hint in CAREER_HINTS)
        ):
            candidates.append(absolute)
    if include_defaults:
        candidates.extend(
            urljoin(f"https://{company_domain}/", path)
            for path in ("careers", "jobs", "company/careers")
        )

    result: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        try:
            validated = validate_url(candidate, company_domain)
        except (OSError, ValueError):
            continue
        if validated not in seen:
            seen.add(validated)
            result.append(validated)
        if len(result) >= MAX_CANDIDATE_PAGES:
            break
    return result


def normalize_entity(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def adapter_for_url(url: str, company_domain: str) -> str | None:
    host = (urlparse(url).hostname or "").lower()
    if host == company_domain or host.endswith(f".{company_domain}"):
        return "company"
    return ATS_ADAPTERS.get(host)


def matches_company_entity(job: dict[str, Any], company_domain: str) -> bool:
    source_host = (urlparse(job.get("source_url") or "").hostname or "").lower()
    if source_host == company_domain or source_host.endswith(f".{company_domain}"):
        return True

    organization_name = clean_text(job.get("organization_name"))
    organization_url = job.get("organization_url")
    if not organization_name and not organization_url:
        # The ATS tenant was linked from the official company site. Explicit
        # contradictory metadata is rejected below; missing metadata is kept.
        return source_host in ATS_HOSTS

    if isinstance(organization_url, str):
        organization_host = (urlparse(organization_url).hostname or "").lower()
        if organization_host == company_domain or organization_host.endswith(f".{company_domain}"):
            return True

    company_label = normalize_entity(company_domain.split(".")[0])
    normalized_name = normalize_entity(organization_name)
    return bool(
        company_label
        and normalized_name
        and (company_label in normalized_name or normalized_name in company_label)
    )


def deduplicate_jobs(jobs: list[dict[str, Any]], company_domain: str) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    seen: set[str] = set()
    for job in jobs:
        title = clean_text(job.get("title"))
        if not title:
            continue
        source_url = job.get("source_url")
        try:
            source_url = validate_url(source_url, company_domain)
        except (OSError, ValueError, TypeError):
            continue
        candidate = {
            **job,
            "title": title,
            "source_url": source_url,
            "adapter": adapter_for_url(source_url, company_domain),
        }
        if not matches_company_entity(candidate, company_domain):
            continue
        key = "|".join(
            (
                normalize_entity(title),
                normalize_entity(clean_text(job.get("department"))),
                normalize_entity(clean_text(job.get("location"))),
                normalized_posted_date(job.get("posted_at")),
                normalize_entity(clean_text(job.get("requisition_id"))),
            )
        )
        if key in seen:
            continue
        seen.add(key)
        result.append(candidate)
    return result


def crawl(domain: str, schema_version: str) -> dict[str, Any]:
    company_domain = canonicalize_domain(domain)
    assert_public_host(company_domain)
    homepage_url = f"https://{company_domain}/"
    policy = robots_policy(homepage_url, company_domain)
    if not can_fetch(policy, homepage_url):
        return result_payload(company_domain, schema_version, "unavailable", [], [], "robots_denied")

    time.sleep(REQUEST_DELAY_SECONDS)
    homepage = fetch_static(homepage_url, company_domain)
    if homepage.status >= 400:
        raise RuntimeError(f"homepage returned {homepage.status}")
    candidates = discover_candidates(homepage, company_domain)
    queued_candidates = set(candidates)
    jobs: list[dict[str, Any]] = []
    crawled_urls: list[str] = []
    policies: dict[str, RobotFileParser | None] = {homepage_url: policy}

    for url in candidates:
        candidate_origin = f"https://{urlparse(url).hostname}/"
        if candidate_origin not in policies:
            policies[candidate_origin] = robots_policy(candidate_origin, company_domain)
        candidate_policy = policies[candidate_origin]
        if not can_fetch(candidate_policy, url):
            continue
        time.sleep(REQUEST_DELAY_SECONDS)
        page = fetch_static(url, company_domain)
        if page.status >= 400:
            continue
        crawled_urls.append(url)
        discovery_page = page
        page_jobs = parse_json_ld(page, url) + parse_job_links(page, url)
        if not page_jobs and os.environ.get("SCRAPLING_BROWSER_ENABLED") == "true":
            time.sleep(REQUEST_DELAY_SECONDS)
            dynamic_page = fetch_dynamic(url, company_domain)
            discovery_page = dynamic_page
            page_jobs = parse_json_ld(dynamic_page, url) + parse_job_links(dynamic_page, url)
        jobs.extend(page_jobs)

        # Many companies link their ATS tenant from a first-party careers page,
        # not the homepage. Follow those verified links within the same bounded
        # candidate queue; never fan out from an ATS page.
        if adapter_for_url(url, company_domain) == "company":
            for nested in discover_candidates(
                discovery_page,
                company_domain,
                page_url=url,
                include_defaults=False,
            ):
                if adapter_for_url(nested, company_domain) not in ATS_ADAPTERS.values():
                    continue
                if nested in queued_candidates or len(candidates) >= MAX_CANDIDATE_PAGES:
                    continue
                queued_candidates.add(nested)
                candidates.append(nested)

    jobs = deduplicate_jobs(jobs, company_domain)
    status = "ok" if jobs else "no_signal"
    return result_payload(company_domain, schema_version, status, jobs, crawled_urls, "official_link")


def result_payload(
    domain: str,
    schema_version: str,
    status: str,
    jobs: list[dict[str, Any]],
    crawled_urls: list[str],
    entity_match: str,
) -> dict[str, Any]:
    fetched_at = utc_now()
    parsed_dates: list[datetime] = []
    for job in jobs:
        value = job.get("posted_at")
        if not isinstance(value, str):
            continue
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            else:
                parsed = parsed.astimezone(timezone.utc)
            parsed_dates.append(parsed)
        except ValueError:
            continue
    observed_at = (
        max(parsed_dates).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        if parsed_dates
        else None
    )
    adapter_urls = [job.get("source_url") or "" for job in jobs] if jobs else crawled_urls
    adapters = sorted(
        {
            adapter
            for url in adapter_urls
            if (adapter := adapter_for_url(url, domain)) is not None
        }
    )
    return {
        "domain": domain,
        "signal_type": "hiring",
        "source": "scrapling",
        "schema_version": schema_version,
        "status": status,
        "observed_at": observed_at,
        "fetched_at": fetched_at,
        "evidence": {
            "job_count": len(jobs),
            "jobs": jobs,
            "crawled_urls": crawled_urls,
            "adapters": adapters,
            "entity_match": entity_match,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", required=True)
    parser.add_argument("--schema-version", default="hiring-v2")
    args = parser.parse_args()
    try:
        payload = crawl(args.domain, args.schema_version)
    except Exception as exc:  # Worker retry policy handles transient failures.
        print(str(exc), file=sys.stderr)
        return 1
    print(json.dumps(payload, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

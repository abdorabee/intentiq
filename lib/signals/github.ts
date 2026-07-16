import type { SignalEvidence, SignalResult } from "@/lib/types";

const SOURCE = "github";

interface GitHubOrg {
  login: string;
  public_repos: number;
  public_members_url: string;
}

interface GitHubRepo {
  name: string;
  pushed_at: string | null;
  created_at: string | null;
}

interface GitHubSearchResult {
  items: Array<{ login: string }>;
}

interface GitHubRelease {
  published_at: string | null;
}

interface GitHubEvent {
  type: string;       // PushEvent | CreateEvent | ReleaseEvent | PullRequestEvent
  created_at: string | null;
  payload?: { ref_type?: string }; // CreateEvent: "repository" | "branch"
}

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return token
    ? { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
    : { Accept: "application/vnd.github+json" };
}

function companyNameFromDomain(domain: string): string {
  const hostname = domain.replace(/^https?:\/\//, "").split("/")[0];
  const parts = hostname.split(".");
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

async function resolveOrgLogin(
  companyName: string,
  signal?: AbortSignal
): Promise<string | null> {
  const directRes = await fetch(`https://api.github.com/orgs/${companyName}`, {
    headers: githubHeaders(),
    next: { revalidate: 86400 },
    signal,
  });
  if (directRes.ok) {
    const org = (await directRes.json()) as GitHubOrg;
    return org.login;
  }

  if (directRes.status === 404) {
    const searchRes = await fetch(
      `https://api.github.com/search/users?q=${encodeURIComponent(companyName)}+type:org&per_page=3`,
      { headers: githubHeaders(), next: { revalidate: 86400 }, signal }
    );
    if (!searchRes.ok) return null;
    const data = (await searchRes.json()) as GitHubSearchResult;
    return data.items?.[0]?.login ?? null;
  }

  return null;
}

export async function fetchGitHubSignal(
  domain: string,
  signal?: AbortSignal
): Promise<SignalResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const companyName = companyNameFromDomain(domain);
    const orgLogin = await resolveOrgLogin(companyName, signal);

    if (!orgLogin) {
      return {
        score: 0,
        max: 20,
        detail: "Org not found on GitHub",
        status: "not_found",
        observed_at: null,
        fetched_at: fetchedAt,
        source: SOURCE,
        evidence: [],
        metadata: { context_only: true },
      };
    }

    const now = Date.now();
    const thirtyDaysMs  = 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysMs   = 60 * 24 * 60 * 60 * 1000;
    const ninetyDaysMs  = 90 * 24 * 60 * 60 * 1000;

    // Fetch org info, public repos, events, and member count in parallel.
    // Events captures activity even when all repos are private.
    const [orgRes, reposRes, eventsRes, membersRes] = await Promise.all([
      fetch(`https://api.github.com/orgs/${orgLogin}`, {
        headers: githubHeaders(),
        next: { revalidate: 86400 },
        signal,
      }),
      fetch(`https://api.github.com/orgs/${orgLogin}/repos?sort=pushed&per_page=30&type=public`, {
        headers: githubHeaders(),
        next: { revalidate: 86400 },
        signal,
      }),
      // Public org events — includes pushes/releases even from private repos when event type is public
      fetch(`https://api.github.com/orgs/${orgLogin}/events?per_page=100`, {
        headers: githubHeaders(),
        next: { revalidate: 3600 }, // 1hr cache — events are time-sensitive
        signal,
      }),
      // Public member count — visible even for fully private orgs
      fetch(`https://api.github.com/orgs/${orgLogin}/public_members?per_page=11`, {
        headers: githubHeaders(),
        next: { revalidate: 86400 },
        signal,
      }),
    ]);

    if (!orgRes.ok) throw new Error("GitHub org fetch failed");

    const org         = (await orgRes.json()) as GitHubOrg;
    const repos       = reposRes.ok ? (await reposRes.json()) as GitHubRepo[] : [];
    const events      = eventsRes.ok ? (await eventsRes.json()) as GitHubEvent[] : [];

    // Only the >10 threshold is used below, so fetching 11 avoids inaccurate
    // pagination-based total estimates.
    let memberCount = 0;
    if (membersRes.ok) {
      const membersData = await membersRes.json() as unknown[];
      memberCount = membersData.length;
    }

    // ── Public repo signals ────────────────────────────────────────────────────

    const recentlyPushed = repos.filter((r) => {
      const pushed = r.pushed_at ? new Date(r.pushed_at).getTime() : 0;
      return now - pushed < thirtyDaysMs;
    });

    const newRepos = repos.filter((r) => {
      const created = r.created_at ? new Date(r.created_at).getTime() : 0;
      return now - created < ninetyDaysMs;
    });

    // Check releases on top 5 recently pushed public repos
    const topRepos = recentlyPushed.slice(0, 5);
    const releaseChecks = await Promise.all(
      topRepos.map((r) =>
        fetch(`https://api.github.com/repos/${orgLogin}/${r.name}/releases?per_page=5`, {
          headers: githubHeaders(),
          next: { revalidate: 86400 },
          signal,
        })
          .then((res) => (res.ok ? (res.json() as Promise<GitHubRelease[]>) : []))
          .catch((error) => {
            if (signal?.aborted) throw error;
            return [] as GitHubRelease[];
          })
      )
    );

    const publicReleases = releaseChecks.flat().filter((rel) => {
      const pub = rel.published_at ? new Date(rel.published_at).getTime() : 0;
      return now - pub < sixtyDaysMs;
    });

    // ── Event signals (work even for private repos) ────────────────────────────

    const recentEvents = events.filter((e) => {
      const ts = e.created_at ? new Date(e.created_at).getTime() : 0;
      return now - ts < thirtyDaysMs;
    });

    const pushEvents    = recentEvents.filter((e) => e.type === "PushEvent").length;
    const repoCreations = recentEvents.filter(
      (e) => e.type === "CreateEvent" && e.payload?.ref_type === "repository"
    ).length;
    const releaseEvents = recentEvents.filter((e) => e.type === "ReleaseEvent").length;

    // ── Scoring ───────────────────────────────────────────────────────────────

    let score = 0;
    const details: string[] = [];

    // Activity signal: use whichever is stronger — public repo pushes or event stream pushes
    const pushActivity = Math.max(recentlyPushed.length, pushEvents > 0 ? Math.ceil(pushEvents / 3) : 0);
    if (pushActivity >= 10)      { score += 8; details.push(`${pushActivity}+ repos active last 30d`); }
    else if (pushActivity >= 5)  { score += 6; details.push(`${pushActivity} repos active last 30d`); }
    else if (pushActivity >= 2)  { score += 4; details.push(`${pushActivity} repos active last 30d`); }
    else if (pushActivity === 1) { score += 2; details.push(`1 repo active last 30d`); }
    else if (pushEvents > 0)     { score += 2; details.push(`${pushEvents} push events last 30d`); }

    // New repo / creation signal
    const newRepoCount = Math.max(newRepos.length, repoCreations);
    if (newRepoCount >= 3)      { score += 6; details.push(`${newRepoCount} new repos last 90d`); }
    else if (newRepoCount === 2) { score += 4; details.push(`2 new repos last 90d`); }
    else if (newRepoCount === 1) { score += 2; details.push(`1 new repo last 90d`); }

    // Release cadence
    const releaseCount = Math.max(publicReleases.length, releaseEvents);
    if (releaseCount >= 2)      { score += 4; details.push(`${releaseCount} releases last 60d`); }
    else if (releaseCount === 1) { score += 2; details.push(`1 release last 60d`); }

    // Team size proxy — org size (public repos) + visible member count
    if (org.public_repos > 20 || memberCount > 10) {
      score += 2;
      const sizeHint = memberCount > 0
        ? `${memberCount}+ visible members`
        : `${org.public_repos} public repos`;
      details.push(sizeHint);
    }

    const evidence: SignalEvidence[] = [];
    const organizationUrl = `https://github.com/${orgLogin}`;
    const activityDates = [
      ...recentlyPushed.map((repo) => repo.pushed_at),
      ...newRepos.map((repo) => repo.created_at),
      ...publicReleases.map((release) => release.published_at),
      ...recentEvents.map((event) => event.created_at),
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .filter((date) => Number.isFinite(date.getTime()));
    const latestActivity = activityDates.reduce<Date | null>(
      (latest, date) => (!latest || date > latest ? date : latest),
      null
    );

    if (pushActivity > 0 && latestActivity) {
      evidence.push({
        label: `${pushActivity} active repository signal(s)`,
        observed_at: latestActivity.toISOString(),
        source: SOURCE,
        fetched_at: fetchedAt,
        source_url: organizationUrl,
        metadata: { push_activity: pushActivity },
      });
    }
    if (newRepoCount > 0) {
      const latestCreated = newRepos
        .map((repo) => repo.created_at ? new Date(repo.created_at) : null)
        .filter((date): date is Date => date !== null && Number.isFinite(date.getTime()))
        .reduce<Date | null>((latest, date) => (!latest || date > latest ? date : latest), null);
      evidence.push({
        label: `${newRepoCount} new repository signal(s)`,
        observed_at: latestCreated?.toISOString() ?? latestActivity?.toISOString() ?? null,
        source: SOURCE,
        fetched_at: fetchedAt,
        source_url: organizationUrl,
        metadata: { new_repositories: newRepoCount },
      });
    }
    if (releaseCount > 0) {
      evidence.push({
        label: `${releaseCount} recent release signal(s)`,
        observed_at: latestActivity?.toISOString() ?? null,
        source: SOURCE,
        fetched_at: fetchedAt,
        source_url: organizationUrl,
        metadata: { releases: releaseCount },
      });
    }
    if (org.public_repos > 20 || memberCount > 10) {
      evidence.push({
        label: "GitHub organization size snapshot",
        observed_at: fetchedAt,
        source: SOURCE,
        fetched_at: fetchedAt,
        source_url: organizationUrl,
        metadata: { public_repositories: org.public_repos, visible_members_at_least: memberCount },
      });
    }

    const observedAt = latestActivity?.toISOString() ?? (score > 0 ? fetchedAt : null);

    return {
      score: Math.min(score, 20),
      max: 20,
      detail: details.length > 0
        ? details.join("; ")
        : "No recent public GitHub activity detected",
      status: score > 0 ? "ok" : "no_signal",
      observed_at: observedAt,
      fetched_at: fetchedAt,
      source: SOURCE,
      evidence,
      metadata: {
        organization: orgLogin,
        public_repositories: org.public_repos,
        visible_members_at_least: memberCount,
        context_only: true,
      },
    };
  } catch (error) {
    return {
      score: 0,
      max: 20,
      detail: "GitHub data unavailable",
      status: "unavailable",
      observed_at: null,
      fetched_at: fetchedAt,
      source: SOURCE,
      evidence: [],
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
        context_only: true,
      },
    };
  }
}

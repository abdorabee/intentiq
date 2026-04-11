// lib/apollo.ts
import type { ApolloPersonData } from "@/lib/types";

const USE_MOCK = process.env.MOCK_SIGNALS === "true";

interface ApolloMatchInput {
  email?: string;
  linkedin_url?: string;
  name?: string;
  organization_name?: string;
}

/**
 * Enrich a person using Apollo.io People Match API.
 * Returns structured person data or null on failure.
 */
export async function enrichPerson(input: ApolloMatchInput): Promise<ApolloPersonData | null> {
  if (USE_MOCK) {
    const identifier = input.email ?? input.linkedin_url ?? input.name ?? "unknown";
    return getMockApolloData(identifier);
  }

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    console.warn("[apollo] APOLLO_API_KEY not set, using mock data");
    const identifier = input.email ?? input.linkedin_url ?? input.name ?? "unknown";
    return getMockApolloData(identifier);
  }

  try {
    // Build request body based on available input
    const body: Record<string, string> = {};

    if (input.email) {
      body.email = input.email;
    } else if (input.linkedin_url) {
      body.linkedin_url = input.linkedin_url;
    } else if (input.name && input.organization_name) {
      const parts = input.name.trim().split(/\s+/);
      body.first_name = parts[0] ?? "";
      body.last_name = parts.slice(1).join(" ") || "";
      body.organization_name = input.organization_name;
    } else {
      console.warn("[apollo] Insufficient input for enrichment");
      return null;
    }

    const res = await fetch("https://api.apollo.io/api/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`[apollo] API error ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const person = data.person ?? data;

    if (!person || (!person.name && !person.first_name)) {
      console.warn("[apollo] No person found for input:", input);
      return null;
    }

    return {
      first_name: person.first_name ?? null,
      last_name: person.last_name ?? null,
      name: person.name ?? ([person.first_name, person.last_name].filter(Boolean).join(" ") || null),
      title: person.title ?? null,
      seniority: person.seniority ?? null,
      department: person.departments?.[0] ?? person.department ?? null,
      email: person.email ?? null,
      phone: person.phone_numbers?.[0]?.sanitized_number ?? person.phone ?? null,
      linkedin_url: person.linkedin_url ?? null,
      organization_name: person.organization?.name ?? person.organization_name ?? null,
      organization: person.organization ? { primary_domain: person.organization.primary_domain ?? person.organization.website_url } : undefined,
      employment_history: (person.employment_history ?? []).map((eh: Record<string, unknown>) => ({
        title: (eh.title as string) ?? "",
        organization_name: (eh.organization_name as string) ?? "",
        start_date: (eh.start_date as string) ?? null,
        end_date: (eh.end_date as string) ?? null,
        current: (eh.current as boolean) ?? false,
      })),
    };
  } catch (err) {
    console.error("[apollo] enrichment failed:", err);
    return null;
  }
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

function seedHash(str: string): number {
  return str.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

const MOCK_TITLES = ["VP of Sales", "Head of Revenue", "Director of Marketing", "CTO", "VP Engineering", "Head of Growth", "Senior Account Executive", "Chief Revenue Officer"];
const MOCK_SENIORITIES = ["c_suite", "vp", "director", "manager", "senior", "entry"];
const MOCK_DEPARTMENTS = ["sales", "marketing", "engineering", "operations", "finance", "executive"];
const MOCK_COMPANIES = ["Acme Corp", "TechFlow Inc", "DataSync Systems", "CloudFirst", "GrowthLabs", "Nexus AI"];

export function getMockApolloData(identifier: string): ApolloPersonData {
  const seed = seedHash(identifier);
  const pick = <T>(arr: T[]) => arr[seed % arr.length];

  const firstName = identifier.includes("@")
    ? identifier.split("@")[0].charAt(0).toUpperCase() + identifier.split("@")[0].slice(1)
    : identifier.split(" ")[0] || "Alex";
  const lastName = identifier.includes("@")
    ? identifier.split("@")[0].length > 4 ? "Johnson" : "Chen"
    : identifier.split(" ").slice(1).join(" ") || "Morgan";

  const company = identifier.includes("@")
    ? identifier.split("@")[1]?.split(".")[0]?.charAt(0).toUpperCase() + identifier.split("@")[1]?.split(".")[0]?.slice(1) || pick(MOCK_COMPANIES)
    : pick(MOCK_COMPANIES);

  const domain = identifier.includes("@")
    ? identifier.split("@")[1] || "acme.com"
    : `${company.toLowerCase().replace(/\s+/g, "")}.com`;

  // Generate employment history with a recent job change for ~50% of people
  const hasRecentChange = seed % 2 === 0;
  const now = new Date();

  return {
    first_name: firstName,
    last_name: lastName,
    name: `${firstName} ${lastName}`,
    title: pick(MOCK_TITLES),
    seniority: pick(MOCK_SENIORITIES),
    department: pick(MOCK_DEPARTMENTS),
    email: identifier.includes("@") ? identifier : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    phone: seed % 3 === 0 ? "+1-555-" + String(seed).padStart(4, "0").slice(0, 4) : null,
    linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    organization_name: company,
    organization: { primary_domain: domain },
    employment_history: hasRecentChange
      ? [
          {
            title: pick(MOCK_TITLES),
            organization_name: company,
            start_date: new Date(now.getTime() - (seed % 60 + 15) * 86400000).toISOString().split("T")[0],
            end_date: null,
            current: true,
          },
          {
            title: "Senior Manager",
            organization_name: "Previous Corp",
            start_date: "2022-03-01",
            end_date: new Date(now.getTime() - (seed % 60 + 15) * 86400000).toISOString().split("T")[0],
            current: false,
          },
        ]
      : [
          {
            title: pick(MOCK_TITLES),
            organization_name: company,
            start_date: "2021-06-15",
            end_date: null,
            current: true,
          },
        ],
  };
}

import type { ApolloPersonData } from "@/lib/types";
import { getMockApolloData } from "@/lib/apollo";

const USE_MOCK = process.env.MOCK_SIGNALS === "true";

export interface EnrichPersonInput {
  email?: string;
  linkedin_url?: string;
  name?: string;
  organization_name?: string;
  title?: string;
}

// ─── Seniority Inference ─────────────────────────────────────────────────────

function inferSeniorityFromTitle(title: string | null): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (/\b(ceo|cto|cfo|coo|cmo|cro|chief)\b/.test(t)) return "c_suite";
  if (/\b(founder|co-founder|cofounder)\b/.test(t)) return "founder";
  if (/\b(owner)\b/.test(t)) return "owner";
  if (/\bvp\b|\bvice\s*president\b/.test(t)) return "vp";
  if (/\bdirector\b/.test(t)) return "director";
  if (/\b(manager|head\s+of)\b/.test(t)) return "manager";
  if (/\bsenior\b|\bsr\.?\b|\blead\b|\bprincipal\b/.test(t)) return "senior";
  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inferDepartmentFromTitle(title: string | null): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (/\b(sales|revenue|account executive|business development|bdr|sdr)\b/.test(t)) return "sales";
  if (/\b(marketing|growth|demand gen|content|brand)\b/.test(t)) return "marketing";
  if (/\b(engineer|developer|software|devops|sre|backend|frontend|fullstack)\b/.test(t)) return "engineering";
  if (/\b(product|pm)\b/.test(t)) return "product";
  if (/\b(finance|cfo|accounting|controller)\b/.test(t)) return "finance";
  if (/\b(operations|ops|coo)\b/.test(t)) return "operations";
  if (/\b(hr|human resources|people|talent|recruiting)\b/.test(t)) return "human resources";
  if (/\b(design|ux|ui|creative)\b/.test(t)) return "design";
  if (/\b(legal|counsel|compliance)\b/.test(t)) return "legal";
  if (/\b(ceo|cto|cmo|cro|chief|founder|co-founder|president)\b/.test(t)) return "executive";
  return null;
}

function parseName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] ?? "",
    last: parts.slice(1).join(" ") || "",
  };
}

function domainFromCompany(company: string): string {
  return company.toLowerCase().replace(/[^a-z0-9]+/g, "") + ".com";
}

// ─── Main Enrichment Function ────────────────────────────────────────────────

/**
 * Build ApolloPersonData from user-provided input.
 * No external API calls — zero cost, instant, always works.
 */
export async function enrichPerson(input: EnrichPersonInput): Promise<ApolloPersonData | null> {
  const identifier = input.email ?? input.linkedin_url ?? input.name ?? "unknown";

  if (USE_MOCK) {
    return getMockApolloData(identifier);
  }

  // We need at least a name or email to build a profile
  if (!input.name && !input.email && !input.linkedin_url) {
    console.warn("[enrich] Insufficient input for enrichment");
    return null;
  }

  // Extract name from LinkedIn URL slug if no name provided
  let personName = input.name ?? null;
  if (!personName && input.linkedin_url) {
    const slug = input.linkedin_url.match(/linkedin\.com\/in\/([^/?]+)/)?.[1];
    if (slug) {
      personName = slug
        .replace(/-\w+$/, "") // remove trailing hash
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  if (!personName && input.email) {
    const local = input.email.split("@")[0] ?? "";
    personName = local
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (!personName) {
    console.warn("[enrich] Could not determine person name");
    return null;
  }

  const { first, last } = parseName(personName);
  const title = input.title ?? null;
  const company = input.organization_name ?? null;
  const linkedinUrl = input.linkedin_url?.replace(/\/+$/, "") ?? null;
  const email = input.email ?? null;
  const domain = company ? domainFromCompany(company) : (email ? email.split("@")[1] ?? null : null);

  // Build a minimal employment history entry for the current role
  const today = new Date().toISOString().split("T")[0];
  const employmentHistory: ApolloPersonData["employment_history"] = [];
  if (title && company) {
    employmentHistory.push({
      title,
      organization_name: company,
      start_date: today,
      end_date: null,
      current: true,
    });
  }

  console.log(`[enrich] Built profile from input: ${personName}${title ? `, ${title}` : ""}${company ? ` at ${company}` : ""}`);

  return {
    first_name: first,
    last_name: last,
    name: personName,
    title,
    seniority: inferSeniorityFromTitle(title),
    department: inferDepartmentFromTitle(title),
    email,
    phone: null,
    linkedin_url: linkedinUrl,
    organization_name: company,
    organization: domain ? { primary_domain: domain } : undefined,
    employment_history: employmentHistory,
  };
}

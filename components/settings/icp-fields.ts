import type { BusinessProfile } from "@/lib/types";

export interface ProfileField {
  id: keyof BusinessProfile;
  label: string;
  question: string;
  options: string[];
  multiSelect?: boolean;
}

export const FIELDS: ProfileField[] = [
  {
    id: "product_category",
    label: "What You Sell",
    question: "What best describes what you sell?",
    options: ["SaaS / Software", "Consulting / Services", "Hardware / Physical", "Marketplace / Platform"],
  },
  {
    id: "target_industries",
    label: "Target Industries",
    question: "Which industries do you primarily sell into?",
    options: ["Technology", "Financial Services", "Healthcare", "E-commerce / Retail", "Manufacturing", "Education"],
    multiSelect: true,
  },
  {
    id: "company_size",
    label: "Ideal Company Size",
    question: "What size companies are your ideal customers?",
    options: ["Startups (1-50)", "SMB (51-200)", "Mid-Market (201-1000)", "Enterprise (1000+)"],
  },
  {
    id: "buyer_role",
    label: "Primary Buyer",
    question: "Who is your primary buyer?",
    options: ["C-Suite / Founders", "VP / Director", "Manager / Team Lead", "Individual Contributor"],
  },
  {
    id: "sales_motion",
    label: "Sales Motion",
    question: "How does your team primarily sell?",
    options: ["Outbound (cold outreach)", "Inbound (content/SEO/ads)", "Product-Led Growth", "Channel / Partners"],
  },
  {
    id: "deal_size",
    label: "Deal Size",
    question: "What's your typical deal size?",
    options: ["< $5K", "$5K - $25K", "$25K - $100K", "$100K+"],
  },
  {
    id: "sales_cycle",
    label: "Sales Cycle",
    question: "How long is your typical sales cycle?",
    options: ["< 2 weeks", "2-4 weeks", "1-3 months", "3+ months"],
  },
];

export function buildSummary(profile: BusinessProfile): string {
  const parts: string[] = [];

  if (profile.product_category) parts.push(`You sell ${profile.product_category}`);

  if (profile.target_industries?.length) {
    const inds = profile.target_industries.slice(0, 2).join(" and ");
    const more = profile.target_industries.length > 2 ? ` (+${profile.target_industries.length - 2} more)` : "";
    parts.push(`to ${inds}${more} companies`);
  }

  if (profile.company_size) parts.push(`of ${profile.company_size} size`);
  if (profile.buyer_role) parts.push(`with ${profile.buyer_role} buyers`);
  if (profile.deal_size) parts.push(`at ${profile.deal_size} deals`);
  if (profile.sales_cycle) parts.push(`and ${profile.sales_cycle} sales cycles`);

  return parts.join(", ") + ".";
}

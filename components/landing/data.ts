export const MARQUEE_COMPANIES = [
  { name: "Stripe",     score: 91, band: "HOT"  },
  { name: "Notion",     score: 78, band: "HOT"  },
  { name: "Linear",     score: 82, band: "HOT"  },
  { name: "Vercel",     score: 67, band: "WARM" },
  { name: "Figma",      score: 71, band: "WARM" },
  { name: "Loom",       score: 44, band: "COLD" },
  { name: "Intercom",   score: 88, band: "HOT"  },
  { name: "Hubspot",    score: 55, band: "WARM" },
  { name: "Salesforce", score: 93, band: "HOT"  },
  { name: "Mixpanel",   score: 38, band: "COLD" },
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit a domain",
    body: "Pass any company domain via our REST API or the dashboard UI. No CRM integration required.",
  },
  {
    step: "02",
    title: "4 intent triggers fetched in parallel",
    body: "Funding rounds, hiring velocity, non-funding news triggers, and dated technology changes — with web and GitHub as context.",
  },
  {
    step: "03",
    title: "Weighted intent score computed",
    body: "A composite 0–100 score with configurable signal weights. HOT ≥75, WARM ≥50, COLD <50.",
  },
  {
    step: "04",
    title: "AI reasoning + recommended action",
    body: "A bounded AI request generates a plain-English summary, a 'why now' insight, and a specific outreach action, with a deterministic fallback.",
  },
];

export const SIGNALS = [
  { name: "FUNDING INTELLIGENCE", category: "Series rounds, valuations, investor data", weight: "22 rel." },
  { name: "HIRING VELOCITY", category: "Open roles, growth rate, team expansion", weight: "19 rel." },
  { name: "NEWS TRIGGERS", category: "Non-funding launches, partnerships, leadership", weight: "18 rel." },
  { name: "TECHNOLOGY CHANGES", category: "Dated adoptions, migrations, modernization", weight: "18 rel." },
  { name: "WEB + GITHUB", category: "Account context only", weight: "context" },
];

export const CODE_EXAMPLES = {
  curl: `curl "https://intentiq.com/api/v1/score?domain=acme.com" \\
  -H "Authorization: Bearer YOUR_KEY"`,
  javascript: `const score = await fetch(
  'https://intentiq.com/api/v1/score?domain=acme.com',
  { headers: { Authorization: 'Bearer YOUR_KEY' } }
).then(r => r.json());`,
  python: `import requests
score = requests.get(
    'https://intentiq.com/api/v1/score',
    params={'domain': 'acme.com'},
    headers={'Authorization': 'Bearer YOUR_KEY'}
).json()`,
};

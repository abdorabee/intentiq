export const PRICING = [
  { plan: "Free",    price: "$0",    credits: "20",     cta: "Start Free" },
  { plan: "Starter", price: "$49",   credits: "500",    cta: "Get Started" },
  { plan: "Growth",  price: "$149",  credits: "2,500",  cta: "Get Started", highlight: true },
  { plan: "Pro",     price: "$299",  credits: "8,000",  cta: "Get Started" },
  { plan: "Agency",  price: "$499",  credits: "25,000", cta: "Get Started" },
];

export const COMPARISON = [
  { name: "6sense",          price: "$50K+/yr", smb: false, api: false, ai: false, mena: false },
  { name: "Bombora",         price: "$25K+/yr", smb: false, api: false, ai: false, mena: false },
  { name: "ZoomInfo Intent", price: "$15K+/yr", smb: false, api: false, ai: false, mena: true  },
  { name: "Apollo Intent",   price: "$49/mo+",  smb: true,  api: true,  ai: false, mena: true  },
  { name: "IntentIQ",        price: "$49/mo",   smb: true,  api: true,  ai: true,  mena: true, you: true },
];

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
    title: "5 live signals fetched in parallel",
    body: "Funding rounds, hiring velocity, news triggers, tech stack, and web presence — all fetched simultaneously.",
  },
  {
    step: "03",
    title: "Weighted intent score computed",
    body: "A composite 0–100 score with configurable signal weights. HOT ≥75, WARM ≥50, COLD <50.",
  },
  {
    step: "04",
    title: "AI reasoning + recommended action",
    body: "Claude generates a plain-English summary, a 'why now' insight, and a specific outreach action to take.",
  },
];

export const SIGNALS = [
  { name: "FUNDING INTELLIGENCE", category: "Series rounds, valuations, investor data", weight: "25%" },
  { name: "HIRING VELOCITY", category: "Open roles, growth rate, team expansion", weight: "20%" },
  { name: "NEWS TRIGGERS", category: "Press mentions, product launches, partnerships", weight: "20%" },
  { name: "TECHNOLOGY STACK", category: "Tools adopted, migrations, modernization", weight: "20%" },
  { name: "WEB PRESENCE", category: "Traffic trends, domain authority, growth signals", weight: "15%" },
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

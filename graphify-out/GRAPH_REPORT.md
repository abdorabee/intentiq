# Graph Report - d:\projects\intentiq  (2026-05-28)

## Corpus Check
- 212 files · ~122,086 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1089 nodes · 2152 edges · 78 communities (60 shown, 18 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Billing & Plans|Billing & Plans]]
- [[_COMMUNITY_Autopilot|Autopilot]]
- [[_COMMUNITY_REST API Routes|REST API Routes]]
- [[_COMMUNITY_Watchlist UI|Watchlist UI]]
- [[_COMMUNITY_Person Scoring|Person Scoring]]
- [[_COMMUNITY_Landing|Landing]]
- [[_COMMUNITY_Signals|Signals]]
- [[_COMMUNITY_Signals|Signals]]
- [[_COMMUNITY_Pipeline|Pipeline]]
- [[_COMMUNITY_Pipeline|Pipeline]]
- [[_COMMUNITY_Scoring|Scoring]]
- [[_COMMUNITY_Lists|Lists]]
- [[_COMMUNITY_Inbox|Inbox]]
- [[_COMMUNITY_UI Primitives|UI Primitives]]
- [[_COMMUNITY_Lists|Lists]]
- [[_COMMUNITY_Landing|Landing]]
- [[_COMMUNITY_Layout Shell|Layout Shell]]
- [[_COMMUNITY_Contact Legal|Contact Legal]]
- [[_COMMUNITY_Autopilot API|Autopilot API]]
- [[_COMMUNITY_Redis Cache|Redis Cache]]
- [[_COMMUNITY_Autopilot Types|Autopilot Types]]
- [[_COMMUNITY_Score Service|Score Service]]
- [[_COMMUNITY_Lists Data|Lists Data]]
- [[_COMMUNITY_Person Scoring|Person Scoring]]
- [[_COMMUNITY_CSV Utils|CSV Utils]]
- [[_COMMUNITY_Apollo PDL|Apollo PDL]]
- [[_COMMUNITY_List Evaluator|List Evaluator]]
- [[_COMMUNITY_Chat Copilot|Chat Copilot]]
- [[_COMMUNITY_Signal Fetchers|Signal Fetchers]]
- [[_COMMUNITY_Scorer Core|Scorer Core]]
- [[_COMMUNITY_Mock Signals|Mock Signals]]
- [[_COMMUNITY_Dashboard Nav|Dashboard Nav]]
- [[_COMMUNITY_AI Reasoning|AI Reasoning]]
- [[_COMMUNITY_Person Score Service|Person Score Service]]
- [[_COMMUNITY_Workflow Cards|Workflow Cards]]
- [[_COMMUNITY_BuiltWith Web|BuiltWith Web]]
- [[_COMMUNITY_Polar Billing|Polar Billing]]
- [[_COMMUNITY_Onboarding|Onboarding]]
- [[_COMMUNITY_Theme Provider|Theme Provider]]
- [[_COMMUNITY_Score API v1|Score API v1]]
- [[_COMMUNITY_Watchlist Events|Watchlist Events]]
- [[_COMMUNITY_Search Palette|Search Palette]]
- [[_COMMUNITY_List Detail|List Detail]]
- [[_COMMUNITY_Utils cn|Utils cn]]
- [[_COMMUNITY_Funding Signal|Funding Signal]]
- [[_COMMUNITY_Hiring Signal|Hiring Signal]]
- [[_COMMUNITY_Hero Section|Hero Section]]
- [[_COMMUNITY_OpenGraph|OpenGraph]]
- [[_COMMUNITY_Auth Login|Auth Login]]
- [[_COMMUNITY_Onboarding Chat|Onboarding Chat]]
- [[_COMMUNITY_Pricing Section|Pricing Section]]
- [[_COMMUNITY_Code Demo|Code Demo]]
- [[_COMMUNITY_Trust Strip|Trust Strip]]
- [[_COMMUNITY_Testimonials|Testimonials]]
- [[_COMMUNITY_Prioritize API|Prioritize API]]
- [[_COMMUNITY_Auth Signup|Auth Signup]]
- [[_COMMUNITY_SSO Callback|SSO Callback]]
- [[_COMMUNITY_Sitemap Robots|Sitemap Robots]]
- [[_COMMUNITY_How It Works|How It Works]]
- [[_COMMUNITY_Stats Section|Stats Section]]
- [[_COMMUNITY_CTA Footer|CTA Footer]]
- [[_COMMUNITY_Developers Section|Developers Section]]
- [[_COMMUNITY_Autopilot Feature|Autopilot Feature]]
- [[_COMMUNITY_Onboarding Gate|Onboarding Gate]]
- [[_COMMUNITY_Quick Score|Quick Score]]

## God Nodes (most connected - your core abstractions)
1. `createSupabaseAdmin()` - 117 edges
2. `cn()` - 61 edges
3. `scoreCompany()` - 29 edges
4. `BillingStats` - 19 edges
5. `SignalSet` - 17 edges
6. `scorePerson()` - 16 edges
7. `BusinessProfile` - 15 edges
8. `DbAutopilotWorkflow` - 15 edges
9. `ScoreBand` - 14 edges
10. `HistoryView()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `BulkResult` --references--> `SignalSet`  [EXTRACTED]
  app/(dashboard)/bulk/page.tsx → lib/types.ts
- `DashboardPage()` --calls--> `createSupabaseAdmin()`  [EXTRACTED]
  app/(dashboard)/dashboard/page.tsx → lib/supabase.ts
- `HistoryPage()` --calls--> `createSupabaseAdmin()`  [EXTRACTED]
  app/(dashboard)/history/page.tsx → lib/supabase.ts
- `InboxPage()` --calls--> `createSupabaseAdmin()`  [EXTRACTED]
  app/(dashboard)/inbox/page.tsx → lib/supabase.ts
- `ListDetailPage()` --calls--> `buildListDetailForId()`  [EXTRACTED]
  app/(dashboard)/lists/[id]/page.tsx → lib/lists-data.ts

## Communities (78 total, 18 thin omitted)

### Community 0 - "Billing & Plans"
Cohesion: 0.05
Nodes (62): BillingCostBreakdown(), BillingCostBreakdownProps, daysElapsed(), formatCycleRange(), BillingDangerZone(), BillingDangerZoneProps, BillingHelpRow(), BillingHelpRowProps (+54 more)

### Community 1 - "Autopilot"
Cohesion: 0.05
Nodes (57): ACTION_LABELS, ActionRowProps, AutopilotViewProps, CONDITION_LABELS, ConditionRowProps, FireHistoryChartProps, FlowCanvasProps, RunHistoryProps (+49 more)

### Community 2 - "REST API Routes"
Cohesion: 0.07
Nodes (35): DELETE(), GET(), POST(), GET(), DELETE(), GET(), PATCH(), DELETE() (+27 more)

### Community 3 - "Watchlist UI"
Cohesion: 0.09
Nodes (34): WatchlistEntry, avIndex(), bandColor(), buildLastMoveLabel(), buildSparkline(), buildWatchlistStats(), formatRelativeTime(), getAvatarClass() (+26 more)

### Community 4 - "Person Scoring"
Cohesion: 0.10
Nodes (29): scorePerson(), ScorePersonOptions, computePersonIntentScore(), getDaysSince(), getScoreBand(), PERSON_WEIGHTS, personScoreCacheKey(), ScoreCompanyOptions (+21 more)

### Community 5 - "Landing"
Cohesion: 0.07
Nodes (13): BracketButtonProps, Tab, CODE_EXAMPLES, COMPARISON, HOW_IT_WORKS, MARQUEE_COMPANIES, PRICING, SIGNALS (+5 more)

### Community 6 - "Signals"
Cohesion: 0.11
Nodes (25): parseCSV(), POST(), createInboxNotification(), CreateNotificationPayload, cacheGet(), cacheSet(), getRedis(), scoreCacheKey() (+17 more)

### Community 7 - "Signals"
Cohesion: 0.10
Nodes (26): AV_COLORS, avColor(), computeDeltas(), countFiringSignals(), deltaColor(), DrawerRing(), fmtRowTime(), fmtScoredWhen() (+18 more)

### Community 8 - "Pipeline"
Cohesion: 0.08
Nodes (22): AV_COLORS, avColor(), KanbanCard(), PipelinePage(), priorityFromUrgency(), PriorityLevel, relTime(), SIGNAL_LABELS (+14 more)

### Community 9 - "Pipeline"
Cohesion: 0.09
Nodes (22): GET(), POST(), DashboardPage(), computeStage(), updatePipelineStage(), BulkJobResponse, BulkScoreRequest, ConversationSignal (+14 more)

### Community 10 - "Scoring"
Cohesion: 0.09
Nodes (20): ScorePage(), AV_COLORS, avColor(), bandClass(), CompetitiveAnalysis(), CompetitiveAnalysisProps, HOT_PICKS, MiniPromptProps (+12 more)

### Community 11 - "Lists"
Cohesion: 0.11
Nodes (22): DELETE(), GET(), PATCH(), RouteCtx, EvalContext, evaluateRule(), filterAccountsByRules(), ruleToDisplayParts() (+14 more)

### Community 12 - "Inbox"
Cohesion: 0.14
Nodes (17): avatarIndex(), EventCard(), InboxDetail(), InboxDetailProps, InboxList(), InboxListProps, VIEW_LABELS, ViewFilter (+9 more)

### Community 13 - "UI Primitives"
Cohesion: 0.17
Nodes (17): DashboardPageShell(), cn(), Label(), Progress(), Table(), TableBody(), TableCaption(), TableCell() (+9 more)

### Community 14 - "Lists"
Cohesion: 0.21
Nodes (19): buildListDetailForId(), buildListsOverview(), computeAvgFromMembers(), computePriorAvg(), ensureDefaultList(), fetchAccountPool(), fetchListMembers(), fetchLists() (+11 more)

### Community 15 - "Landing"
Cohesion: 0.12
Nodes (8): COMPARISON, HOW_IT_WORKS, MOCK_ACCOUNTS, MockAccount, PRICING, NAV_SECTIONS, Button(), buttonVariants

### Community 16 - "Layout Shell"
Cohesion: 0.11
Nodes (4): NAV_LINKS, T, TOC, metadata

### Community 17 - "Contact Legal"
Cohesion: 0.11
Nodes (4): metadata, NAV_LINKS, T, TOC

### Community 18 - "Autopilot API"
Cohesion: 0.20
Nodes (16): POST(), ActionContext, EvalResult, evaluateConditions(), evaluateSingleCondition(), executeAction(), executeEmailDraft(), executeNotification() (+8 more)

### Community 19 - "Redis Cache"
Cohesion: 0.11
Nodes (4): metadata, NAV_LINKS, T, TOC

### Community 20 - "Autopilot Types"
Cohesion: 0.17
Nodes (13): WorkflowCardProps, BulkResponse, BulkResult, BulkScorerPage(), LOADING_PHASES, useLoadingPhase(), Card(), CardAction() (+5 more)

### Community 21 - "Score Service"
Cohesion: 0.16
Nodes (13): BUYING_STAGES, BuyingJourney(), KeyTriggersVisual(), SIGNAL_META, SignalDonut(), SignalRadarChart(), URGENCY_LEVELS, UrgencyMeter() (+5 more)

### Community 22 - "Lists Data"
Cohesion: 0.23
Nodes (13): ListsTopbarContext, ListsTopbarContextValue, useListsTopbar(), deltaLabel(), ListCardSummary, ListsHeroStats, ListCard(), ListCardProps (+5 more)

### Community 23 - "Person Scoring"
Cohesion: 0.19
Nodes (14): ApolloMatchInput, enrichPerson(), getMockApolloData(), MOCK_COMPANIES, MOCK_DEPARTMENTS, MOCK_SENIORITIES, MOCK_TITLES, seedHash() (+6 more)

### Community 24 - "CSV Utils"
Cohesion: 0.13
Nodes (9): metadata, ARCH_COLS, CERTS, CONTROLS, NAV_LINKS, PILLARS, RESOURCES, T (+1 more)

### Community 25 - "Apollo PDL"
Cohesion: 0.17
Nodes (10): EMPTY, PaletteRow, PaletteSection, RemoteResults, SearchPaletteProps, filterNavItems(), SEARCH_NAV_ITEMS, SearchNavItem (+2 more)

### Community 26 - "List Evaluator"
Cohesion: 0.24
Nodes (11): AV_CLASSES, buildHeroStats(), buildListCardSummary(), buildListDetail(), buildSparkline(), computeAvgScore(), computeBandMix(), formatRelativeTime() (+3 more)

### Community 27 - "Chat Copilot"
Cohesion: 0.21
Nodes (11): OpenRouterChoice, OpenRouterMessage, POST(), ContentBlock, buildCopilotContext(), buildCopilotSystemPrompt(), COPILOT_TOOLS, CopilotContext (+3 more)

### Community 28 - "Signal Fetchers"
Cohesion: 0.21
Nodes (10): CsvColumn, csvFilename(), downloadCSV(), formatSignal(), SignalLike, toCSV(), toCSVRaw(), redis (+2 more)

### Community 29 - "Scorer Core"
Cohesion: 0.22
Nodes (12): applySpread(), buildExplanationPrompt(), buildScoredSignals(), computeFreshness(), computeIntentScore(), generateScoreExplanation(), getDaysSince(), getScoreBand() (+4 more)

### Community 30 - "Mock Signals"
Cohesion: 0.15
Nodes (9): ActivityRow, AV_CLASSES, DashboardHomeViewProps, MoverRow, PipelineRow, SIGNAL_COLORS, SignalMixRow, WatchlistItem (+1 more)

### Community 31 - "Dashboard Nav"
Cohesion: 0.17
Nodes (7): CHANNELS, FAQS, NAV_LINKS, REASONS, T, TEAM_SIZES, metadata

### Community 32 - "AI Reasoning"
Cohesion: 0.30
Nodes (10): buildMockPersonResult(), buildPersonPrompt(), generatePersonReasoning(), PersonReasoningResult, buildMockResult(), buildPrompt(), generateReasoning(), ReasoningResult (+2 more)

### Community 33 - "Person Score Service"
Cohesion: 0.23
Nodes (9): DbPersonScore, PersonIntentScore, AV_COLORS, avColor(), bandClass(), initials(), PeopleState, PeopleView() (+1 more)

### Community 34 - "Workflow Cards"
Cohesion: 0.24
Nodes (9): useTheme(), DashboardShellProps, BOTTOM_ITEMS, DashboardNav(), DashboardNavProps, NavItem, WORKSPACE_ITEMS, WorkflowWithUser (+1 more)

### Community 35 - "BuiltWith Web"
Cohesion: 0.29
Nodes (9): companyNameFromDomain(), fetchGitHubSignal(), GitHubEvent, githubHeaders(), GitHubOrg, GitHubRelease, GitHubRepo, GitHubSearchResult (+1 more)

### Community 36 - "Polar Billing"
Cohesion: 0.33
Nodes (6): PLAN_PRODUCT_IDS, POST(), getPolar(), GET(), CREDIT_PACK_PRODUCTS, POST()

### Community 37 - "Onboarding"
Cohesion: 0.28
Nodes (5): OpenRouterChoice, OpenRouterMessage, ONBOARDING_TOOLS, OnboardingTool, parseBusinessProfile()

### Community 38 - "Theme Provider"
Cohesion: 0.22
Nodes (4): listeners, Theme, ThemeContext, ThemeContextValue

### Community 39 - "Score API v1"
Cohesion: 0.31
Nodes (4): QUICK_STEPS, Badge(), badgeVariants, Input()

### Community 40 - "Watchlist Events"
Cohesion: 0.32
Nodes (6): BandCounts, CRUMB, DashboardTopbar(), DashboardTopbarProps, useDashboardSearch(), focusWatchlistAdd()

### Community 41 - "Search Palette"
Cohesion: 0.29
Nodes (5): inter, jetbrainsMono, metadata, ThemeProvider(), Toaster()

### Community 42 - "List Detail"
Cohesion: 0.32
Nodes (6): ListDetailClient(), ListDetailClientProps, ListDetailPage(), PageProps, ListDetailData, ListDetailViewProps

### Community 43 - "Utils cn"
Cohesion: 0.33
Nodes (4): SearchPalette(), SearchContext, SearchContextValue, SearchProvider()

### Community 44 - "Funding Signal"
Cohesion: 0.33
Nodes (6): ApifyJobResult, fetchHiringSignal(), HIGH_INTENT, jobPoints(), LOW_INTENT, MEDIUM_INTENT

### Community 45 - "Hiring Signal"
Cohesion: 0.33
Nodes (6): fetchNewsSignal(), GNewsArticle, GNewsResponse, NEGATIVE_TRIGGERS, POSITIVE_TRIGGERS, scoreArticles()

### Community 47 - "OpenGraph"
Cohesion: 0.40
Nodes (4): buildSummary(), FIELDS, MemoryPage(), ProfileField

## Knowledge Gaps
- **219 isolated node(s):** `inter`, `jetbrainsMono`, `metadata`, `size`, `metadata` (+214 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createSupabaseAdmin()` connect `REST API Routes` to `Billing & Plans`, `Autopilot`, `Watchlist UI`, `Polar Billing`, `Onboarding`, `Signals`, `Person Scoring`, `Pipeline`, `Pipeline`, `Signals`, `Lists`, `Inbox`, `Scoring`, `Lists`, `Autopilot API`, `Chat Copilot`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `cn()` connect `UI Primitives` to `Autopilot`, `Workflow Cards`, `Score API v1`, `Pipeline`, `Inbox`, `Landing`, `Autopilot Types`, `Score Service`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `Button()` connect `Landing` to `Autopilot`, `Score API v1`, `Pipeline`, `UI Primitives`, `Autopilot Types`, `Score Service`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `inter`, `jetbrainsMono`, `metadata` to the rest of the system?**
  _220 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Billing & Plans` be split into smaller, more focused modules?**
  _Cohesion score 0.0506155950752394 - nodes in this community are weakly interconnected._
- **Should `Autopilot` be split into smaller, more focused modules?**
  _Cohesion score 0.0526006464883926 - nodes in this community are weakly interconnected._
- **Should `REST API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.07337526205450734 - nodes in this community are weakly interconnected._
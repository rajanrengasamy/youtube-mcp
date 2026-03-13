# YouTube MCP Server - Product Viability Assessment
**Assessor:** OracleP (Product Oracle)  
**Date:** 2026-03-05  
**PRD Version:** v1.1  
**Verdict:** **REFINE** — Ship a focused V1 in 4-6 weeks, not 12-week full vision

---

## Executive Summary

This PRD describes a technically sound, ambitious YouTube intelligence server. The core differentiators (semantic search, fallback chain, zero-config) are **real and valuable**. However, the scope is **2-3x too large for V1**, the distribution strategy is **missing entirely**, and the competitive moat is **shallower than the PRD assumes**.

**The path forward:** Cut V1 scope by 60%, ship a focused "YouTube knowledge base" product in 4-6 weeks, then iterate based on real user feedback. The current 12-week roadmap risks late arrival to a market that rewards speed over completeness.

---

## Dimensional Scores

### 1. Market Timing: 8/10 ⏰

**Score Rationale:**
- ✅ MCP ecosystem is **peak hot** right now (Q1 2026)
- ✅ YouTube MCP category is **proven** (5 servers with 400-500 stars each)
- ✅ No dominant winner yet - market is **fragmented and winnable**
- ✅ Clear pain points from r/mcp users (API friction, broken transcripts, no semantic search)
- ⚠️ Window is **closing** - competitors are actively shipping
- ⚠️ Market is getting **crowded** - need differentiation + speed

**External Forces:**
- **Helping:** Anthropic pushing MCP hard, Claude Desktop adoption growing, r/mcp subreddit active (12K+ members)
- **Hurting:** YouTube platform changes could break scrapers overnight, MCP protocol could shift (new SDK versions)

**Window of Opportunity:** 
**3-6 months**. If Rajan ships a focused V1 in 4-6 weeks, he can capture early adopter mindshare. If he takes 12+ weeks, someone else will nail semantic search first.

**Verdict:** Timing is good but not perfect. Speed matters more than completeness here.

---

### 2. Distribution Strategy: 4/10 📢

**Score Rationale:**
This is the **weakest dimension**. The PRD has zero launch plan beyond "publish to npm and hope."

**What's Missing:**
- ❌ **No launch channel strategy** - WHERE will users discover this? (r/mcp? X/Twitter? Discord?)
- ❌ **No positioning statement** - What's the 1-sentence pitch vs competitors?
- ❌ **No seeding plan** - Who are the first 10 users? How do you get them?
- ❌ **No content strategy** - Launch post? Demo video? Tweet thread?
- ❌ **No npm SEO** - How will it rank in searches? Keywords? README hook?

**Reality Check on 200-500 Stars:**

| Server | Stars | Strategy |
|--------|-------|----------|
| anaisbetts/mcp-youtube | 500 | Simple, early, transcript-only, no API key |
| kimtaeyoon83/mcp-server-youtube-transcript | 484 | Simple, early, transcript-only |
| kirbah/mcp-youtube | 13 | **Best engineering** (97% tests, token optimization), but API-key required + late |

**Key Insight:** Engineering quality ≠ stars. **Simplicity + timing + zero-friction UX** = stars.

**What Drives Stars in This Market:**
1. **Solves ONE pain point exceptionally** (not 16 tools)
2. **Zero setup friction** (no API key)
3. **Early to market** or **unique killer feature**
4. **Strong launch** (r/mcp top post, demo video, influencer retweet)

**Can Rajan Hit 200-500 Stars?**
- With current plan: **50-150 stars** (realistic baseline)
- With focused V1 + strong launch: **150-300 stars** (achievable)
- With viral moment (killer demo, perfect timing): **300-500 stars** (possible but requires luck)

**Required Changes:**
1. **Write the launch post NOW** - before building. Test positioning on r/mcp users.
2. **Identify 10 early adopters** - DM MCP power users, ask them to try alpha.
3. **Plan the demo** - 60-second video showing semantic search magic.
4. **Craft the positioning** - "The YouTube knowledge base for MCP - search across playlists like you search your notes"
5. **Launch timing** - Mid-week (Tue/Wed), when r/mcp is active, not during holidays.

**Verdict:** Distribution is the **#1 risk** to hitting 200-500 stars. Build this plan before writing code.

---

### 3. Scope Realism: 3/10 ⚖️

**Score Rationale:**
The PRD is **2-3x over-scoped for V1**. Timeline is optimistic, delivery is at risk.

**PRD Claims:**
- V1: 5 weeks (16 tools + infrastructure + tests)
- V2: 3 weeks (5 analysis tools)
- V3: 3 weeks (6 intelligence tools)
- **Total: 12 weeks**

**Reality Check (Engineering Effort):**

| Component | PRD Estimate | Realistic Estimate |
|-----------|--------------|-------------------|
| Fallback orchestrator + 3 adapters | Implicit in 5 weeks | 1.5 weeks |
| Core 8 retrieval tools | Implicit | 1.5 weeks |
| Batch/playlist tools (3) | Implicit | 0.5 weeks |
| **Semantic search infrastructure** (sqlite-vec, Xenova, chunker, collection manager) | **Implicit** | **2-2.5 weeks** |
| 5 semantic search tools | Implicit | 0.5 weeks |
| Tests (90% coverage) | Implicit | 1 week |
| Documentation + examples | Not mentioned | 0.5 weeks |
| **V1 Total** | **5 weeks** | **8-10 weeks** |

**Context: Solo Builder, Nights/Weekends**
- Rajan is enterprise PM by day
- Realistically: **15-20 hours/week** available for this
- With AI assistance: ~2x productivity
- **8-10 weeks FTE = 16-20 weeks calendar time (4-5 months)**

**What Should Be Cut from V1:**

| Tool | Current Priority | Recommended | Rationale |
|------|-----------------|-------------|-----------|
| findVideos | V1 | V1 | Core search, keep |
| inspectVideo | V1 | V1 | Core metadata, keep |
| inspectChannel | V1 | V1 | Core metadata, keep |
| listChannelCatalog | V1 | **V2** | Nice-to-have, not critical |
| readTranscript | V1 | V1 | Required for semantic search |
| readComments | V1 | **V2** | Not needed for core semantic search use case |
| measureAudienceSentiment | V1 | **V2** | Complex analysis, not core differentiator |
| watchTopicTrends | V1 | **V2** | Complex, requires calibration |
| analyzeVideoSet | V1 | **V2** | Batch is nice-to-have |
| analyzePlaylist | V1 | **V2** | Batch is nice-to-have |
| expandPlaylist | V1 | V1 | Required for import workflow |
| importPlaylist | V1 | **V1 (CRITICAL)** | **This is the differentiator** |
| importVideos | V1 | V1 | Required for ad-hoc workflow |
| searchTranscripts | V1 | **V1 (CRITICAL)** | **This is the differentiator** |
| listCollections | V1 | V1 | Minimal, keep |
| removeCollection | V1 | V1 | Minimal, keep |

**Recommended V1 Scope (Focused):**
1. **Core retrieval:** findVideos, inspectVideo, inspectChannel, readTranscript
2. **Playlist import:** expandPlaylist, importPlaylist, importVideos
3. **Semantic search:** searchTranscripts, listCollections, removeCollection
4. **Infrastructure:** Fallback chain (YouTube API → yt-dlp), sqlite-vec, local embeddings
5. **Skip for V1:** Comments, sentiment, trends, batch analysis, channel catalog

**Result:** **6 weeks realistic delivery** for a focused, differentiated V1.

**What's Missing from Scope:**
- ❌ Error handling for edge cases (YouTube HTML changes, yt-dlp breaks)
- ❌ Rate limiting and quota management
- ❌ Telemetry and monitoring
- ❌ Documentation (quick start, API reference, recipes)
- ❌ npm package setup and publish automation
- ❌ MCP config examples for Claude Desktop/Cursor/VS Code
- ❌ Performance optimization (first version will be slow)

**V2 and V3 Timeline:**
- V2 (creator tools): **4-6 weeks** (not 3) - requires data science + calibration
- V3 (competitive intel): **4-6 weeks** (not 3) - requires multi-channel benchmarking logic
- **Realistic total: 16-22 weeks (4-5 months)**, not 12 weeks

**Verdict:** Scope is **60% too large for V1**. Cut to semantic search core, ship in 6 weeks, iterate.

---

### 4. Technical Feasibility: 7/10 🔧

**Score Rationale:**
Core architecture is **sound**. Risks are **manageable** but **real**.

**What's Technically Sound:**
- ✅ TypeScript + MCP SDK: proven, stable
- ✅ YouTube Data API v3: well-documented, reliable
- ✅ yt-dlp: battle-tested, actively maintained
- ✅ SQLite: zero-config, reliable
- ✅ Fallback chain pattern: conceptually solid
- ✅ Vector search for transcripts: proven use case (similar to Obsidian plugins, Notion AI)

**Technical Risks (Ranked by Severity):**

#### Risk 1: Page Extraction Brittleness (Severity: HIGH)
- **Problem:** YouTube changes HTML/JSON-LD structure regularly. No guaranteed contract.
- **Impact:** Tier 3 fallback could break overnight, degrading reliability promise.
- **Mitigation:**
  - Monitor for breakage (weekly automated tests against live pages)
  - Rapid hotfix workflow (detect → fix → deploy within 24h)
  - Graceful degradation (mark outputs as `partial: true` when extraction confidence is low)
- **Residual Risk:** Ongoing maintenance burden. Will require attention every 2-4 months.

#### Risk 2: sqlite-vec Maturity (Severity: MEDIUM-HIGH)
- **Problem:** sqlite-vec is relatively new (2024). Node.js bindings may be immature. Performance at scale unknown.
- **Impact:** Vector search could be buggy, slow, or unstable with 1000+ videos indexed.
- **Mitigation:**
  - **Prototype semantic search FIRST** (week 1-2 of development)
  - Load test with 200+ video playlist before committing to architecture
  - Have fallback: simple SQLite full-text search (FTS5) if vector search fails
  - Pluggable store interface (can swap to ChromaDB/pgvector later if needed)
- **Validation Plan:** Build proof-of-concept in first 2 weeks. If sqlite-vec is too buggy, pivot to FTS5 + keyword search.

#### Risk 3: Xenova/transformers UX (Severity: MEDIUM)
- **Problem:** 80MB model download on first run = poor first-time UX. Adds latency to first query.
- **Impact:** Users might abandon during first use if download hangs or fails.
- **Mitigation:**
  - Show progress bar during model download
  - Pre-bundle model in Docker image
  - Allow skip: offer "zero-search mode" (skip semantic search, just use basic retrieval)
  - Document expected first-run latency in README
- **Residual Risk:** Some users will still bounce on first run. Acceptable if <10% churn.

#### Risk 4: yt-dlp Subprocess Management (Severity: MEDIUM)
- **Problem:** Spawning yt-dlp per call = slow, resource-heavy. Errors on malformed output.
- **Impact:** Increased latency, potential crashes on edge-case videos.
- **Mitigation:**
  - Cache aggressively (24h TTL for transcripts, 6h for metadata)
  - Process pooling (reuse yt-dlp instances)
  - Timeout + retry logic (fail gracefully after 15s)
  - Contract tests with fixture videos (validate parsing)
- **Residual Risk:** yt-dlp updates could break parsing. Monitor weekly, hotfix as needed.

#### Risk 5: Sentiment Analysis Quality (Severity: LOW-MEDIUM)
- **Problem:** PRD mentions "sentiment scoring" but doesn't specify approach. LLM-based = expensive/slow. Keyword-based = inaccurate.
- **Impact:** Sentiment results could be unreliable, hurting trust in analysis tools.
- **Mitigation:**
  - **Cut from V1** (already recommended above)
  - For V2: Start simple (VADER or Flair), iterate based on user feedback
  - Add confidence scores + caveats ("sentiment is directional, not precise")
- **Residual Risk:** V2 problem, not V1.

#### Risk 6: Token Optimization Promises (Severity: LOW)
- **Problem:** PRD claims 75-87% token savings. No proof this is achievable without losing critical data.
- **Impact:** Over-compression could hurt usefulness. Under-compression wastes tokens.
- **Mitigation:**
  - Build token benchmark harness early (compare raw API vs compact output)
  - User testing: validate compact output is still useful
  - `compact` and `includeRaw` toggles for user control
- **Residual Risk:** Will require iteration. Target 60-75% savings as realistic baseline.

**What's NOT a Risk:**
- ✅ MCP SDK stability (official SDK is mature now)
- ✅ TypeScript ecosystem (mature, well-supported)
- ✅ SQLite in Node (better-sqlite3 is battle-tested)

**Architecture Soundness:** 7/10
- Core design is solid
- Semantic search is ambitious but **feasible**
- Biggest risk is **operational** (yt-dlp/page extraction breaking), not architectural
- Requires **ongoing maintenance**, not one-time build

**Verdict:** Technically feasible, but **prototype semantic search in week 1-2 to de-risk**.

---

### 5. Effort vs Payoff: 6/10 📊

**Score Rationale:**
Effort is **significant**. Payoff is **uncertain**. Faster paths exist.

**Effort Analysis:**

| Scenario | Effort | Calendar Time | Context |
|----------|--------|---------------|---------|
| V1 (PRD scope) | 8-10 weeks FTE | 16-20 weeks (4-5 months) | Solo, nights/weekends, 15-20 hrs/week |
| V1 (focused scope) | 5-6 weeks FTE | 10-12 weeks (2.5-3 months) | Solo, nights/weekends, 15-20 hrs/week |
| V1 + V2 + V3 (full PRD) | 16-22 weeks FTE | 32-44 weeks (8-11 months) | Solo, nights/weekends |

**Payoff Analysis:**

#### GitHub Stars (Primary Goal)
- **Target:** 200-500 stars
- **Realistic outcome:** 50-150 stars (baseline), 150-300 stars (with good launch), 300-500 stars (requires viral moment)
- **Comparable outcomes:**
  - anaisbetts (500 stars): simple, early, no API key ✅
  - kimtaeyoon83 (484 stars): simple, early ✅
  - kirbah (13 stars): complex, late, API-key required ❌

**Pattern:** **Simple + early + no-API-key = stars.** Rajan's product is complex + mid-timing + no-API-key. The no-API-key is good, but complexity + timing work against him.

**Realistic star outcome with focused V1 + strong launch: 150-250 stars**

#### npm Downloads
- **Market size:** ~2,290 downloads/week total across all YouTube MCP servers
- **Top 2 servers:** 1,300/week (57% of market)
- **Realistic capture:** 10-20% of market = **200-450 downloads/week**
- **That's respectable but not huge** - portfolio piece, not breakout hit

#### Side Income Potential
- **Direct revenue:** $0 (open source)
- **Indirect:** GitHub profile boost, consulting leads, potential SaaS pivot later
- **Timeline to monetization:** 6-12 months after V1 launch (if ever)
- **Expected value:** Low probability of meaningful income in 2026

#### Strategic Value (Non-Monetary)
- ✅ **Portfolio piece:** Strong (showcases MCP, vector search, TypeScript, systems thinking)
- ✅ **Learning:** High (MCP + sqlite-vec + TypeScript + product thinking mastery)
- ✅ **Positioning:** "AI/MCP builder" credibility, useful for job market / consulting
- ⚠️ **But:** 4-5 months is a **long time** for uncertain stars

**Is the Effort Justified?**

| Goal | Justified? | Rationale |
|------|-----------|-----------|
| Learning + mastery | ✅ Yes | Will deeply understand MCP ecosystem + vector search |
| 200-500 GitHub stars | ⚠️ Uncertain | Possible but requires perfect execution + launch |
| Side income | ❌ No | Too long to revenue, low monetization path |
| Portfolio / positioning | ✅ Yes | Strong signal of AI/MCP capability |

**Faster Paths to Similar Outcome:**

| Alternative | Effort | Stars Potential | Tradeoffs |
|-------------|--------|----------------|-----------|
| Fork anaisbetts, add semantic search only | 2-3 weeks | 100-200 stars | Less learning, less differentiation |
| Build semantic search as standalone tool, integrate with existing servers | 3-4 weeks | 50-100 stars | Narrow scope, faster validation |
| Focus V1 on ONE killer feature (playlist semantic search), ship in 4 weeks | 4-6 weeks | 150-300 stars | **Recommended path** |
| Build full PRD vision (V1+V2+V3) | 8-11 months | 200-500 stars | Too long, market could shift |

**Recommended Path:**
Ship **focused V1 in 4-6 weeks** (semantic search core + basic retrieval). If it gets 100+ stars and positive feedback, invest in V2/V3. If it flops, cut losses and move on.

**Verdict:** Effort is significant (10-12 weeks calendar time for focused V1). Payoff is **uncertain but reasonable** if scope is cut and launch is strong. **Don't build the full vision upfront - ship fast, iterate based on real traction.**

---

### 6. Competitive Moat: 5/10 🏰

**Score Rationale:**
Differentiation is **real but shallow**. Moat is **execution speed**, not unique IP.

**What's Defensible (2-6 months head start):**
- ✅ **Semantic search** (if done well) - 3-6 month head start before copycats
- ✅ **Token optimization** (if proven) - subtle but valuable, harder to copy than it looks
- ✅ **Fallback chain** (if reliable) - builds user trust and stickiness
- ✅ **Intelligence layer** (gaps, hooks, benchmarks in V2/V3) - harder to copy than raw retrieval

**What's NOT Defensible (1-2 weeks to copy):**
- ❌ Core retrieval tools - any competent dev could replicate in a weekend
- ❌ yt-dlp fallback - trivial to copy (just read the yt-dlp docs)
- ❌ Page extraction - public web scraping, zero moat
- ❌ TypeScript MCP server - template is public (MCP SDK examples)

**Reality Check: Why Hasn't kirbah Won?**

kirbah/mcp-youtube has:
- ✅ 97% test coverage
- ✅ Token optimization
- ✅ Clean architecture
- ✅ Best engineering quality in the category

But only **13 stars**. Why?
- ❌ API key required (setup friction)
- ❌ No killer feature (just better execution of basics)
- ❌ Late to market (anaisbetts was earlier and simpler)
- ❌ No distribution strategy (just published to npm and hoped)

**Key Lesson:** Engineering quality is **necessary but not sufficient**. Stars require:
1. **Killer feature** that competitors lack → semantic search ✅
2. **Zero friction UX** → no API key ✅
3. **Distribution** → **missing** ❌
4. **Timing** → good but not perfect ⚠️

**How Long Before Copycats?**

| Scenario | Time to Copy |
|----------|-------------|
| Rajan launches, gets 50 stars | 6-12 weeks (not worth copying yet) |
| Rajan launches, gets 200+ stars | 2-4 weeks (clear signal to copy) |
| Rajan launches, goes viral on r/mcp (500+ upvotes) | 1-2 weeks (race to clone) |

**The Moat is Execution Speed + Brand:**
- Ship semantic search **first** → own the positioning
- Get to 100 stars **fast** → become the reference implementation
- Iterate **faster than copycats** → V2/V3 features widen the gap
- Build reputation as "the reliable YouTube MCP server" → trust moat

**Defensibility Over Time:**

| Phase | Moat Strength | Key Factors |
|-------|--------------|-------------|
| 0-3 months | **Medium** (5/10) | Semantic search novelty, zero copycats |
| 3-6 months | **Low-Medium** (4/10) | Copycats emerge, need V2 features to differentiate |
| 6-12 months | **Low** (3/10) | Market commoditizes, need SaaS pivot or community moat |

**Long-Term Defensibility Strategies:**
1. **Community moat:** Active Discord, responsive GitHub issues, plugin ecosystem
2. **Data moat:** Proprietary training data from user interactions (if building SaaS later)
3. **Integration moat:** Tight integrations with popular MCP clients (Claude Desktop, Cursor)
4. **Brand moat:** "The YouTube MCP server everyone uses" - network effects
5. **Velocity moat:** Ship features faster than competitors (requires ongoing investment)

**Is This Defensible Enough?**
- For open source: **No** - will be copied within 6 months
- For portfolio/learning: **Yes** - positioning as "first semantic search YouTube MCP" persists
- For SaaS pivot later: **Maybe** - if user data / integrations create switching costs

**Verdict:** Moat is **execution speed** (ship first, iterate fast), not **unique technology** (all features are copyable). This is a **"better execution" play**, not a **"unique IP" play**. Defend by moving fast and building brand.

---

## Overall Verdict: REFINE ⚙️

**Decision:** Do NOT build the full PRD as written. Ship a **focused V1 in 4-6 weeks**, validate traction, then decide on V2/V3.

---

## Top 3 Strengths ✅

### 1. Semantic Search is a Real Differentiator
- **No other TypeScript YouTube MCP server has this**
- Solves a clear pain point: "search across my saved YouTube playlists like I search my notes"
- Use case is proven (Obsidian plugins, Notion AI, Perplexity for docs)
- **This is the bet.** If semantic search works well, it's worth 100-200 stars alone.

### 2. Zero-Config Philosophy is Correct
- Top 2 servers (1000+ stars combined) both have zero API key requirement
- kirbah (13 stars) requires API key - clear signal that friction kills adoption
- Fallback chain (API → yt-dlp → page extract) is the right design
- **Matches user expectations:** "it should just work"

### 3. Rajan Understands the Market
- PRD shows deep competitive research (analyzed 7 servers)
- Clear persona thinking (Creator, Researcher, Brand Builder)
- Token optimization is a subtle but real value-add (if proven)
- **Knows what users want:** reliability, compactness, intelligence

---

## Top 3 Risks ⚠️

### 1. Distribution Strategy is Missing
- **This is the #1 risk to hitting 200-500 stars**
- PRD has zero launch plan beyond "publish to npm"
- No positioning statement, no seeding strategy, no content plan
- kirbah proves: great engineering + zero distribution = 13 stars
- **Fix before coding:** Write the launch post, identify first 10 users, plan the demo video

### 2. Scope is 2-3x Too Large for V1
- **16 tools in 5 weeks is fantasy math** for a solo nights/weekends builder
- Realistic timeline: 8-10 weeks FTE = 4-5 months calendar time
- By then, market could shift (competitor ships semantic search, MCP protocol changes)
- **Fix:** Cut to 9 tools (core retrieval + semantic search), ship in 6 weeks

### 3. Competitive Moat is Shallow
- Semantic search buys 3-6 months head start, then copycats arrive
- No long-term defensibility beyond execution speed + brand
- Open source = zero IP protection
- **Fix:** Plan for velocity - commit to weekly updates for 6 months, build community moat

---

## Recommended Changes Before Building 🛠️

### Change 1: Cut V1 Scope by 60%
**Remove from V1:**
- ❌ listChannelCatalog (V2)
- ❌ readComments (V2)
- ❌ measureAudienceSentiment (V2)
- ❌ watchTopicTrends (V2)
- ❌ analyzeVideoSet (V2)
- ❌ analyzePlaylist (V2)

**Keep in V1:**
- ✅ findVideos
- ✅ inspectVideo
- ✅ inspectChannel
- ✅ readTranscript
- ✅ expandPlaylist
- ✅ importPlaylist
- ✅ importVideos
- ✅ searchTranscripts
- ✅ listCollections
- ✅ removeCollection

**Result:** 10 tools instead of 16, **6 weeks realistic delivery** instead of 8-10 weeks.

### Change 2: Build Distribution Plan FIRST
**Before writing any code:**
1. **Write the launch post** (r/mcp format) - test positioning on users
2. **Identify 10 early adopters** - DM MCP power users, offer alpha access
3. **Script the demo video** - 60 seconds showing semantic search magic
4. **Craft positioning statement** - "The YouTube knowledge base for MCP - search across playlists like you search your notes"
5. **Pick launch date** - Mid-week (Tue/Wed), when r/mcp is active

**Success metrics:**
- Launch post gets 100+ upvotes on r/mcp
- 10 alpha users give feedback within first week
- Demo video gets 50+ retweets on X/Twitter

### Change 3: Prototype Semantic Search in Week 1-2
**Risk:** sqlite-vec might be too immature/buggy for production use.

**Mitigation:**
1. Build proof-of-concept in first 2 weeks:
   - Import 50-video playlist
   - Index transcripts with sqlite-vec + Xenova
   - Test search quality and latency
2. Load test with 200+ videos
3. If sqlite-vec fails: pivot to **SQLite FTS5** (full-text search) as fallback
4. Document performance characteristics (latency, storage size)

**Validation criteria:**
- Search returns relevant results with ≥0.7 precision@10
- Query latency <3 seconds for 200-video index
- No crashes or data corruption after 100 imports
- Embeddings persist across server restarts

**If validation fails:** Pivot to simpler keyword search, still ship V1 on time.

### Change 4: Set Realistic Star Target
**Change target from 200-500 to 100-250 stars for V1.**

**Rationale:**
- 100 stars = clear product-market fit signal
- 250 stars = top-tier outcome for V1
- 500 stars = requires viral moment (not plannable)

**Decision tree:**
- **V1 gets <50 stars:** Cut losses, move to next project
- **V1 gets 50-100 stars:** Iterate based on feedback, cautious V2 investment
- **V1 gets 100-250 stars:** Full commit to V2/V3, this is working
- **V1 gets 250+ stars:** Double down, consider SaaS pivot

### Change 5: Define V2/V3 Go/No-Go Criteria
**Don't build V2/V3 unless V1 validates demand.**

**V2 go criteria (evaluate 6 weeks after V1 launch):**
- ✅ ≥100 GitHub stars
- ✅ ≥200 npm downloads/week
- ✅ ≥5 GitHub issues requesting creator analysis features
- ✅ Rajan still has energy + time to invest

**V3 go criteria (evaluate 6 weeks after V2 launch):**
- ✅ ≥200 GitHub stars
- ✅ ≥500 npm downloads/week
- ✅ Evidence of commercial use (enterprise inquiries, SaaS demand)
- ✅ Competitive intel features requested by users

**If criteria not met:** Maintain V1, don't build V2/V3. Move to next project.

### Change 6: Add Maintenance Budget
**Reality:** This is not a "ship and forget" project.

**Ongoing maintenance required:**
- **Page extraction:** Will break every 2-4 months (YouTube HTML changes)
- **yt-dlp:** Updates could break parsing, monitor weekly
- **MCP SDK:** Protocol changes, need to stay current
- **Dependencies:** Security updates, npm audit fixes

**Budget:** 2-4 hours/month minimum, 10-20 hours/month when things break.

**Question for Rajan:** Is this sustainable alongside day job + family? Be honest.

---

## Revised Roadmap (Recommended)

### Phase 0: Pre-Build (Week 0 - 1 week)
- ✅ Write launch post draft (test on r/mcp users)
- ✅ Identify 10 early adopters (DM, get commitments)
- ✅ Script demo video (storyboard)
- ✅ Finalize positioning statement
- ✅ Pick launch date (mid-week, 4-6 weeks out)

### Phase V1: Semantic Search Core (Weeks 1-6)
**Scope:**
- Core retrieval (4 tools): findVideos, inspectVideo, inspectChannel, readTranscript
- Playlist import (3 tools): expandPlaylist, importPlaylist, importVideos
- Semantic search (3 tools): searchTranscripts, listCollections, removeCollection
- Infrastructure: Fallback chain (API → yt-dlp), sqlite-vec, Xenova embeddings, tests

**Milestones:**
- Week 1-2: Prototype semantic search, validate sqlite-vec
- Week 3-4: Core retrieval + fallback chain
- Week 5: Playlist import pipeline
- Week 6: Tests, docs, polish, npm publish

**Exit criteria:**
- ✅ All 10 tools working with ≥90% success rate
- ✅ Semantic search returns relevant results (≥0.7 precision@10)
- ✅ Zero-config mode works (no API key required)
- ✅ README + quick start guide complete
- ✅ Alpha users test successfully

### Phase V1.5: Launch (Week 7 - 1 week)
- ✅ Launch post on r/mcp (aim for top post of week)
- ✅ Demo video on X/Twitter
- ✅ Product Hunt launch (optional, if momentum is strong)
- ✅ DM early adopters, get testimonials
- ✅ Monitor feedback, triage issues

### Phase V2: Go/No-Go (Week 13 - evaluate)
**Decision criteria:**
- V1 stars ≥100? 
- npm downloads ≥200/week?
- User requests for creator features?
- Rajan still energized?

**If YES → build V2 (creator tools):**
- Scope: 5 tools (content gaps, hook scoring, upload timing, shorts vs long, tags/titles)
- Timeline: 4-6 weeks
- Budget: 80-120 hours

**If NO → maintain V1, move on:**
- Keep V1 stable (fix breaking changes only)
- Document lessons learned
- Move to next project

---

## Final Recommendation 🎯

**Ship a focused V1 in 6 weeks, not the full vision in 12 weeks.**

**Why:**
1. **Market timing:** Window is closing, speed > completeness
2. **Risk mitigation:** Validate demand before investing 4-5 months
3. **Competitive moat:** First-mover advantage on semantic search
4. **Scope realism:** 6 weeks is achievable, 12 weeks is fantasy math
5. **Distribution:** Need strong launch, not feature bloat

**The Bet:**
Semantic search + zero-config + strong launch = **150-250 stars** and clear product-market fit signal.

**If that works:** Invest in V2/V3.  
**If that flops:** Cut losses and move on.

**Don't build the cathedral. Build the minimum viable magic.** ✨

---

## Appendix: Distribution Checklist

### Pre-Launch (Week 0)
- [ ] Write launch post (r/mcp format, 300-500 words)
- [ ] Identify 10 early adopters (MCP Discord, r/mcp regulars)
- [ ] Script 60-second demo video (show semantic search working)
- [ ] Craft 1-sentence pitch: "The YouTube knowledge base for MCP"
- [ ] Set up analytics (npm downloads tracker, GitHub stars tracker)

### Launch Week (Week 7)
- [ ] Tuesday 9am ET: Post to r/mcp (when subreddit is most active)
- [ ] Tuesday 10am ET: Tweet demo video (tag @AnthropicAI, @ClaudeAI)
- [ ] Tuesday 11am ET: DM early adopters with launch link
- [ ] Wednesday: Respond to every comment/question on r/mcp thread
- [ ] Thursday: Product Hunt launch (if r/mcp traction is strong)
- [ ] Friday: Collect testimonials, update README with quotes

### Post-Launch (Weeks 8-12)
- [ ] Week 8: Ship first bug fixes based on user feedback
- [ ] Week 9: Write "How I built this" blog post (dev.to, Medium)
- [ ] Week 10: Engage with forks/PRs, build community
- [ ] Week 11: Add to MCP directory/listings
- [ ] Week 12: Evaluate V2 go/no-go criteria

---

**End of Assessment**

*OracleP signing off. Ship fast, launch strong, iterate based on reality. Good luck.* 🚀

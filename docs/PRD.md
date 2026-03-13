# YouTube MCP Server - Product Requirements Document (PRD)

**Author:** Rajan Rengasamy
**Date:** 2026-03-05
**Status:** Draft v1.1 (updated: playlist imports + semantic search promoted to V1)
**Product Type:** Standalone TypeScript MCP server (stdio + SSE), npm-publishable

---

## 1) Executive Summary

I am building a **YouTube MCP server** that acts as an **intelligence layer**, not just an API wrapper. My goal is to make YouTube analysis reliable, useful, and token-efficient for MCP-native workflows.

Most current YouTube MCP servers fail at one or more of these fundamentals:

- They require a YouTube API key to do anything useful.
- They break hard when quota is exhausted or credentials fail.
- They return raw or semi-raw payloads instead of analytical output.
- They name tools after backend endpoints, not user intent.
- They waste context windows with verbose response objects.

My server differentiates on five pillars:

1. **Zero-config start** - works immediately with `yt-dlp` and page extraction even without API keys.
2. **Fallback chain on every tool** - YouTube Data API v3 → `yt-dlp` → page extraction → graceful error.
3. **Intelligence layer** - sentiment scoring, content-gap detection, benchmark analysis, growth signals.
4. **Persona-aware tool naming** - tools are named for outcomes users want.
5. **Token-optimized responses** - structured compact outputs targeting **75-87% token savings** vs raw API payloads.

I will deliver this in three phases:

- **V1:** Core data + fallback + comment sentiment + **playlist imports + semantic search across indexed transcripts**.
- **V2:** Creator workflows (gaps, hooks, tags, timing, format comparison).
- **V3:** Competitor and brand intelligence (benchmarks, share of voice, growth trajectory, sponsored pattern detection).

---

## 2) Problem Statement

Today, YouTube MCP tooling has a usability and reliability gap:

- **Reliability gap:** API-only designs fail in quota exhaustion, missing credentials, or endpoint errors.
- **Usability gap:** users ask strategic questions, but tools return low-level data fragments.
- **Efficiency gap:** payloads are often too large for iterative LLM workflows.
- **Workflow gap:** creators, researchers, and brand builders need different abstractions, but tools are mostly endpoint-centric.

### Core Problems I am Solving

1. **Cold start friction**
   - Current: user must configure API keys up front.
   - My design: user gets value immediately with `yt-dlp`/extraction fallback.

2. **Single-point failure**
   - Current: API outage = broken toolchain.
   - My design: layered fallback and source provenance so outputs degrade gracefully.

3. **Data without judgment**
   - Current: "here are comments/transcripts."
   - My design: "here is sentiment trend, risk cluster, and content gap opportunity."

4. **Context window waste**
   - Current: big nested JSON, thumbnails, etags, repeated metadata.
   - My design: compact typed objects, optional verbosity, field-selective output.

---

## 3) Competitive Analysis

I reviewed live/community YouTube MCP servers and adjacent offerings. The market is active, but no product currently combines reliability + intelligence + zero-config + compact output in one cohesive design.

| Server | Strengths | Gaps I observed | Strategic opportunity for this product |
|---|---|---|---|
| `anaisbetts/mcp-youtube` | Very simple, quick subtitle retrieval via `yt-dlp` | Transcript-only scope; no stats/comments/search/benchmarking | Keep transcript convenience but expand to full analysis suite |
| `kirbah/mcp-youtube` | Best-in-class token optimization, strong engineering quality, caching, tests | API key required; no fallback chain; limited intelligence tooling | Match compactness and exceed on resilience + insights |
| `ZubeidHendricks/youtube-mcp-server` | Broad feature list (videos/channels/playlists/search) | API v3 dependency; brittle without credentials/quota; mostly retrieval-focused | Add fallback resilience + analysis-first outputs |
| `nattyraz/youtube-mcp` | Metadata + captions + markdown templates | Credential heavy; little strategic analytics | Build beyond extraction into decision-grade insights |
| `mourad-ghafiri/youtube-mcp-server` | Strong transcription pipeline, multilingual support, VAD/Whisper integration | Primarily transcription/metadata focus; limited channel/market intelligence | Keep multilingual strength as optional extension, focus on strategy layer |
| `kimtaeyoon83/mcp-server-youtube-transcript` | Clean transcript retrieval, ad-strip option | Narrow scope; no channel intelligence or benchmarking | Integrate transcript tools into broader intelligence suite |
| `aardeshir/youtube-mcp` | Playlist/channel operations with OAuth flows | Setup complexity; API/OAuth dependency; limited analysis layer | Simplify onboarding and prioritize insight-oriented tools |
| `eat-pray-ai/yutu` | Powerful operational automation and publishing workflows | Heavy auth setup and operational breadth; not optimized for lightweight analysis context | Position as lightweight intelligence server, not full channel ops platform |

### Competitive Conclusion

I see clear whitespace: **no existing server combines zero-config startup, universal fallback, sentiment+competitive intelligence, and aggressive token optimization** as first-class design goals.

---

## 4) Target Personas

### Persona 1 - YouTube Creator

**What they need to do:**
- Find content gaps
- Mine comment sentiment
- Evaluate hooks
- Optimize upload timing
- Compare Shorts vs long-form performance
- Improve tags/title discoverability

**Pain points:**
- Tooling tells them what happened, not what to do next.
- Manual transcript/comment review is slow and noisy.

**Success looks like:**
- Faster content ideation cycles
- Better retention hooks and audience response
- More predictable publishing decisions

---

### Persona 2 - Competitor Researcher

**What they need to do:**
- Compare channels
- Estimate share of voice
- Benchmark engagement quality
- Track growth trajectory
- Detect sponsorship patterns
- Reverse-engineer strategy

**Pain points:**
- Data collection is fragmented across many tools.
- Apples-to-apples benchmark normalization is hard.

**Success looks like:**
- One-call comparative analysis
- Time-series and normalized benchmark outputs
- Reusable market snapshots

---

### Persona 3 - Brand Builder

**What they need to do:**
- Validate niche demand
- Find audience overlap/collaboration candidates
- Track milestone benchmarks
- Identify repurpose signals
- Assess monetization readiness

**Pain points:**
- They need strategic signal, not channel-ops plumbing.

**Success looks like:**
- Better go/no-go decisions on niche/channel direction
- More confidence in positioning and partnership choices

---

## 5) Product Vision

I am building a YouTube intelligence backend for MCP clients with these principles:

1. **Reliable by default** - every tool has a source fallback path.
2. **Useful by default** - outputs answer decisions, not just retrieval requests.
3. **Compact by default** - small, structured responses that fit iterative workflows.
4. **Transparent by default** - provenance tells users which source path was used.
5. **Extensible by default** - architecture supports new analyzers and transports.

### Non-Goals (V1-V3)

- Full YouTube publishing automation (upload/update/comment posting)
- Video editing/render pipelines
- Ads campaign management

---

## 6) Feature Specification (Tool Catalog + Schemas)

I am naming tools by user intent. All schemas below are implementation-ready TypeScript interfaces and map directly to Zod validators.

### 6.1 Shared Types

```ts
export type SourceTier = "youtube_api" | "yt_dlp" | "page_extract" | "none";

export interface Provenance {
  sourceTier: SourceTier;
  sourceNotes?: string[];
  fetchedAt: string; // ISO-8601
  fallbackDepth: 0 | 1 | 2 | 3;
  partial: boolean;
}

export interface Pagination {
  nextPageToken?: string;
  prevPageToken?: string;
}

export interface TimeRange {
  from?: string; // ISO-8601
  to?: string;   // ISO-8601
}

export interface TokenControls {
  compact?: boolean; // default true
  includeRaw?: boolean; // default false
  fields?: string[]; // selective projection
}
```

---

### 6.2 V1 Tools (Core Data + Fallback + Sentiment)

#### Tool: `findVideos`

```ts
export interface FindVideosInput extends TokenControls {
  query: string;
  maxResults?: number; // 1..50 default 10
  order?: "relevance" | "date" | "viewCount" | "rating";
  regionCode?: string; // ISO country
  publishedAfter?: string; // ISO-8601
  publishedBefore?: string; // ISO-8601
  channelId?: string;
  duration?: "any" | "short" | "medium" | "long";
}

export interface FindVideosOutput {
  query: string;
  results: Array<{
    videoId: string;
    title: string;
    channelId: string;
    channelTitle: string;
    publishedAt?: string;
    durationSec?: number;
    views?: number;
    engagementRate?: number; // normalized when possible
  }>;
  pagination?: Pagination;
  provenance: Provenance;
}
```

#### Tool: `inspectVideo`

```ts
export interface InspectVideoInput extends TokenControls {
  videoIdOrUrl: string;
  includeTranscriptMeta?: boolean; // default true
  includeEngagementRatios?: boolean; // default true
}

export interface InspectVideoOutput {
  video: {
    videoId: string;
    title: string;
    channelId: string;
    channelTitle: string;
    publishedAt?: string;
    durationSec?: number;
    category?: string;
    tags?: string[];
    language?: string;
  };
  stats: {
    views?: number;
    likes?: number;
    comments?: number;
    likeRate?: number;
    commentRate?: number;
    viewVelocity24h?: number;
  };
  transcriptMeta?: {
    available: boolean;
    languages?: string[];
  };
  provenance: Provenance;
}
```

#### Tool: `inspectChannel`

```ts
export interface InspectChannelInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
}

export interface InspectChannelOutput {
  channel: {
    channelId: string;
    title: string;
    handle?: string;
    createdAt?: string;
    country?: string;
    descriptionSummary?: string;
  };
  stats: {
    subscribers?: number;
    totalViews?: number;
    totalVideos?: number;
    avgViewsPerVideo?: number;
  };
  cadence: {
    uploadsLast30d?: number;
    uploadsLast90d?: number;
    medianDaysBetweenUploads?: number;
  };
  provenance: Provenance;
}
```

#### Tool: `listChannelCatalog`

```ts
export interface ListChannelCatalogInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  maxResults?: number; // 1..100 default 25
  sortBy?: "date_desc" | "date_asc" | "views_desc";
  includeShorts?: boolean; // default true
  includeLongForm?: boolean; // default true
  publishedWithinDays?: number;
}

export interface ListChannelCatalogOutput {
  channelId: string;
  items: Array<{
    videoId: string;
    title: string;
    publishedAt?: string;
    durationSec?: number;
    format: "short" | "long" | "unknown";
    views?: number;
    likes?: number;
    comments?: number;
  }>;
  pagination?: Pagination;
  provenance: Provenance;
}
```

#### Tool: `readTranscript`

```ts
export interface ReadTranscriptInput extends TokenControls {
  videoIdOrUrl: string;
  language?: string; // preferred language code
  mode?: "full" | "summary" | "key_moments" | "chapters"; // default key_moments
  includeTimestamps?: boolean; // default true
  chunkWindowSec?: number; // for key_moments mode
  // Long-video pagination (only applies when mode="full")
  offset?: number; // character offset to start from, default 0
  limit?: number; // max characters to return, default 32000 (~8K tokens)
}

export interface ReadTranscriptOutput {
  videoId: string;
  languageUsed?: string;
  transcript: {
    mode: "full" | "summary" | "key_moments" | "chapters";
    text?: string; // summary/full when compact=false
    segments?: Array<{
      tStartSec: number;
      tEndSec?: number;
      text: string;
      topicLabel?: string;
      chapterTitle?: string; // populated when mode="chapters"
    }>;
  };
  // Long-video metadata
  longVideoHandling?: {
    totalCharacters: number;
    totalEstimatedTokens: number;
    autoDowngraded: boolean; // true if mode was auto-switched from "full" due to length
    originalMode?: string; // what the user requested before auto-downgrade
    pagination?: {
      offset: number;
      limit: number;
      hasMore: boolean;
      nextOffset?: number;
    };
  };
  chapters?: Array<{
    title: string;
    tStartSec: number;
    tEndSec?: number;
  }>;
  quality: {
    sourceType: "manual_caption" | "auto_caption" | "generated_from_audio" | "unknown";
    confidence?: number; // 0..1
  };
  provenance: Provenance;
}
```

**Long-video safeguards (auto-applied):**
- If transcript exceeds 32,000 characters (~8K tokens), `mode="full"` is auto-downgraded to `mode="key_moments"` with `longVideoHandling.autoDowngraded = true` and the original mode preserved.
- The LLM can override by explicitly requesting `mode="full"` with `offset` and `limit` to paginate through long transcripts in chunks.
- `mode="chapters"` uses YouTube chapter markers from the video description as natural segment boundaries - ideal for lectures and tutorials.
- All modes return `longVideoHandling` metadata so the LLM knows the total length and can decide whether to paginate or summarize.
```

#### Tool: `readComments`

```ts
export interface ReadCommentsInput extends TokenControls {
  videoIdOrUrl: string;
  maxTopLevel?: number; // 1..200 default 50
  includeReplies?: boolean; // default false
  maxRepliesPerThread?: number; // 0..20
  order?: "relevance" | "time";
  languageHint?: string;
}

export interface ReadCommentsOutput {
  videoId: string;
  totalFetched: number;
  threads: Array<{
    commentId: string;
    author: string;
    text: string;
    likeCount?: number;
    publishedAt?: string;
    replies?: Array<{
      commentId: string;
      author: string;
      text: string;
      likeCount?: number;
      publishedAt?: string;
    }>;
  }>;
  pagination?: Pagination;
  provenance: Provenance;
}
```

#### Tool: `measureAudienceSentiment`

```ts
export interface MeasureAudienceSentimentInput extends TokenControls {
  videoIdOrUrl: string;
  sampleSize?: number; // default 200 comments
  includeThemes?: boolean; // default true
  includeRepresentativeQuotes?: boolean; // default true
}

export interface MeasureAudienceSentimentOutput {
  videoId: string;
  sampleSize: number;
  sentiment: {
    positivePct: number;
    neutralPct: number;
    negativePct: number;
    sentimentScore: number; // -100..100
  };
  themes?: Array<{
    theme: string;
    prevalencePct: number;
    sentimentScore: number; // -100..100
  }>;
  riskSignals?: Array<{
    signal: string;
    severity: "low" | "medium" | "high";
    frequencyPct: number;
  }>;
  representativeQuotes?: Array<{
    text: string;
    sentiment: "positive" | "neutral" | "negative";
  }>;
  provenance: Provenance;
}
```

#### Tool: `watchTopicTrends`

```ts
export interface WatchTopicTrendsInput extends TokenControls {
  topic: string;
  regionCode?: string;
  maxResults?: number; // 1..50
  lookbackDays?: number; // default 30
}

export interface WatchTopicTrendsOutput {
  topic: string;
  summary: {
    trendDirection: "up" | "flat" | "down";
    medianViews?: number;
    medianComments?: number;
    postingVelocity?: number; // videos/day in sample
  };
  leadingVideos: Array<{
    videoId: string;
    title: string;
    channelTitle: string;
    views?: number;
    publishedAt?: string;
  }>;
  provenance: Provenance;
}
```

---

### 6.2.1 Batch + Playlist Operations (Added for Multi-Video Workflows)

These tools are required so MCP clients (Claude Code, ChatGPT desktop, etc.) can analyze multiple videos or playlist URLs in one reliable call instead of relying on fragile client-side fan-out.

#### Tool: `analyzeVideoSet`

```ts
export type VideoAnalysisMode =
  | "video_info"
  | "transcript"
  | "comments"
  | "sentiment"
  | "hook_patterns"
  | "tag_title_patterns";

export interface AnalyzeVideoSetInput extends TokenControls {
  videoIdsOrUrls: string[]; // 1..20
  analyses: VideoAnalysisMode[]; // at least one
  commentsSampleSize?: number; // default 50 per video when comments/sentiment requested
  transcriptMode?: "summary" | "key_moments" | "full"; // default key_moments
}

export interface AnalyzeVideoSetOutput {
  requestedCount: number;
  processedCount: number;
  failedCount: number;
  items: Array<{
    videoId: string;
    analyses: {
      videoInfo?: InspectVideoOutput;
      transcript?: ReadTranscriptOutput;
      comments?: ReadCommentsOutput;
      sentiment?: MeasureAudienceSentimentOutput;
      hookPatterns?: {
        hookScore: number;
        hookType: "question" | "promise" | "shock" | "story" | "proof" | "other";
        first30SecSummary: string;
      };
      tagTitlePatterns?: {
        recurringKeywords: string[];
        titleStructure: string[];
      };
    };
    errors?: GracefulError[];
    provenance: Provenance;
  }>;
  summary: {
    successRatePct: number;
    avgFallbackDepth: number;
  };
}
```

#### Tool: `expandPlaylist`

```ts
export interface ExpandPlaylistInput extends TokenControls {
  playlistUrlOrId: string;
  maxVideos?: number; // 1..200 default 50
  includeVideoMeta?: boolean; // default false
}

export interface ExpandPlaylistOutput {
  playlist: {
    playlistId: string;
    title?: string;
    channelTitle?: string;
    videoCountReported?: number;
  };
  videos: Array<{
    videoId: string;
    title?: string;
    publishedAt?: string;
    channelTitle?: string;
  }>;
  truncated: boolean;
  provenance: Provenance;
}
```

#### Tool: `analyzePlaylist`

```ts
export interface AnalyzePlaylistInput extends TokenControls {
  playlistUrlOrId: string;
  analyses: VideoAnalysisMode[]; // at least one
  maxVideos?: number; // 1..100 default 25
  commentsSampleSize?: number;
  transcriptMode?: "summary" | "key_moments" | "full";
}

export interface AnalyzePlaylistOutput {
  playlist: {
    playlistId: string;
    title?: string;
    channelTitle?: string;
  };
  run: {
    maxVideos: number;
    processed: number;
    failed: number;
  };
  items: AnalyzeVideoSetOutput["items"];
  aggregate: {
    medianViews?: number;
    avgSentimentScore?: number;
    dominantThemes?: string[];
    hookBenchmark?: {
      medianHookScore?: number;
      topQuartileHookScore?: number;
    };
  };
  provenance: Provenance;
}
```

### Batch/Fallback Contract for these tools
- Use the same fallback chain per video item: `youtube_api -> yt_dlp -> page_extract -> graceful error`.
- Partial success is allowed: one failed video must not fail the full batch.
- Each item returns its own `errors[]` and `provenance`.

---

### 6.2.2 Playlist Import + Semantic Search (V1 - Core Feature)

These tools are the primary differentiator. No other TypeScript YouTube MCP server offers playlist-level ingestion with semantic search across indexed transcripts. This is the "knowledge base" workflow: import a playlist → index all transcripts → search across them semantically.

**Use cases driving this:**
- "Here's my playlist of 20 Stanford CS229 lectures - find every mention of gradient descent across all of them"
- "Import this playlist of product management talks and search for advice on prioritization frameworks"
- "Index a creator's entire upload history and find patterns in their content strategy"

**Architecture decision:** Use `sqlite-vec` (SQLite vector extension) for the embedding store. This keeps the zero-config philosophy - no external database required. Embeddings are stored alongside the cache in the same SQLite database. For users who want scale, the store interface supports pluggable backends (ChromaDB, Postgres+pgvector).

**Embedding model:** Use a small, fast, local embedding model by default (e.g., `@xenova/transformers` with `all-MiniLM-L6-v2`, ~80MB). No API key needed. Optional override to use OpenAI `text-embedding-3-small` or similar when configured.

#### Tool: `importPlaylist`

Ingests all videos in a playlist: fetches transcripts, chunks them, generates embeddings, and stores them in the local vector index. This is the entry point for building a searchable knowledge base from YouTube content.

```ts
export interface ImportPlaylistInput extends TokenControls {
  playlistUrlOrId: string;
  maxVideos?: number; // 1..500 default 50
  chunkStrategy?: "time_window" | "chapters" | "auto"; // default "auto" - uses chapters when available, falls back to time_window
  chunkSizeSec?: number; // transcript chunk window in seconds, default 120 (for time_window strategy)
  chunkOverlapSec?: number; // overlap between chunks, default 30
  language?: string; // preferred transcript language
  reindexExisting?: boolean; // default false - skip already-indexed videos
  label?: string; // optional human-readable name for this collection
}

export interface ImportPlaylistOutput {
  playlist: {
    playlistId: string;
    title?: string;
    channelTitle?: string;
    videoCountReported?: number;
  };
  import: {
    totalVideos: number;
    imported: number;
    skipped: number; // already indexed
    failed: number;
    chunksCreated: number;
    embeddingsGenerated: number;
  };
  failures?: Array<{
    videoId: string;
    reason: string;
  }>;
  collectionId: string; // internal ID for this indexed collection
  provenance: Provenance;
}
```

#### Tool: `importVideos`

Same as `importPlaylist` but for ad-hoc video sets (not tied to a playlist). Useful for "index these 5 specific videos."

```ts
export interface ImportVideosInput extends TokenControls {
  videoIdsOrUrls: string[]; // 1..50
  chunkSizeSec?: number; // default 120
  chunkOverlapSec?: number; // default 30
  language?: string;
  collectionId?: string; // add to existing collection, or create new
  label?: string;
}

export interface ImportVideosOutput {
  import: {
    totalVideos: number;
    imported: number;
    skipped: number;
    failed: number;
    chunksCreated: number;
    embeddingsGenerated: number;
  };
  failures?: Array<{
    videoId: string;
    reason: string;
  }>;
  collectionId: string;
  provenance: Provenance;
}
```

#### Tool: `searchTranscripts`

Semantic search across all indexed video transcripts. Returns ranked results with source video, timestamp, and surrounding context. This is the core "ask questions across your video library" tool.

```ts
export interface SearchTranscriptsInput extends TokenControls {
  query: string;
  collectionId?: string; // search specific collection, or all if omitted
  maxResults?: number; // 1..50 default 10
  minScore?: number; // 0..1 similarity threshold, default 0.5
  videoIdFilter?: string[]; // restrict to specific videos within collection
}

export interface SearchTranscriptsOutput {
  query: string;
  results: Array<{
    videoId: string;
    videoTitle: string;
    channelTitle?: string;
    chunkText: string;
    tStartSec: number;
    tEndSec: number;
    timestampUrl: string; // deep link: https://youtu.be/{id}?t={sec}
    score: number; // 0..1 similarity
    context?: {
      prevChunkText?: string;
      nextChunkText?: string;
    };
  }>;
  searchMeta: {
    totalChunksSearched: number;
    embeddingModel: string;
    searchLatencyMs: number;
  };
  provenance: Provenance;
}
```

#### Tool: `listCollections`

List all indexed collections (playlists/video sets) with stats.

```ts
export interface ListCollectionsInput extends TokenControls {
  includeVideoList?: boolean; // default false
}

export interface ListCollectionsOutput {
  collections: Array<{
    collectionId: string;
    label?: string;
    sourcePlaylistId?: string;
    videoCount: number;
    totalChunks: number;
    createdAt: string;
    lastUpdatedAt: string;
  }>;
  provenance: Provenance;
}
```

#### Tool: `removeCollection`

Delete an indexed collection and its embeddings.

```ts
export interface RemoveCollectionInput {
  collectionId: string;
}

export interface RemoveCollectionOutput {
  removed: boolean;
  collectionId: string;
  chunksDeleted: number;
}
```

---

### 6.2.3 Video Download (V1 - Opt-in Tool)

Video downloading is an opt-in capability. It is NOT registered by default - users must explicitly enable it via config (`enableDownload: true`) to keep the default tool surface lean and avoid legal concerns for users who don't want it.

**How MCP tool configuration works for the LLM:** MCP servers declare their tools at startup. The LLM (Claude, ChatGPT, etc.) sees a list of available tools with descriptions and schemas. It picks the right tool based on what the user asks. So if `downloadVideo` is enabled, the LLM will see it alongside `readTranscript`, `searchTranscripts`, etc. and use it when the user says "download this video." The user never writes JSON - they just ask in natural language.

#### Tool: `downloadVideo`

```ts
export interface DownloadVideoInput {
  videoIdOrUrl: string;
  format?: "mp4" | "webm" | "mp3" | "m4a" | "wav"; // default "mp4"
  quality?: "best" | "1080p" | "720p" | "480p" | "audio_only"; // default "720p"
  outputDir?: string; // default: OS temp dir or configurable base path
  filenameTemplate?: string; // yt-dlp template, default "%(title)s.%(ext)s"
}

export interface DownloadVideoOutput {
  videoId: string;
  title: string;
  filePath: string;
  fileSize: number; // bytes
  format: string;
  quality: string;
  durationSec?: number;
  provenance: Provenance;
}
```

**Configuration:** Enabled via environment variable `YOUTUBE_MCP_ENABLE_DOWNLOAD=true` or MCP server config. When disabled, the tool is not registered and invisible to the LLM.

---

### 6.3 V2 Tools (Creator Intelligence)

#### Tool: `findContentGaps`

```ts
export interface FindContentGapsInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  nicheKeywords: string[];
  lookbackDays?: number; // default 180
  competitorChannelIds?: string[];
}

export interface FindContentGapsOutput {
  channelId: string;
  opportunities: Array<{
    gapTopic: string;
    demandScore: number; // 0..100
    competitionScore: number; // 0..100
    opportunityScore: number; // 0..100
    suggestedAngles: string[];
  }>;
  evidence: {
    undercoveredKeywords: string[];
    missedFormats: Array<"tutorial" | "review" | "case_study" | "reaction" | "short" | "long">;
  };
  provenance: Provenance;
}
```

#### Tool: `scoreHookPatterns`

```ts
export interface ScoreHookPatternsInput extends TokenControls {
  videoIdsOrUrls: string[]; // up to 20
  hookWindowSec?: number; // default 30
}

export interface ScoreHookPatternsOutput {
  videos: Array<{
    videoId: string;
    hookScore: number; // 0..100
    hookType: "question" | "promise" | "shock" | "story" | "proof" | "other";
    first30SecSummary: string;
    weakSignals: string[];
    improvements: string[];
  }>;
  benchmark: {
    medianHookScore: number;
    topQuartileHookScore: number;
  };
  provenance: Provenance;
}
```

#### Tool: `recommendUploadWindows`

```ts
export interface RecommendUploadWindowsInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  timezone: string; // IANA TZ
  lookbackDays?: number; // default 120
}

export interface RecommendUploadWindowsOutput {
  channelId: string;
  recommendedSlots: Array<{
    weekday: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
    hourLocal: number; // 0..23
    confidence: number; // 0..1
    rationale: string;
  }>;
  observedPatterns: {
    bestDay?: string;
    bestHour?: number;
    consistencyScore?: number; // 0..100
  };
  provenance: Provenance;
}
```

#### Tool: `compareShortsVsLong`

```ts
export interface CompareShortsVsLongInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  lookbackDays?: number; // default 180
}

export interface CompareShortsVsLongOutput {
  channelId: string;
  shorts: {
    count: number;
    medianViews?: number;
    medianEngagementRate?: number;
    medianCommentRate?: number;
  };
  longForm: {
    count: number;
    medianViews?: number;
    medianEngagementRate?: number;
    medianCommentRate?: number;
  };
  recommendation: {
    suggestedMixShortPct: number; // 0..100
    suggestedMixLongPct: number; // 0..100
    rationale: string[];
  };
  provenance: Provenance;
}
```

#### Tool: `researchTagsAndTitles`

```ts
export interface ResearchTagsAndTitlesInput extends TokenControls {
  seedTopic: string;
  regionCode?: string;
  language?: string;
  maxExamples?: number; // default 20
}

export interface ResearchTagsAndTitlesOutput {
  seedTopic: string;
  winningPatterns: {
    titleStructures: string[];
    recurringKeywords: string[];
    highSignalTags: string[];
    lowSignalTags: string[];
  };
  examples: Array<{
    videoId: string;
    title: string;
    tags?: string[];
    views?: number;
    engagementRate?: number;
  }>;
  provenance: Provenance;
}
```

---

### 6.4 V3 Tools (Competitor + Brand Intelligence)

#### Tool: `benchmarkChannels`

```ts
export interface BenchmarkChannelsInput extends TokenControls {
  channelIdsOrHandles: string[]; // 2..10
  lookbackDays?: number; // default 180
  normalizeBySubscribers?: boolean; // default true
}

export interface BenchmarkChannelsOutput {
  channels: Array<{
    channelId: string;
    title: string;
    subscribers?: number;
    uploads: number;
    medianViews?: number;
    medianEngagementRate?: number;
    growthRate30d?: number;
    benchmarkScore: number; // 0..100
  }>;
  leaders: {
    byViews: string;
    byEngagement: string;
    byGrowth: string;
  };
  provenance: Provenance;
}
```

#### Tool: `measureShareOfVoice`

```ts
export interface MeasureShareOfVoiceInput extends TokenControls {
  topicKeywords: string[];
  channelIdsOrHandles: string[]; // candidate set
  lookbackDays?: number; // default 90
  regionCode?: string;
}

export interface MeasureShareOfVoiceOutput {
  topicKeywords: string[];
  totalSampleVideos: number;
  channels: Array<{
    channelId: string;
    mentionSharePct: number; // topic presence
    viewSharePct: number;
    engagementSharePct: number;
    weightedSovPct: number;
  }>;
  concentration: {
    top3WeightedSovPct: number;
    fragmentationIndex: number; // 0..100
  };
  provenance: Provenance;
}
```

#### Tool: `mapGrowthTrajectory`

```ts
export interface MapGrowthTrajectoryInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  lookbackDays?: number; // default 365
  granularity?: "weekly" | "monthly"; // default weekly
}

export interface MapGrowthTrajectoryOutput {
  channelId: string;
  trajectory: Array<{
    periodStart: string;
    uploads: number;
    medianViews?: number;
    medianEngagementRate?: number;
    momentumScore: number; // -100..100
  }>;
  inflectionPoints: Array<{
    periodStart: string;
    reasonHypothesis: string;
    impactScore: number; // 0..100
  }>;
  forwardSignal: {
    shortTermOutlook: "accelerating" | "stable" | "decelerating";
    confidence: number; // 0..1
  };
  provenance: Provenance;
}
```

#### Tool: `detectSponsoredContent`

```ts
export interface DetectSponsoredContentInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  lookbackVideos?: number; // default 50
}

export interface DetectSponsoredContentOutput {
  channelId: string;
  estimatedSponsoredPct: number; // 0..100
  flaggedVideos: Array<{
    videoId: string;
    title: string;
    confidence: number; // 0..1
    detectedSignals: string[]; // disclosure keywords, CTA patterns, links
  }>;
  sponsorCategories: Array<{
    category: string;
    prevalencePct: number;
  }>;
  provenance: Provenance;
}
```

#### Tool: `findAudienceOverlap`

```ts
export interface FindAudienceOverlapInput extends TokenControls {
  seedChannelIdOrHandle: string;
  candidateChannelIdsOrHandles: string[];
  lookbackDays?: number; // default 180
}

export interface FindAudienceOverlapOutput {
  seedChannelId: string;
  overlaps: Array<{
    candidateChannelId: string;
    overlapScore: number; // 0..100
    evidenceSignals: string[]; // shared commenters, keyword clusters, format similarity
    collaborationFit: "low" | "medium" | "high";
  }>;
  topCollabCandidates: string[];
  provenance: Provenance;
}
```

#### Tool: `assessMonetizationReadiness`

```ts
export interface AssessMonetizationReadinessInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  lookbackDays?: number; // default 180
}

export interface AssessMonetizationReadinessOutput {
  channelId: string;
  readinessScore: number; // 0..100
  dimensions: {
    consistencyScore: number;
    engagementQualityScore: number;
    nicheClarityScore: number;
    brandSafetyScore: number;
    audienceIntentScore: number;
  };
  recommendations: Array<{
    priority: "P0" | "P1" | "P2";
    action: string;
    expectedImpact: string;
  }>;
  provenance: Provenance;
}
```

---

## 7) Technical Architecture

### 7.1 Stack

- **Language:** TypeScript (Node 20+)
- **MCP SDK:** official TS MCP SDK
- **Transports:**
  - `stdio` (local desktop clients)
  - `SSE` (remote/self-hosted mode)
- **Data Sources:**
  - YouTube Data API v3 (primary when configured)
  - `yt-dlp` (secondary retrieval path)
  - Page extraction parser (tertiary fallback)
- **Vector / Embedding:**
  - `sqlite-vec` (default, zero-config - embeddings stored in same SQLite as cache)
  - `@xenova/transformers` with `all-MiniLM-L6-v2` for local embeddings (~80MB, no API key)
  - Optional: OpenAI `text-embedding-3-small` when `OPENAI_API_KEY` is set
  - Pluggable backend interface for ChromaDB, Postgres+pgvector
- **Packaging:** npm package (single binary entry + server mode)

### 7.2 Services

- `SourceOrchestrator` - executes fallback chain and source selection
- `YouTubeApiAdapter` - typed wrapper for v3 endpoints
- `YtDlpAdapter` - metadata/transcript/comment extraction
- `PageExtractAdapter` - HTML/JSON-LD extraction from watch/channel pages
- `Normalizer` - canonical schema mapping across all source tiers
- `Analyzer` - sentiment, hooks, gaps, benchmarks, overlap, readiness scoring
- `TokenCompressor` - field pruning, numeric compaction, optional summaries
- `CacheStore` - TTL-based cache (SQLite default, pluggable Postgres/Redis)
- `VectorStore` - embedding index for semantic search (sqlite-vec default, pluggable ChromaDB/pgvector)
- `Embedder` - text → vector pipeline (local Xenova/transformers default, optional OpenAI)
- `TranscriptChunker` - splits transcripts into overlapping time-windowed chunks for indexing
- `CollectionManager` - manages playlist/video-set collections and their lifecycle
- `Telemetry` - latency, fallback depth, error rates, token savings

### 7.3 Caching Strategy

- Query-level and entity-level cache keys
- Default TTLs:
  - Search/trending: 15 min
  - Video/channel metadata: 6 hours
  - Transcript/comments: 24 hours
  - Analyzer outputs: 2 hours (invalidated by upstream changes)
  - Vector embeddings: persistent (no TTL - transcript content doesn't change)
  - Collection metadata: persistent (user-managed lifecycle via `removeCollection`)

### 7.4 Security and Privacy

- Credentials loaded from env only
- No secrets persisted in logs
- Configurable telemetry redaction mode
- Rate-limit guardrails to avoid accidental API quota burn

---

## 8) Fallback Chain Design

Every tool call follows this deterministic strategy:

1. **Tier 1 - YouTube Data API v3**
   - Use when credentials are present and quota allows.
   - Highest structure and speed for search/channel/video stats.

2. **Tier 2 - `yt-dlp`**
   - Used when API key missing, quota exceeded, or endpoint error.
   - Great for metadata and transcripts.

3. **Tier 3 - Page extraction**
   - Parse public page artifacts (JSON-LD / script payloads / HTML sections).
   - Lower confidence for some metrics; marked as partial where needed.

4. **Tier 4 - Graceful error**
   - If all tiers fail, return actionable error with next-step guidance.
   - Never return empty opaque failure.

### Error Contract

```ts
export interface GracefulError {
  code:
    | "INVALID_INPUT"
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "UPSTREAM_UNAVAILABLE"
    | "INSUFFICIENT_PUBLIC_DATA"
    | "INTERNAL_ERROR";
  message: string;
  retryable: boolean;
  attemptedTiers: SourceTier[];
  suggestion?: string;
}
```

### Fallback Acceptance Targets

- ≥95% successful response rate across all calls (including fallback success)
- ≤1% hard failures due to source unavailability
- Provenance attached in 100% of responses

---

## 9) Token Optimization Design

I will treat token efficiency as a product feature.

### Compression Rules

- `compact: true` by default
- drop heavy low-value fields (e.g., thumbnails, etags, redundant nested metadata)
- fixed small key schema (`videoId`, `views`, `engagementRate`, etc.)
- numeric normalization (ratios/scores precomputed)
- field projection (`fields[]`) for selective output
- optional verbose mode (`includeRaw=true`) for debugging only

### Expected Savings (target)

- `inspectVideo`: **~75%** reduction vs raw API object
- `inspectChannel`: **~87%** reduction vs raw API object
- `findVideos`: **~64%** reduction vs raw API list payload

### Verification Plan

- Built-in benchmark harness comparing raw API payload token count vs compact output
- CI check to block regressions >10% in token footprint

---

## 10) Phasing and Roadmap

### Phase 0: Validate (Week 0 — before writing code)

**Purpose:** Prove demand exists before investing engineering time. Distribution > features.

**Scope:**
- Write r/mcp launch post as if the product exists (positioning test)
- Write the README as the "sell" page — what it does, why it matters, how it's different
- Build a 60-second concept video (Remotion-based, demo-able prototype)
- Post to r/mcp, r/ClaudeAI, r/LocalLLaMA — gauge reactions
- Identify 10 early adopters (DM MCP power users from Reddit threads)

**Exit Criteria:**
- Reddit post gets meaningful engagement (≥20 upvotes, ≥5 substantive comments)
- At least 3 "where can I install this?" or "when is this shipping?" signals
- Zero or negative signal → re-evaluate scope/positioning before building

**Go/No-Go:** If Phase 0 validates, proceed to MVP. If not, pivot positioning and test again before committing engineering effort.

---

### Phase MVP (Weeks 1–3) — The Demo-able Version

**Purpose:** Ship the minimum feature set that delivers the core magic: zero-config transcript retrieval + playlist-level semantic search. This is what the 60-second demo shows.

**Scope (4 tools):**
- `readTranscript` — zero-config via yt-dlp, long-video aware (auto-downgrade, pagination, chapter mode)
- `importPlaylist` — ingest playlist, fetch transcripts, chunk, embed, index locally
- `searchTranscripts` — semantic search across indexed transcripts with timestamp deep links
- `inspectVideo` — basic video metadata and stats

**Infrastructure:**
- Full fallback chain (yt-dlp → page extraction → graceful error; API v3 when key present)
- SQLite cache + sqlite-vec vector store (zero-config, single DB file)
- Local embedding model (@xenova/transformers, all-MiniLM-L6-v2, ~80MB, no API key)
- Provenance on every response
- `npx youtube-mcp` just works — zero config required

**Exit Criteria:**
- All 4 tools implemented + tests
- Fallback chain verified with and without API key
- Playlist import: successfully ingest 50-video playlist end-to-end
- Semantic search: relevant results across indexed videos with ≥0.7 precision@10
- Vector store: persistence verified across server restarts
- End-to-end demo: import Stanford CS playlist → search "backpropagation" → timestamped results
- npm publish: `npx youtube-mcp` installs and runs first try

**Launch (end of Week 3):**
- Publish to npm
- Post to r/mcp with real demo (not concept — working product)
- Submit to MCP directories (Smithery, Glama, PulseMCP)
- Update README with actual usage examples

---

### Phase V1 (Weeks 4–6) — Full Feature Set (only if MVP validates)

**Go/No-Go criteria (must pass ALL):**
- ≥50 GitHub stars on MVP
- ≥100 npm downloads/week
- ≥3 GitHub issues requesting features
- Rajan still has energy and conviction

**Scope (adds ~12 tools on top of MVP):**
- **Core retrieval:** `findVideos`, `inspectChannel`, `listChannelCatalog`, `readComments`, `measureAudienceSentiment`, `watchTopicTrends`
- **Batch + Playlist:** `expandPlaylist`, `analyzePlaylist`, `analyzeVideoSet`, `importVideos`
- **Management:** `listCollections`, `removeCollection`
- **Opt-in:** `downloadVideo` (behind `YOUTUBE_MCP_ENABLE_DOWNLOAD=true`)
- Compact output system (token optimization targeting 75-87% savings)
- Full test coverage (≥90%)

**Exit Criteria:**
- All V1 tools implemented + tests
- Sentiment output quality baseline validated
- Token optimization verified via benchmark harness
- Download tool tested across quality/format options

---

### Phase V2 (Weeks 7–10) — Creator Intelligence (only if V1 validates)

**Go/No-Go:** ≥100 stars, ≥200 downloads/week, ≥5 feature requests for creator tools

**Scope:**
- `findContentGaps`, `scoreHookPatterns`, `recommendUploadWindows`, `compareShortsVsLong`, `researchTagsAndTitles`
- Creator insights and recommendation quality tuning

**Exit Criteria:**
- Creator reports generated end-to-end for 20 sample channels
- Hook and gap scoring calibration completed

---

### Phase V3 (Weeks 11–14) — Competitor + Brand Intelligence (only if V2 validates)

**Go/No-Go:** ≥250 stars, clear demand signal from issues/discussions

**Scope:**
- `benchmarkChannels`, `measureShareOfVoice`, `mapGrowthTrajectory`, `detectSponsoredContent`, `findAudienceOverlap`, `assessMonetizationReadiness`
- Competitive + brand intelligence layer

**Exit Criteria:**
- Benchmark output stability across 3 niches
- Share-of-voice and trajectory metrics validated for consistency

---

## 11) Distribution Strategy

### Packaging

- Publish as `youtube-mcp-intel` (working name) on npm
- Provide:
  - `npx -y youtube-mcp-intel` quick start
  - Docker image for SSE deployment
  - example configs for Claude Desktop, Cursor, VS Code MCP

### Adoption Path

1. **Zero-config mode first** (no key required)
2. **API-enhanced mode second** (add key for higher fidelity and quota-dependent features)
3. **Team mode** (SSE + cache backing store)

### Developer Experience

- one-page quick start
- persona-based recipe docs (Creator / Researcher / Brand Builder)
- output examples with compact vs verbose comparison

---

## 12) Success Metrics

### Product Metrics

- **Activation:** ≥70% of new installs run at least one successful tool call in first session
- **Zero-config success:** ≥60% of first sessions succeed without API key
- **Fallback resilience:** ≥95% call success rate overall
- **Token efficiency:** median ≥75% reduction vs raw API baseline
- **Insight usage:** ≥40% of sessions invoke analysis tools (not just retrieval)

### Engineering Metrics

- p95 latency:
  - metadata/search tools: <2.5s
  - transcript/comment tools: <6s
  - analysis tools: <8s
- test coverage target: ≥90%
- unhandled errors: <0.5%

### Business/Adoption Metrics

- npm weekly downloads growth
- GitHub stars/contributions velocity
- repeat usage cohort retention (week 2 and week 4)

---

## 13) Risks and Mitigations

### Risk 1: Upstream platform changes break extraction

**Mitigation:**
- adapter isolation per source tier
- fixture-based contract tests
- rapid parser hotfix workflow

### Risk 2: API quota exhaustion in heavy usage

**Mitigation:**
- proactive cache + quota-aware scheduler
- automatic fallback to tier 2/3
- quota usage telemetry and warnings

### Risk 3: Sentiment/analysis quality variance by niche/language

**Mitigation:**
- confidence scoring + explicit caveats
- language-aware preprocessing
- iterative calibration set per vertical

### Risk 4: Token optimization hides useful detail

**Mitigation:**
- `compact` and `includeRaw` toggles
- field projection (`fields[]`) and verbose mode

### Risk 5: Embedding model size and first-run latency

**Mitigation:**
- `all-MiniLM-L6-v2` is only ~80MB - downloaded once on first use
- Progress feedback during model download
- Pre-built Docker images with model baked in
- Optional external embedding API for users who prefer not to download

### Risk 6: Large playlist import overwhelms resources

**Mitigation:**
- Configurable `maxVideos` cap (default 50)
- Sequential processing with progress reporting via MCP notifications
- Resumable imports (skip already-indexed videos by default)
- Chunked embedding generation to manage memory

### Risk 7: Overly broad scope across personas

**Mitigation:**
- strict phase gates
- V1 reliability first, V2/V3 insights second
- shipping increments with measurable exit criteria

---

## 14) Implementation Readiness Checklist

- [ ] Tool contracts finalized in Zod + TypeScript types
- [ ] Source adapters implemented with contract tests
- [ ] Fallback orchestrator with deterministic retry logic
- [ ] Compact serializer + token benchmark harness
- [ ] SQLite cache store with TTL management
- [ ] sqlite-vec vector store integration
- [ ] Local embedding pipeline (Xenova/transformers)
- [ ] Transcript chunker with time-windowed overlap
- [ ] Collection manager (create, list, remove)
- [ ] Playlist import pipeline (fetch → transcript → chunk → embed → store)
- [ ] Semantic search with ranked results + timestamp deep links
- [ ] CI pipeline: lint, unit, integration, token regression checks
- [ ] npm publish pipeline + versioning policy
- [ ] Quick-start docs and persona recipes

---

## 15) Final Product Positioning

I am positioning this product as:

> **"The reliable, zero-config YouTube intelligence server for MCP workflows - with built-in semantic search."**

The core value is not raw retrieval - it is dependable, compact, decision-ready intelligence that works even when ideal credentials are not available. The playlist import + semantic search workflow transforms YouTube from a passive video platform into a queryable knowledge base, all running locally with no API keys required.
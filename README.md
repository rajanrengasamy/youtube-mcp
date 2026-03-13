<p align="center">
  <h1 align="center">youtube-mcp</h1>
  <p align="center">
    <strong>The YouTube intelligence layer for MCP — zero config, actually works.</strong>
  </p>
  <p align="center">
    <a href="#install">Install</a> •
    <a href="#why-this-exists">Why</a> •
    <a href="#tools">Tools</a> •
    <a href="#how-it-works">How it works</a> •
    <a href="#examples">Examples</a>
  </p>
</p>

---

## Why this exists

Every YouTube MCP server I tried was broken in the same ways:

- **API key required to do anything.** You have to set up Google Cloud Console, create a project, enable the Data API, generate a key... just to get a transcript. Most people give up here.
- **Long videos crash.** A 2-hour lecture exceeds the 1MB MCP message limit and the server just dies. ([Real issue](https://github.com/anaisbetts/mcp-youtube/issues/1) on the most popular YouTube MCP server.)
- **Raw API dumps waste your context window.** The YouTube API returns massive nested JSON with eTags, thumbnails, localization data. Your LLM doesn't need any of that.
- **No analysis, just data.** You ask "how's the audience responding?" and get back 200 raw comments. Thanks.

`youtube-mcp` fixes all of this.

## What makes it different

| | youtube-mcp | Others |
|---|---|---|
| **Setup** | `npx youtube-mcp` — works immediately | API key required |
| **Long videos** | Auto-chunking, pagination, chapter-aware | Crash on >1MB |
| **Fallback** | API → yt-dlp → page extraction → graceful error | API fails = everything fails |
| **Output size** | 75-87% smaller (token-optimized) | Raw API payloads |
| **Analysis** | Sentiment, hook scoring, content gaps | Just retrieval |
| **Provenance** | Every response tells you which source was used | Black box |

## Install

### Claude Desktop / Claude Code

Add to your MCP config:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "youtube-mcp"]
    }
  }
}
```

That's it. No API key needed.

### Cursor / VS Code

Same config in your MCP settings. Works with any MCP-compatible client.

### Optional: Add a YouTube API key

For higher-fidelity search results and channel stats:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "youtube-mcp"],
      "env": {
        "YOUTUBE_API_KEY": "your_key_here"
      }
    }
  }
}
```

Without an API key, everything still works through `yt-dlp` fallback. The API key just gives you better search ranking and access to subscriber counts.

### Requirements

- Node.js ≥ 20
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) installed (`brew install yt-dlp` or `pip install yt-dlp`)

## Tools

### 14 tools across retrieval, analysis, and creator intelligence

#### Core Retrieval
| Tool | What it does |
|------|-------------|
| `findVideos` | Search YouTube with compact, engagement-scored results |
| `inspectVideo` | Video metadata, stats, engagement ratios, transcript availability |
| `inspectChannel` | Channel summary with posting cadence and growth heuristics |
| `listChannelCatalog` | Recent uploads filtered by format (Shorts/long-form), sorted by performance |

#### Transcript & Comments
| Tool | What it does |
|------|-------------|
| `readTranscript` | Full transcript with 4 modes: `full`, `summary`, `key_moments`, `chapters`. Long-video aware — auto-chunks and paginates |
| `readComments` | Top-level comments with optional reply threads |
| `measureAudienceSentiment` | Sentiment scoring, theme extraction, risk signals, representative quotes |

#### Batch & Playlist
| Tool | What it does |
|------|-------------|
| `analyzeVideoSet` | Analyze multiple videos in one call — partial success, per-item provenance |
| `expandPlaylist` | Playlist → video list with metadata |
| `analyzePlaylist` | Full playlist analysis with aggregate stats |

#### Creator Intelligence
| Tool | What it does |
|------|-------------|
| `scoreHookPatterns` | Score the first 30 seconds of videos for hook effectiveness |
| `researchTagsAndTitles` | Mine winning title structures and high-signal tags from search results |
| `compareShortsVsLong` | Compare Shorts vs long-form performance with mix recommendations |
| `recommendUploadWindows` | Best upload days/times based on historical posting patterns |

## How it works

### Three-tier fallback chain

Every tool call follows this strategy:

```
┌─────────────────────┐
│  YouTube API v3     │ ← Best data (when API key is set)
│  (primary)          │
└────────┬────────────┘
         │ fails/missing
         ▼
┌─────────────────────┐
│  yt-dlp             │ ← Works without API key
│  (fallback)         │
└────────┬────────────┘
         │ fails
         ▼
┌─────────────────────┐
│  Page extraction    │ ← HTML/JSON-LD parsing
│  (last resort)      │
└────────┬────────────┘
         │ fails
         ▼
┌─────────────────────┐
│  Graceful error     │ ← Actionable message + retry guidance
│  (never silent)     │
└─────────────────────┘
```

Every response includes **provenance** — you always know which source tier was used, whether data is partial, and the fallback depth.

### Long-video handling

Long videos (lectures, podcasts, livestreams) don't crash the server:

- **Auto-detection:** If a transcript exceeds ~8K tokens, `full` mode auto-downgrades to `key_moments` with a warning
- **Pagination:** Request `full` mode with `offset` and `limit` to read long transcripts in pages
- **Chapter mode:** Uses YouTube chapter markers as natural segment boundaries — ideal for lectures
- **Every response** includes `longVideoHandling` metadata so your LLM knows the total length

### Token optimization

Responses are 75-87% smaller than raw YouTube API payloads:

| API call | Raw YouTube API | youtube-mcp | Savings |
|----------|----------------|-------------|---------|
| Video details | ~2.9 KB | ~0.6 KB | **75%** |
| Channel stats | ~1.9 KB | ~0.2 KB | **87%** |
| Search results | ~3.4 KB | ~1.2 KB | **64%** |

No thumbnails. No eTags. No localization arrays. Just the data your LLM needs to reason.

## Examples

### "Summarize this video"

Ask your AI assistant:

> "Read the transcript of https://youtube.com/watch?v=abc123 and give me the key takeaways"

The assistant calls `readTranscript` with `mode: "key_moments"` → gets timestamped segments → synthesizes a summary.

### "Analyze this channel's content strategy"

> "Look at @mkbhd's last 20 videos. Compare Shorts vs long-form performance, and tell me what upload schedule they follow."

The assistant calls `listChannelCatalog` → `compareShortsVsLong` → `recommendUploadWindows` → gives you a complete content strategy breakdown.

### "Score the hooks on these videos"

> "Take these 5 video URLs and score their opening hooks. Which one grabs attention best?"

The assistant calls `scoreHookPatterns` → returns hook scores, types (question/promise/shock/story), and improvement suggestions.

### "What's the audience saying?"

> "Read the comments on this video and tell me the overall sentiment. Are there any red flags?"

The assistant calls `measureAudienceSentiment` → returns sentiment distribution, theme clusters, risk signals, and representative quotes.

### "Analyze an entire playlist"

> "Analyze the first 10 videos in this Stanford CS229 playlist — hook patterns and sentiment."

The assistant calls `analyzePlaylist` → processes each video with partial-success handling → returns per-video analysis plus aggregate benchmarks.

## Roadmap

### Shipped ✅
- 14 MCP tools (retrieval + analysis + creator intelligence)
- Three-tier fallback chain with provenance
- Token-optimized compact outputs
- Long-video safeguards (auto-chunking, pagination, chapters)
- Batch and playlist operations with partial success

### Coming next 🚧
- **Semantic search** — Import playlists, index transcripts, search across them like notes (`importPlaylist`, `searchTranscripts`)
- **Video download** — Opt-in, configurable quality/format
- **SQLite cache** — Zero-config caching to avoid repeated yt-dlp calls
- **SSE transport** — Remote/team deployment mode

### Future 🔮
- Competitor benchmarking across channels
- Share of voice measurement
- Growth trajectory analysis
- Sponsored content detection
- CLI and browser UI surfaces

## Development

```bash
git clone https://github.com/rajanrengasamy/youtube-mcp.git
cd youtube-mcp
npm install
npm run build
npm test
npm run smoke:dry   # All tools, dry mode, no network
npm start           # Start MCP server (stdio)
```

## How is this built?

TypeScript, [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk), and [`yt-dlp`](https://github.com/yt-dlp/yt-dlp). No heavyweight dependencies. No database required (yet — SQLite cache coming soon).

The architecture follows the [OpenClaw](https://github.com/openclaw/openclaw) workspace convention for AI-native development.

## License

MIT

---

<p align="center">
  <strong>Built by <a href="https://github.com/rajanrengasamy">Rajan Rengasamy</a></strong>
  <br/>
  <sub>If this saves you time, a ⭐ on the repo helps others find it.</sub>
</p>

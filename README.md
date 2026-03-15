<p align="center">
  <h1 align="center">VidLens MCP</h1>
  <p align="center">
    <strong>The YouTube intelligence layer for AI agents — zero config, 37 tools, actually works.</strong>
  </p>
</p>

---

## What is VidLens?

VidLens is a [Model Context Protocol](https://modelcontextprotocol.io/) server that gives AI agents deep access to YouTube — transcripts, semantic search, sentiment analysis, trend discovery, media assets, and more. No API key required to start.

### Why VidLens over other YouTube MCP servers?

| | VidLens | Others |
|---|---|---|
| **Zero config** | ✅ Works immediately with yt-dlp | ❌ Most require API keys |
| **Fallback chain** | ✅ YouTube API → yt-dlp → page extraction | ❌ Single point of failure |
| **Intelligence layer** | ✅ Sentiment, trends, content gaps | ❌ Raw data only |
| **Token optimized** | ✅ 75-87% smaller responses | ❌ Verbose JSON payloads |
| **Trademark safe** | ✅ Compliant naming | ⚠️ Most violate YouTube TM |

## Quick Start

```bash
# Claude Desktop / Claude Code
npx vidlens-mcp setup

# Or manual config
npx vidlens-mcp serve
```

### Claude Desktop Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vidlens-mcp": {
      "command": "npx",
      "args": ["-y", "vidlens-mcp", "serve"]
    }
  }
}
```

## Tools (37)

### Core (always available, no API key needed)
| Tool | What it does |
|---|---|
| `findVideos` | Search YouTube videos by query |
| `inspectVideo` | Deep metadata for any video |
| `inspectChannel` | Channel stats, description, recent uploads |
| `listChannelCatalog` | Browse a channel's video library |
| `readTranscript` | Full transcript with timestamps |
| `readComments` | Top comments with engagement data |
| `expandPlaylist` | List all videos in a playlist |

### Knowledge Base (semantic search across transcripts)
| Tool | What it does |
|---|---|
| `importPlaylist` | Index an entire playlist for search |
| `importVideos` | Index specific videos |
| `searchTranscripts` | Semantic search across indexed transcripts |
| `listCollections` | Browse your indexed collections |
| `setActiveCollection` | Scope searches to a collection |
| `clearActiveCollection` | Search across all collections |
| `removeCollection` | Delete a collection |

### Sentiment & Analysis
| Tool | What it does |
|---|---|
| `measureAudienceSentiment` | Comment sentiment with themes and risk signals |
| `analyzeVideoSet` | Compare multiple videos |
| `analyzePlaylist` | Playlist-level analytics |
| `buildVideoDossier` | Complete single-video deep dive |

### Creator Intelligence
| Tool | What it does |
|---|---|
| `scoreHookPatterns` | Analyze video opening hooks |
| `researchTagsAndTitles` | Tag and title optimization insights |
| `compareShortsVsLong` | Format performance comparison |
| `recommendUploadWindows` | Best times to publish |

### Discovery & Trends
| Tool | What it does |
|---|---|
| `discoverNicheTrends` | What's trending in any niche |
| `exploreNicheCompetitors` | Channel landscape for a topic |

### Media Assets
| Tool | What it does |
|---|---|
| `downloadAsset` | Download video/audio/thumbnail |
| `listMediaAssets` | Browse stored assets |
| `removeMediaAsset` | Clean up downloads |
| `extractKeyframes` | Extract frames from videos |
| `mediaStoreHealth` | Storage diagnostics |

### Comment Knowledge Base
| Tool | What it does |
|---|---|
| `importComments` | Index comments for semantic search |
| `searchComments` | Search across indexed comments |
| `listCommentCollections` | Browse comment collections |
| `setActiveCommentCollection` | Scope comment searches |
| `clearActiveCommentCollection` | Search all comment collections |
| `removeCommentCollection` | Delete a comment collection |

### Diagnostics
| Tool | What it does |
|---|---|
| `checkSystemHealth` | Full system diagnostic |
| `checkImportReadiness` | Pre-flight check before imports |

## API Keys (Optional)

VidLens works without any API keys. Add them to unlock more:

| Key | What it unlocks | How to get it |
|---|---|---|
| `YOUTUBE_API_KEY` | Higher fidelity metadata, comments API, better search | [Google Cloud Console](https://console.cloud.google.com/) → Enable YouTube Data API v3 → Create API key |
| `GEMINI_API_KEY` | Higher quality embeddings (768d vs 384d) | [Google AI Studio](https://aistudio.google.com/) → Create API key |

**Important:** These are separate keys from separate Google services. A Gemini key won't work for YouTube API and vice versa.

```bash
# Add keys via setup
npx vidlens-mcp setup --youtube-api-key YOUR_KEY --gemini-api-key YOUR_KEY

# Or via environment variables
export YOUTUBE_API_KEY=your_key
export GEMINI_API_KEY=your_key
```

## CLI Commands

```bash
npx vidlens-mcp               # Start MCP server (default)
npx vidlens-mcp serve         # Start MCP server
npx vidlens-mcp setup         # Configure MCP clients
npx vidlens-mcp doctor        # Run diagnostics
npx vidlens-mcp version       # Print version
npx vidlens-mcp help          # Show help
```

## Diagnostics

```bash
npx vidlens-mcp doctor --no-live
```

Checks: Node.js version, yt-dlp availability, API key status, data directory health, MCP client detection.

## Architecture

```
┌─────────────────────────────────────┐
│           MCP Client                │
│  (Claude, Cursor, VS Code, etc.)   │
└──────────────┬──────────────────────┘
               │ stdio
┌──────────────▼──────────────────────┐
│         VidLens MCP Server          │
│                                     │
│  ┌──────────────────────────────┐   │
│  │      37 MCP Tools            │   │
│  │  Core · KB · Sentiment ·     │   │
│  │  Creator · Trends · Media ·  │   │
│  │  Comments · Diagnostics      │   │
│  └──────────────┬───────────────┘   │
│                 │                    │
│  ┌──────────────▼───────────────┐   │
│  │    Three-Tier Fallback       │   │
│  │  YouTube API → yt-dlp →      │   │
│  │  Page Extraction             │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Requirements

- Node.js ≥ 20
- `yt-dlp` (recommended, not required)
- `ffmpeg` (for keyframe extraction only)

## License

MIT

## Links

- [GitHub](https://github.com/rajanrengasamy/vidlens-mcp)
- [npm](https://www.npmjs.com/package/vidlens-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

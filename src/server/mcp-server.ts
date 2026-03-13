import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { YouTubeService } from "../lib/youtube-service.js";

export const tools: Tool[] = [
  {
    name: "findVideos",
    description: "Search YouTube videos by intent. Returns compact ranked results with provenance and engagement hints.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        maxResults: { type: "number", minimum: 1, maximum: 25 },
        order: { type: "string", enum: ["relevance", "date", "viewCount", "rating"] },
        regionCode: { type: "string" },
        publishedAfter: { type: "string" },
        publishedBefore: { type: "string" },
        channelId: { type: "string" },
        duration: { type: "string", enum: ["any", "short", "medium", "long"] },
        dryRun: { type: "boolean" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "inspectVideo",
    description: "Inspect a single video with compact metadata, normalized ratios, and transcript availability.",
    inputSchema: {
      type: "object",
      properties: {
        videoIdOrUrl: { type: "string" },
        includeTranscriptMeta: { type: "boolean" },
        includeEngagementRatios: { type: "boolean" },
        dryRun: { type: "boolean" },
      },
      required: ["videoIdOrUrl"],
      additionalProperties: false,
    },
  },
  {
    name: "inspectChannel",
    description: "Inspect a channel with summary stats and posting cadence heuristics.",
    inputSchema: {
      type: "object",
      properties: {
        channelIdOrHandleOrUrl: { type: "string" },
        dryRun: { type: "boolean" },
      },
      required: ["channelIdOrHandleOrUrl"],
      additionalProperties: false,
    },
  },
  {
    name: "listChannelCatalog",
    description: "List a channel's recent catalog in compact creator-analysis shape.",
    inputSchema: {
      type: "object",
      properties: {
        channelIdOrHandleOrUrl: { type: "string" },
        maxResults: { type: "number", minimum: 1, maximum: 100 },
        sortBy: { type: "string", enum: ["date_desc", "date_asc", "views_desc"] },
        includeShorts: { type: "boolean" },
        includeLongForm: { type: "boolean" },
        publishedWithinDays: { type: "number", minimum: 1, maximum: 3650 },
        dryRun: { type: "boolean" },
      },
      required: ["channelIdOrHandleOrUrl"],
      additionalProperties: false,
    },
  },
  {
    name: "readTranscript",
    description: "Read transcript in summary, key moments, chapters, or paginated full mode with long-video safeguards.",
    inputSchema: {
      type: "object",
      properties: {
        videoIdOrUrl: { type: "string" },
        language: { type: "string" },
        mode: { type: "string", enum: ["full", "summary", "key_moments", "chapters"] },
        includeTimestamps: { type: "boolean" },
        chunkWindowSec: { type: "number", minimum: 30, maximum: 900 },
        offset: { type: "number", minimum: 0 },
        limit: { type: "number", minimum: 1000, maximum: 64000 },
        dryRun: { type: "boolean" },
      },
      required: ["videoIdOrUrl"],
      additionalProperties: false,
    },
  },
  {
    name: "readComments",
    description: "Read top-level comments with optional replies and structured provenance.",
    inputSchema: {
      type: "object",
      properties: {
        videoIdOrUrl: { type: "string" },
        maxTopLevel: { type: "number", minimum: 1, maximum: 200 },
        includeReplies: { type: "boolean" },
        maxRepliesPerThread: { type: "number", minimum: 0, maximum: 20 },
        order: { type: "string", enum: ["relevance", "time"] },
        languageHint: { type: "string" },
        dryRun: { type: "boolean" },
      },
      required: ["videoIdOrUrl"],
      additionalProperties: false,
    },
  },
  {
    name: "measureAudienceSentiment",
    description: "Heuristic audience sentiment analysis from comments with themes, risk signals, and quote samples.",
    inputSchema: {
      type: "object",
      properties: {
        videoIdOrUrl: { type: "string" },
        sampleSize: { type: "number", minimum: 1, maximum: 200 },
        includeThemes: { type: "boolean" },
        includeRepresentativeQuotes: { type: "boolean" },
        dryRun: { type: "boolean" },
      },
      required: ["videoIdOrUrl"],
      additionalProperties: false,
    },
  },
  {
    name: "analyzeVideoSet",
    description: "Run multiple analyses across a video set with partial success, item-level errors, and provenance.",
    inputSchema: {
      type: "object",
      properties: {
        videoIdsOrUrls: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 20 },
        analyses: {
          type: "array",
          items: { type: "string", enum: ["video_info", "transcript", "comments", "sentiment", "hook_patterns", "tag_title_patterns"] },
          minItems: 1,
        },
        commentsSampleSize: { type: "number", minimum: 1, maximum: 200 },
        transcriptMode: { type: "string", enum: ["summary", "key_moments", "full"] },
        dryRun: { type: "boolean" },
      },
      required: ["videoIdsOrUrls", "analyses"],
      additionalProperties: false,
    },
  },
  {
    name: "expandPlaylist",
    description: "Expand a playlist into individual videos for downstream analysis and batch workflows.",
    inputSchema: {
      type: "object",
      properties: {
        playlistUrlOrId: { type: "string" },
        maxVideos: { type: "number", minimum: 1, maximum: 200 },
        includeVideoMeta: { type: "boolean" },
        dryRun: { type: "boolean" },
      },
      required: ["playlistUrlOrId"],
      additionalProperties: false,
    },
  },
  {
    name: "analyzePlaylist",
    description: "Expand and analyze a playlist in one call with partial success and aggregate benchmarks.",
    inputSchema: {
      type: "object",
      properties: {
        playlistUrlOrId: { type: "string" },
        analyses: {
          type: "array",
          items: { type: "string", enum: ["video_info", "transcript", "comments", "sentiment", "hook_patterns", "tag_title_patterns"] },
          minItems: 1,
        },
        maxVideos: { type: "number", minimum: 1, maximum: 100 },
        commentsSampleSize: { type: "number", minimum: 1, maximum: 200 },
        transcriptMode: { type: "string", enum: ["summary", "key_moments", "full"] },
        dryRun: { type: "boolean" },
      },
      required: ["playlistUrlOrId", "analyses"],
      additionalProperties: false,
    },
  },
  {
    name: "scoreHookPatterns",
    description: "Heuristically score first-30-second hooks across one or more videos.",
    inputSchema: {
      type: "object",
      properties: {
        videoIdsOrUrls: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 20 },
        hookWindowSec: { type: "number", minimum: 10, maximum: 120 },
        dryRun: { type: "boolean" },
      },
      required: ["videoIdsOrUrls"],
      additionalProperties: false,
    },
  },
  {
    name: "researchTagsAndTitles",
    description: "Research title structures, keywords, and tag patterns around a seed topic.",
    inputSchema: {
      type: "object",
      properties: {
        seedTopic: { type: "string" },
        regionCode: { type: "string" },
        language: { type: "string" },
        maxExamples: { type: "number", minimum: 3, maximum: 20 },
        dryRun: { type: "boolean" },
      },
      required: ["seedTopic"],
      additionalProperties: false,
    },
  },
  {
    name: "compareShortsVsLong",
    description: "Compare recent Shorts vs long-form performance for a channel and suggest a format mix.",
    inputSchema: {
      type: "object",
      properties: {
        channelIdOrHandleOrUrl: { type: "string" },
        lookbackDays: { type: "number", minimum: 1, maximum: 3650 },
        dryRun: { type: "boolean" },
      },
      required: ["channelIdOrHandleOrUrl"],
      additionalProperties: false,
    },
  },
  {
    name: "recommendUploadWindows",
    description: "Recommend upload windows from recent publishing history for a given timezone.",
    inputSchema: {
      type: "object",
      properties: {
        channelIdOrHandleOrUrl: { type: "string" },
        timezone: { type: "string", description: "IANA timezone, e.g. Australia/Sydney" },
        lookbackDays: { type: "number", minimum: 1, maximum: 3650 },
        dryRun: { type: "boolean" },
      },
      required: ["channelIdOrHandleOrUrl", "timezone"],
      additionalProperties: false,
    },
  },
];

export function createYouTubeMcpServer(service = new YouTubeService()): Server {
  const server = new Server(
    {
      name: "youtube-mcp",
      version: "0.2.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
    const args = parseArgs(request.params.arguments);
    const dryRun = readBoolean(args, "dryRun", false);

    try {
      const result = await executeTool(service, request.params.name, args, dryRun);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const payload = normalizeError(error);
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      };
    }
  });

  return server;
}

export async function startStdioServer(service = new YouTubeService()): Promise<void> {
  const server = createYouTubeMcpServer(service);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function executeTool(
  service: YouTubeService,
  toolName: string,
  args: Record<string, unknown>,
  dryRun: boolean,
): Promise<unknown> {
  switch (toolName) {
    case "findVideos":
      return service.findVideos(
        {
          query: readString(args, "query"),
          maxResults: optionalNumber(args, "maxResults"),
          order: optionalEnum(args, "order", ["relevance", "date", "viewCount", "rating"]),
          regionCode: optionalString(args, "regionCode"),
          publishedAfter: optionalString(args, "publishedAfter"),
          publishedBefore: optionalString(args, "publishedBefore"),
          channelId: optionalString(args, "channelId"),
          duration: optionalEnum(args, "duration", ["any", "short", "medium", "long"]),
        },
        { dryRun },
      );

    case "inspectVideo":
      return service.inspectVideo(
        {
          videoIdOrUrl: readString(args, "videoIdOrUrl"),
          includeTranscriptMeta: optionalBoolean(args, "includeTranscriptMeta"),
          includeEngagementRatios: optionalBoolean(args, "includeEngagementRatios"),
        },
        { dryRun },
      );

    case "inspectChannel":
      return service.inspectChannel(
        {
          channelIdOrHandleOrUrl: readString(args, "channelIdOrHandleOrUrl"),
        },
        { dryRun },
      );

    case "listChannelCatalog":
      return service.listChannelCatalog(
        {
          channelIdOrHandleOrUrl: readString(args, "channelIdOrHandleOrUrl"),
          maxResults: optionalNumber(args, "maxResults"),
          sortBy: optionalEnum(args, "sortBy", ["date_desc", "date_asc", "views_desc"]),
          includeShorts: optionalBoolean(args, "includeShorts"),
          includeLongForm: optionalBoolean(args, "includeLongForm"),
          publishedWithinDays: optionalNumber(args, "publishedWithinDays"),
        },
        { dryRun },
      );

    case "readTranscript":
      return service.readTranscript(
        {
          videoIdOrUrl: readString(args, "videoIdOrUrl"),
          language: optionalString(args, "language"),
          mode: optionalEnum(args, "mode", ["full", "summary", "key_moments", "chapters"]),
          includeTimestamps: optionalBoolean(args, "includeTimestamps"),
          chunkWindowSec: optionalNumber(args, "chunkWindowSec"),
          offset: optionalNumber(args, "offset"),
          limit: optionalNumber(args, "limit"),
        },
        { dryRun },
      );

    case "readComments":
      return service.readComments(
        {
          videoIdOrUrl: readString(args, "videoIdOrUrl"),
          maxTopLevel: optionalNumber(args, "maxTopLevel"),
          includeReplies: optionalBoolean(args, "includeReplies"),
          maxRepliesPerThread: optionalNumber(args, "maxRepliesPerThread"),
          order: optionalEnum(args, "order", ["relevance", "time"]),
          languageHint: optionalString(args, "languageHint"),
        },
        { dryRun },
      );

    case "measureAudienceSentiment":
      return service.measureAudienceSentiment(
        {
          videoIdOrUrl: readString(args, "videoIdOrUrl"),
          sampleSize: optionalNumber(args, "sampleSize"),
          includeThemes: optionalBoolean(args, "includeThemes"),
          includeRepresentativeQuotes: optionalBoolean(args, "includeRepresentativeQuotes"),
        },
        { dryRun },
      );

    case "analyzeVideoSet":
      return service.analyzeVideoSet(
        {
          videoIdsOrUrls: readStringArray(args, "videoIdsOrUrls"),
          analyses: readStringArray(args, "analyses") as Array<
            "video_info" | "transcript" | "comments" | "sentiment" | "hook_patterns" | "tag_title_patterns"
          >,
          commentsSampleSize: optionalNumber(args, "commentsSampleSize"),
          transcriptMode: optionalEnum(args, "transcriptMode", ["summary", "key_moments", "full"]),
        },
        { dryRun },
      );

    case "expandPlaylist":
      return service.expandPlaylist(
        {
          playlistUrlOrId: readString(args, "playlistUrlOrId"),
          maxVideos: optionalNumber(args, "maxVideos"),
          includeVideoMeta: optionalBoolean(args, "includeVideoMeta"),
        },
        { dryRun },
      );

    case "analyzePlaylist":
      return service.analyzePlaylist(
        {
          playlistUrlOrId: readString(args, "playlistUrlOrId"),
          analyses: readStringArray(args, "analyses") as Array<
            "video_info" | "transcript" | "comments" | "sentiment" | "hook_patterns" | "tag_title_patterns"
          >,
          maxVideos: optionalNumber(args, "maxVideos"),
          commentsSampleSize: optionalNumber(args, "commentsSampleSize"),
          transcriptMode: optionalEnum(args, "transcriptMode", ["summary", "key_moments", "full"]),
        },
        { dryRun },
      );

    case "scoreHookPatterns":
      return service.scoreHookPatterns(
        {
          videoIdsOrUrls: readStringArray(args, "videoIdsOrUrls"),
          hookWindowSec: optionalNumber(args, "hookWindowSec"),
        },
        { dryRun },
      );

    case "researchTagsAndTitles":
      return service.researchTagsAndTitles(
        {
          seedTopic: readString(args, "seedTopic"),
          regionCode: optionalString(args, "regionCode"),
          language: optionalString(args, "language"),
          maxExamples: optionalNumber(args, "maxExamples"),
        },
        { dryRun },
      );

    case "compareShortsVsLong":
      return service.compareShortsVsLong(
        {
          channelIdOrHandleOrUrl: readString(args, "channelIdOrHandleOrUrl"),
          lookbackDays: optionalNumber(args, "lookbackDays"),
        },
        { dryRun },
      );

    case "recommendUploadWindows":
      return service.recommendUploadWindows(
        {
          channelIdOrHandleOrUrl: readString(args, "channelIdOrHandleOrUrl"),
          timezone: readString(args, "timezone"),
          lookbackDays: optionalNumber(args, "lookbackDays"),
        },
        { dryRun },
      );

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

function parseArgs(input: CallToolRequest["params"]["arguments"]): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  return input as Record<string, unknown>;
}

function readString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Argument '${key}' must be a non-empty string`);
  }
  return value;
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`Argument '${key}' must be a string`);
  return value;
}

function optionalNumber(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || Number.isNaN(value)) throw new Error(`Argument '${key}' must be a number`);
  return value;
}

function readBoolean(args: Record<string, unknown>, key: string, defaultValue: boolean): boolean {
  const value = args[key];
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== "boolean") throw new Error(`Argument '${key}' must be a boolean`);
  return value;
}

function optionalBoolean(args: Record<string, unknown>, key: string): boolean | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") throw new Error(`Argument '${key}' must be a boolean`);
  return value;
}

function readStringArray(args: Record<string, unknown>, key: string): string[] {
  const value = args[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Argument '${key}' must be an array of strings`);
  }
  return value as string[];
}

function optionalEnum<T extends string>(args: Record<string, unknown>, key: string, values: T[]): T | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new Error(`Argument '${key}' must be one of: ${values.join(", ")}`);
  }
  return value as T;
}

function normalizeError(error: unknown): unknown {
  if (error instanceof Error && "detail" in error) {
    const detail = (error as Error & { detail?: unknown }).detail;
    if (detail) {
      return detail;
    }
  }

  return {
    code: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : String(error),
    retryable: false,
    attemptedTiers: [],
  };
}

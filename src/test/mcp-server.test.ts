import assert from "node:assert/strict";
import test from "node:test";
import { tools } from "../server/mcp-server.js";

test("public MCP surface uses intent-based tool names", () => {
  const toolNames = tools.map((tool) => tool.name);
  assert.deepEqual(toolNames, [
    "findVideos",
    "inspectVideo",
    "inspectChannel",
    "listChannelCatalog",
    "readTranscript",
    "readComments",
    "measureAudienceSentiment",
    "analyzeVideoSet",
    "expandPlaylist",
    "analyzePlaylist",
    "scoreHookPatterns",
    "researchTagsAndTitles",
    "compareShortsVsLong",
    "recommendUploadWindows",
  ]);
});

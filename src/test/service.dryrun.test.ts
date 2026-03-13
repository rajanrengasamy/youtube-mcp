import assert from "node:assert/strict";
import test from "node:test";
import { YouTubeService } from "../lib/youtube-service.js";

const service = new YouTubeService({ dryRun: true });
const sampleVideo = "dQw4w9WgXcQ";
const sampleChannel = "@GoogleDevelopers";
const samplePlaylist = "PL590L5WQmH8fJ54FNRU3kVZKeTxQqM2C4";

test("V1 and V2 tools return structured dry-run outputs", async () => {
  const [
    search,
    video,
    channel,
    catalog,
    transcript,
    comments,
    sentiment,
    videoSet,
    playlist,
    playlistAnalysis,
    hooks,
    titleResearch,
    formatCompare,
    uploadWindows,
  ] = await Promise.all([
    service.findVideos({ query: "youtube mcp", maxResults: 3 }),
    service.inspectVideo({ videoIdOrUrl: sampleVideo }),
    service.inspectChannel({ channelIdOrHandleOrUrl: sampleChannel }),
    service.listChannelCatalog({ channelIdOrHandleOrUrl: sampleChannel, maxResults: 3 }),
    service.readTranscript({ videoIdOrUrl: sampleVideo, mode: "key_moments" }),
    service.readComments({ videoIdOrUrl: sampleVideo, maxTopLevel: 3 }),
    service.measureAudienceSentiment({ videoIdOrUrl: sampleVideo, sampleSize: 3 }),
    service.analyzeVideoSet({ videoIdsOrUrls: [sampleVideo], analyses: ["video_info", "transcript", "hook_patterns"] }),
    service.expandPlaylist({ playlistUrlOrId: samplePlaylist, maxVideos: 3 }),
    service.analyzePlaylist({ playlistUrlOrId: samplePlaylist, analyses: ["video_info", "hook_patterns"], maxVideos: 3 }),
    service.scoreHookPatterns({ videoIdsOrUrls: [sampleVideo] }),
    service.researchTagsAndTitles({ seedTopic: "youtube hooks", maxExamples: 5 }),
    service.compareShortsVsLong({ channelIdOrHandleOrUrl: sampleChannel }),
    service.recommendUploadWindows({ channelIdOrHandleOrUrl: sampleChannel, timezone: "Australia/Sydney" }),
  ]);

  assert.equal(search.provenance.sourceTier, "none");
  assert.equal(video.video.videoId, sampleVideo);
  assert.equal(channel.channel.title, "Dry-run channel");
  assert.equal(catalog.items.length > 0, true);
  assert.equal(transcript.transcript.mode, "key_moments");
  assert.equal(comments.threads.length, 3);
  assert.equal(typeof sentiment.sentiment.sentimentScore, "number");
  assert.equal(videoSet.processedCount, 1);
  assert.equal(playlist.playlist.playlistId, samplePlaylist);
  assert.equal(playlistAnalysis.run.processed > 0, true);
  assert.equal(hooks.videos[0]?.hookType !== undefined, true);
  assert.equal(titleResearch.examples.length > 0, true);
  assert.equal(formatCompare.recommendation.rationale.length > 0, true);
  assert.equal(uploadWindows.recommendedSlots.length > 0, true);
});

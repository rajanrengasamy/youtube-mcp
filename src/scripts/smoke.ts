import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { YouTubeService } from "../lib/youtube-service.js";

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const dataDir = dryRun ? mkdtempSync(join(tmpdir(), "vidlens-mcp-smoke-")) : process.env.VIDLENS_DATA_DIR;
  const service = new YouTubeService({ dryRun, dataDir });

  const sampleVideo = "dQw4w9WgXcQ";
  const sampleChannel = "@GoogleDevelopers";
  const samplePlaylist = "PL590L5WQmH8fJ54FNRU3kVZKeTxQqM2C4";

  const checks: Array<{ name: string; run: () => Promise<unknown> }> = [
    {
      name: "findVideos",
      run: () => service.findVideos({ query: "youtube mcp strategy", maxResults: 3 }, { dryRun }),
    },
    {
      name: "inspectVideo",
      run: () => service.inspectVideo({ videoIdOrUrl: sampleVideo }, { dryRun }),
    },
    {
      name: "inspectChannel",
      run: () => service.inspectChannel({ channelIdOrHandleOrUrl: sampleChannel }, { dryRun }),
    },
    {
      name: "listChannelCatalog",
      run: () => service.listChannelCatalog({ channelIdOrHandleOrUrl: sampleChannel, maxResults: 3 }, { dryRun }),
    },
    {
      name: "readTranscript",
      run: () => service.readTranscript({ videoIdOrUrl: sampleVideo, mode: "key_moments" }, { dryRun }),
    },
    {
      name: "readComments",
      run: () => service.readComments({ videoIdOrUrl: sampleVideo, maxTopLevel: 3 }, { dryRun }),
    },
    {
      name: "measureAudienceSentiment",
      run: () => service.measureAudienceSentiment({ videoIdOrUrl: sampleVideo, sampleSize: 3 }, { dryRun }),
    },
    {
      name: "analyzeVideoSet",
      run: () =>
        service.analyzeVideoSet(
          {
            videoIdsOrUrls: [sampleVideo],
            analyses: ["video_info", "transcript", "sentiment", "hook_patterns"],
          },
          { dryRun },
        ),
    },
    {
      name: "expandPlaylist",
      run: () => service.expandPlaylist({ playlistUrlOrId: samplePlaylist, maxVideos: 3 }, { dryRun }),
    },
    {
      name: "analyzePlaylist",
      run: () =>
        service.analyzePlaylist(
          {
            playlistUrlOrId: samplePlaylist,
            analyses: ["video_info", "hook_patterns"],
            maxVideos: 3,
          },
          { dryRun },
        ),
    },
    {
      name: "importPlaylist",
      run: () =>
        service.importPlaylist(
          {
            playlistUrlOrId: samplePlaylist,
            maxVideos: 2,
            label: "Smoke Playlist",
          },
          { dryRun },
        ),
    },
    {
      name: "importVideos",
      run: () =>
        service.importVideos(
          {
            videoIdsOrUrls: [sampleVideo],
            label: "Smoke Videos",
          },
          { dryRun },
        ),
    },
    {
      name: "setActiveCollection",
      run: () => service.setActiveCollection({ collectionId: `playlist-${samplePlaylist}` }),
    },
    {
      name: "searchTranscripts",
      run: () => service.searchTranscripts({ query: "title patterns checklist", maxResults: 3 }),
    },
    {
      name: "listCollections",
      run: () => service.listCollections({ includeVideoList: true }),
    },
    {
      name: "clearActiveCollection",
      run: () => service.clearActiveCollection(),
    },
    {
      name: "checkImportReadiness",
      run: () => service.checkImportReadiness({ videoIdOrUrl: sampleVideo }, { dryRun }),
    },
    {
      name: "buildVideoDossier",
      run: () => service.buildVideoDossier({ videoIdOrUrl: sampleVideo, commentSampleSize: 3 }, { dryRun }),
    },
    {
      name: "checkSystemHealth",
      run: () => service.checkSystemHealth({}, { dryRun }),
    },
    {
      name: "removeCollection",
      run: () => service.removeCollection({ collectionId: `playlist-${samplePlaylist}` }),
    },
    {
      name: "scoreHookPatterns",
      run: () => service.scoreHookPatterns({ videoIdsOrUrls: [sampleVideo] }, { dryRun }),
    },
    {
      name: "researchTagsAndTitles",
      run: () => service.researchTagsAndTitles({ seedTopic: "youtube hooks", maxExamples: 5 }, { dryRun }),
    },
    {
      name: "compareShortsVsLong",
      run: () => service.compareShortsVsLong({ channelIdOrHandleOrUrl: sampleChannel }, { dryRun }),
    },
    {
      name: "recommendUploadWindows",
      run: () =>
        service.recommendUploadWindows(
          { channelIdOrHandleOrUrl: sampleChannel, timezone: "Australia/Sydney" },
          { dryRun },
        ),
    },
    {
      name: "discoverNicheTrends",
      run: () => service.discoverNicheTrends({ niche: "AI coding tools", maxResults: 8 }, { dryRun }),
    },
    {
      name: "exploreNicheCompetitors",
      run: () => service.exploreNicheCompetitors({ niche: "AI coding tools", maxChannels: 5 }, { dryRun }),
    },
    {
      name: "importComments",
      run: () => service.importComments({ videoIdOrUrl: sampleVideo, maxTopLevel: 5, label: "Smoke Comments" }, { dryRun }),
    },
    {
      name: "setActiveCommentCollection",
      run: () => service.setActiveCommentCollection({ collectionId: `comments-${sampleVideo}` }),
    },
    {
      name: "searchComments",
      run: () => service.searchComments({ query: "helpful explanation", maxResults: 3 }),
    },
    {
      name: "listCommentCollections",
      run: () => service.listCommentCollections({ includeVideoList: true }),
    },
    {
      name: "clearActiveCommentCollection",
      run: () => service.clearActiveCommentCollection(),
    },
    {
      name: "removeCommentCollection",
      run: () => service.removeCommentCollection({ collectionId: `comments-${sampleVideo}` }),
    },
    {
      name: "mediaStoreHealth",
      run: () => service.mediaStoreHealth(),
    },
    {
      name: "listMediaAssets",
      run: () => service.listMediaAssets({ limit: 5 }),
    },
    {
      name: "downloadAsset",
      run: () => service.downloadAsset({ videoIdOrUrl: sampleVideo, format: "thumbnail" }, { dryRun }),
    },
    {
      name: "extractKeyframes",
      run: () => service.extractKeyframes({ videoIdOrUrl: sampleVideo, intervalSec: 30, maxFrames: 3 }, { dryRun }),
    },
  ];

  for (const check of checks) {
    const output = await check.run();
    process.stdout.write(`\n=== ${check.name} ===\n`);
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  }

  process.stdout.write("\nSmoke run complete.\n");
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Smoke script failed: ${message}\n`);
  process.exitCode = 1;
});

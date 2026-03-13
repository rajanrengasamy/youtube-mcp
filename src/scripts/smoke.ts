import { YouTubeService } from "../lib/youtube-service.js";

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const service = new YouTubeService({ dryRun });

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

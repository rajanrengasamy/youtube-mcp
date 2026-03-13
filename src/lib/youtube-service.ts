import {
  average,
  buildChapterTranscriptSegments,
  buildTranscriptSegmentsForWindow,
  computeCommentRate,
  computeEngagementRate,
  computeLikeRate,
  computeViewVelocity24h,
  extractRecurringKeywords,
  inferVideoFormat,
  median,
  parseDescriptionChapters,
  percentile,
  scoreHookPattern,
  summarizeText,
  titleStructure,
  analyzeComments,
} from "./analysis.js";
import {
  parseChannelRef,
  parsePlaylistId,
  parseVideoId,
  type ChannelRef,
} from "./id-parsing.js";
import { PageExtractClient } from "./page-extract-client.js";
import type {
  AnalyzePlaylistInput,
  AnalyzePlaylistOutput,
  AnalyzeVideoSetInput,
  AnalyzeVideoSetItem,
  AnalyzeVideoSetOutput,
  ChannelRecord,
  CommentRecord,
  CompareShortsVsLongInput,
  CompareShortsVsLongOutput,
  ExpandPlaylistInput,
  ExpandPlaylistOutput,
  FindVideosInput,
  FindVideosOutput,
  GracefulError,
  InspectChannelInput,
  InspectChannelOutput,
  InspectVideoInput,
  InspectVideoOutput,
  ListChannelCatalogInput,
  ListChannelCatalogOutput,
  MeasureAudienceSentimentInput,
  MeasureAudienceSentimentOutput,
  Pagination,
  Provenance,
  ReadCommentsInput,
  ReadCommentsOutput,
  ReadTranscriptInput,
  ReadTranscriptOutput,
  RecommendUploadWindowsInput,
  RecommendUploadWindowsOutput,
  ResearchTagsAndTitlesInput,
  ResearchTagsAndTitlesOutput,
  ScoreHookPatternsInput,
  ScoreHookPatternsOutput,
  ServiceOptions,
  SourceTier,
  TranscriptRecord,
  VideoAnalysisMode,
  VideoRecord,
} from "./types.js";
import { YouTubeApiClient } from "./youtube-api-client.js";
import { YtDlpClient } from "./ytdlp-client.js";

interface YouTubeServiceConfig {
  apiKey?: string;
  dryRun?: boolean;
  ytDlpBinary?: string;
}

class ToolExecutionError extends Error {
  constructor(readonly detail: GracefulError) {
    super(detail.message);
    this.name = "ToolExecutionError";
  }
}

const FALLBACK_DEPTH: Record<SourceTier, 0 | 1 | 2 | 3> = {
  youtube_api: 0,
  yt_dlp: 1,
  page_extract: 2,
  none: 3,
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export class YouTubeService {
  private readonly api: YouTubeApiClient;
  private readonly ytdlp: YtDlpClient;
  private readonly pageExtract: PageExtractClient;
  private readonly dryRun: boolean;

  constructor(config: YouTubeServiceConfig = {}) {
    this.api = new YouTubeApiClient({ apiKey: config.apiKey ?? process.env.YOUTUBE_API_KEY });
    this.ytdlp = new YtDlpClient(config.ytDlpBinary);
    this.pageExtract = new PageExtractClient();
    this.dryRun = Boolean(config.dryRun);
  }

  async findVideos(input: FindVideosInput, options: ServiceOptions = {}): Promise<FindVideosOutput> {
    const query = input.query?.trim();
    if (!query) {
      throw this.invalidInput("Query cannot be empty");
    }

    const maxResults = clamp(input.maxResults ?? 10, 1, 25);
    const resolved = await this.executeFallback(
      {
        youtube_api: () =>
          this.api.searchVideos(query, {
            maxResults,
            order: input.order,
            regionCode: input.regionCode,
            publishedAfter: input.publishedAfter,
            publishedBefore: input.publishedBefore,
            channelId: input.channelId,
            duration: input.duration,
          }),
        yt_dlp: () => this.ytdlp.search(query, maxResults),
      },
      this.sampleSearch(query, maxResults),
      options,
    );

    return {
      query,
      results: resolved.data.map((item) => ({
        videoId: item.videoId,
        title: item.title,
        channelId: item.channelId,
        channelTitle: item.channelTitle,
        publishedAt: item.publishedAt,
        durationSec: item.durationSec,
        views: item.views,
        engagementRate: computeEngagementRate(item),
      })),
      provenance: resolved.provenance,
    };
  }

  async inspectVideo(input: InspectVideoInput, options: ServiceOptions = {}): Promise<InspectVideoOutput> {
    const videoId = this.requireVideoId(input.videoIdOrUrl);
    const includeTranscriptMeta = input.includeTranscriptMeta ?? true;
    const includeEngagementRatios = input.includeEngagementRatios ?? true;

    const resolved = await this.executeFallback(
      {
        youtube_api: () => this.api.getVideoInfo(videoId),
        yt_dlp: () => this.ytdlp.videoInfo(videoId),
        page_extract: () => this.pageExtract.getVideoInfo(videoId),
      },
      this.sampleVideo(videoId),
      options,
      { partialTiers: ["page_extract"] },
    );

    const video = resolved.data;

    return {
      video: {
        videoId: video.videoId,
        title: video.title,
        channelId: video.channelId,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt,
        durationSec: video.durationSec,
        category: video.category,
        tags: video.tags?.slice(0, 12),
        language: video.language,
      },
      stats: {
        views: video.views,
        likes: video.likes,
        comments: video.comments,
        likeRate: includeEngagementRatios ? computeLikeRate(video) : undefined,
        commentRate: includeEngagementRatios ? computeCommentRate(video) : undefined,
        viewVelocity24h: includeEngagementRatios ? computeViewVelocity24h(video.views, video.publishedAt) : undefined,
      },
      transcriptMeta: includeTranscriptMeta
        ? {
            available: Boolean(video.transcriptAvailable),
            languages: video.transcriptLanguages?.slice(0, 6),
          }
        : undefined,
      provenance: resolved.provenance,
    };
  }

  async inspectChannel(input: InspectChannelInput, options: ServiceOptions = {}): Promise<InspectChannelOutput> {
    const channelRef = this.requireChannelRef(input.channelIdOrHandleOrUrl);
    const resolved = await this.executeFallback(
      {
        youtube_api: () => this.api.getChannel(channelRef),
        yt_dlp: () => this.ytdlp.channel(channelRef),
        page_extract: () => this.pageExtract.getChannelInfo(channelRef),
      },
      this.sampleChannel(channelRef),
      options,
      { partialTiers: ["page_extract"] },
    );

    const cadence = await this.bestEffortChannelCadence(channelRef, options);
    const channel = resolved.data;
    const avgViewsPerVideo = channel.totalViews && channel.totalVideos
      ? Math.round(channel.totalViews / Math.max(channel.totalVideos, 1))
      : undefined;

    const provenance = this.mergeProvenances([
      resolved.provenance,
      cadence.provenance,
    ]);

    return {
      channel: {
        channelId: channel.channelId,
        title: channel.title,
        handle: channel.handle,
        createdAt: channel.createdAt,
        country: channel.country,
        descriptionSummary: channel.descriptionSummary ?? summarizeText(channel.description ?? "", 2),
      },
      stats: {
        subscribers: channel.subscribers,
        totalViews: channel.totalViews,
        totalVideos: channel.totalVideos,
        avgViewsPerVideo,
      },
      cadence: cadence.data,
      provenance,
    };
  }

  async listChannelCatalog(input: ListChannelCatalogInput, options: ServiceOptions = {}): Promise<ListChannelCatalogOutput> {
    const channelRef = this.requireChannelRef(input.channelIdOrHandleOrUrl);
    const maxResults = clamp(input.maxResults ?? 25, 1, 100);

    const channel = await this.resolveChannel(channelRef, options);
    const videos = await this.executeFallback(
      {
        youtube_api: () => this.api.listChannelVideos(channelRef, maxResults),
        yt_dlp: () => this.ytdlp.channelVideos(channelRef, maxResults),
      },
      this.sampleChannelVideos(channel.data.channelId),
      options,
      { partialTiers: ["yt_dlp"] },
    );

    const filtered = this.filterAndSortCatalog(videos.data, {
      sortBy: input.sortBy,
      includeShorts: input.includeShorts ?? true,
      includeLongForm: input.includeLongForm ?? true,
      publishedWithinDays: input.publishedWithinDays,
    });

    return {
      channelId: channel.data.channelId,
      items: filtered.slice(0, maxResults).map((video) => ({
        videoId: video.videoId,
        title: video.title,
        publishedAt: video.publishedAt,
        durationSec: video.durationSec,
        format: inferVideoFormat(video.durationSec),
        views: video.views,
        likes: video.likes,
        comments: video.comments,
      })),
      provenance: this.mergeProvenances([channel.provenance, videos.provenance]),
    };
  }

  async readTranscript(input: ReadTranscriptInput, options: ServiceOptions = {}): Promise<ReadTranscriptOutput> {
    const videoId = this.requireVideoId(input.videoIdOrUrl);
    const requestedMode = input.mode ?? "key_moments";
    const includeTimestamps = input.includeTimestamps ?? true;
    const offset = Math.max(0, input.offset ?? 0);
    const limit = clamp(input.limit ?? 32000, 1000, 64000);
    const chunkWindowSec = clamp(input.chunkWindowSec ?? 120, 30, 900);

    const resolved = await this.executeFallback(
      {
        yt_dlp: () => this.ytdlp.transcript(videoId, input.language),
      },
      this.sampleTranscript(videoId),
      options,
      { partialTiers: [] },
    );

    const transcript = resolved.data;
    const totalCharacters = transcript.transcriptText.length;
    const totalEstimatedTokens = Math.ceil(totalCharacters / 4);
    let mode: ReadTranscriptOutput["transcript"]["mode"] = requestedMode;
    let autoDowngraded = false;
    if (requestedMode === "full" && totalCharacters > 32000 && input.offset === undefined && input.limit === undefined) {
      mode = "key_moments";
      autoDowngraded = true;
    }

    let text: string | undefined;
    let segments: ReadTranscriptOutput["transcript"]["segments"] | undefined;

    if (mode === "full") {
      const chunk = transcript.transcriptText.slice(offset, offset + limit);
      text = chunk;
    } else if (mode === "summary") {
      text = summarizeText(transcript.transcriptText, 4);
      segments = includeTimestamps
        ? buildTranscriptSegmentsForWindow(transcript, chunkWindowSec, 4).map((segment) => ({
            tStartSec: segment.tStartSec,
            tEndSec: segment.tEndSec,
            text: summarizeText(segment.text, 1),
            topicLabel: segment.topicLabel,
          }))
        : undefined;
    } else if (mode === "chapters") {
      segments = buildChapterTranscriptSegments(transcript).map((segment) => ({
        tStartSec: segment.tStartSec,
        tEndSec: segment.tEndSec,
        text: summarizeText(segment.text, 2),
        chapterTitle: segment.chapterTitle,
        topicLabel: segment.topicLabel,
      }));
    } else {
      segments = buildTranscriptSegmentsForWindow(transcript, chunkWindowSec, 6).map((segment) => ({
        tStartSec: segment.tStartSec,
        tEndSec: segment.tEndSec,
        text: summarizeText(segment.text, 2),
        topicLabel: segment.topicLabel,
      }));
    }

    if (!includeTimestamps && segments) {
      segments = segments.map((segment) => ({
        ...segment,
        tStartSec: 0,
        tEndSec: undefined,
      }));
    }

    const pagination =
      mode === "full"
        ? {
            offset,
            limit,
            hasMore: offset + limit < totalCharacters,
            nextOffset: offset + limit < totalCharacters ? offset + limit : undefined,
          }
        : undefined;

    return {
      videoId,
      languageUsed: transcript.languageUsed,
      transcript: {
        mode,
        text,
        segments,
      },
      longVideoHandling: {
        totalCharacters,
        totalEstimatedTokens,
        autoDowngraded,
        originalMode: autoDowngraded ? requestedMode : undefined,
        pagination,
      },
      chapters: (transcript.chapters ?? parseDescriptionChapters(undefined)).slice(0, 20),
      quality: {
        sourceType: transcript.sourceType,
        confidence: transcript.confidence,
      },
      provenance: resolved.provenance,
    };
  }

  async readComments(input: ReadCommentsInput, options: ServiceOptions = {}): Promise<ReadCommentsOutput> {
    const videoId = this.requireVideoId(input.videoIdOrUrl);
    const maxTopLevel = clamp(input.maxTopLevel ?? 50, 1, 200);
    const includeReplies = input.includeReplies ?? false;
    const maxRepliesPerThread = clamp(input.maxRepliesPerThread ?? 3, 0, 20);

    const resolved = await this.executeFallback(
      {
        youtube_api: () =>
          this.api.getVideoComments(videoId, maxTopLevel, input.order ?? "relevance", includeReplies, maxRepliesPerThread),
        yt_dlp: () => this.ytdlp.comments(videoId, maxTopLevel),
      },
      this.sampleComments(videoId),
      options,
      { partialTiers: includeReplies ? ["yt_dlp"] : [] },
    );

    return {
      videoId,
      totalFetched: resolved.data.length,
      threads: resolved.data.map((thread) => ({
        commentId: thread.commentId,
        author: thread.author,
        text: thread.text,
        likeCount: thread.likeCount,
        publishedAt: thread.publishedAt,
        replies: includeReplies
          ? (thread.replies ?? []).slice(0, maxRepliesPerThread).map((reply) => ({
              commentId: reply.commentId,
              author: reply.author,
              text: reply.text,
              likeCount: reply.likeCount,
              publishedAt: reply.publishedAt,
            }))
          : undefined,
      })),
      provenance: resolved.provenance,
    };
  }

  async measureAudienceSentiment(
    input: MeasureAudienceSentimentInput,
    options: ServiceOptions = {},
  ): Promise<MeasureAudienceSentimentOutput> {
    const comments = await this.readComments(
      {
        videoIdOrUrl: input.videoIdOrUrl,
        maxTopLevel: input.sampleSize ?? 200,
        includeReplies: false,
      },
      options,
    );

    const analysis = analyzeComments(
      comments.threads.map((thread) => ({
        commentId: thread.commentId,
        author: thread.author,
        text: thread.text,
        likeCount: thread.likeCount,
        publishedAt: thread.publishedAt,
      })),
      input.includeThemes ?? true,
      input.includeRepresentativeQuotes ?? true,
    );

    return {
      videoId: comments.videoId,
      sampleSize: comments.totalFetched,
      sentiment: analysis.sentiment,
      themes: analysis.themes,
      riskSignals: analysis.riskSignals,
      representativeQuotes: analysis.representativeQuotes,
      provenance: comments.provenance,
    };
  }

  async analyzeVideoSet(input: AnalyzeVideoSetInput, options: ServiceOptions = {}): Promise<AnalyzeVideoSetOutput> {
    if (!Array.isArray(input.videoIdsOrUrls) || input.videoIdsOrUrls.length === 0) {
      throw this.invalidInput("videoIdsOrUrls must contain at least one video");
    }
    if (!Array.isArray(input.analyses) || input.analyses.length === 0) {
      throw this.invalidInput("analyses must contain at least one analysis mode");
    }

    const items: AnalyzeVideoSetItem[] = [];

    for (const raw of input.videoIdsOrUrls.slice(0, 20)) {
      const parsed = parseVideoId(raw);
      if (!parsed) {
        items.push({
          videoId: raw,
          analyses: {},
          errors: [this.invalidInputDetail(`Invalid YouTube video reference: ${raw}`)],
          provenance: this.makeProvenance("none", true, ["Input could not be parsed as a YouTube video ID or URL."]),
        });
        continue;
      }

      const item = await this.analyzeSingleVideo(parsed, input.analyses, {
        commentsSampleSize: input.commentsSampleSize ?? 50,
        transcriptMode: input.transcriptMode ?? "key_moments",
      }, options);
      items.push(item);
    }

    const processedCount = items.filter((item) => Object.keys(item.analyses).length > 0).length;
    const failedCount = items.length - processedCount;
    const fallbackDepths = items.map((item) => item.provenance.fallbackDepth);

    return {
      requestedCount: input.videoIdsOrUrls.length,
      processedCount,
      failedCount,
      items,
      summary: {
        successRatePct: round((processedCount / Math.max(items.length, 1)) * 100, 1),
        avgFallbackDepth: round(average(fallbackDepths) ?? 0, 2),
      },
    };
  }

  async expandPlaylist(input: ExpandPlaylistInput, options: ServiceOptions = {}): Promise<ExpandPlaylistOutput> {
    const playlistId = this.requirePlaylistId(input.playlistUrlOrId);
    const maxVideos = clamp(input.maxVideos ?? 50, 1, 200);
    const includeVideoMeta = input.includeVideoMeta ?? false;

    const resolved = await this.executeFallback(
      {
        youtube_api: async () => {
          const [meta, videos] = await Promise.all([
            this.api.getPlaylistMeta(playlistId),
            this.api.getPlaylistVideos(playlistId, Math.min(maxVideos, 50)),
          ]);
          return {
            playlistId: meta.playlistId,
            title: meta.title,
            channelTitle: meta.channelTitle,
            videoCountReported: meta.videoCountReported,
            videos,
          };
        },
        yt_dlp: () => this.ytdlp.playlist(playlistId, maxVideos),
      },
      this.samplePlaylist(playlistId),
      options,
      { partialTiers: ["yt_dlp"] },
    );

    return {
      playlist: {
        playlistId,
        title: resolved.data.title,
        channelTitle: resolved.data.channelTitle,
        videoCountReported: resolved.data.videoCountReported,
      },
      videos: resolved.data.videos.slice(0, maxVideos).map((video) => ({
        videoId: video.videoId,
        title: includeVideoMeta ? video.title : video.title,
        publishedAt: includeVideoMeta ? video.publishedAt : video.publishedAt,
        channelTitle: includeVideoMeta ? video.channelTitle : video.channelTitle,
      })),
      truncated: (resolved.data.videoCountReported ?? resolved.data.videos.length) > maxVideos,
      provenance: resolved.provenance,
    };
  }

  async analyzePlaylist(input: AnalyzePlaylistInput, options: ServiceOptions = {}): Promise<AnalyzePlaylistOutput> {
    const maxVideos = clamp(input.maxVideos ?? 25, 1, 100);
    const expanded = await this.expandPlaylist(
      {
        playlistUrlOrId: input.playlistUrlOrId,
        maxVideos,
        includeVideoMeta: true,
      },
      options,
    );

    const analysis = await this.analyzeVideoSet(
      {
        videoIdsOrUrls: expanded.videos.map((video) => video.videoId),
        analyses: input.analyses,
        commentsSampleSize: input.commentsSampleSize,
        transcriptMode: input.transcriptMode,
      },
      options,
    );

    const sentimentScores = analysis.items
      .map((item) => item.analyses.sentiment?.sentiment.sentimentScore)
      .filter((value): value is number => value !== undefined);
    const hookScores = analysis.items
      .map((item) => item.analyses.hookPatterns?.hookScore)
      .filter((value): value is number => value !== undefined);
    const allThemes = analysis.items.flatMap((item) => item.analyses.sentiment?.themes?.map((theme) => theme.theme) ?? []);
    const viewValues = analysis.items
      .map((item) => item.analyses.videoInfo?.stats.views)
      .filter((value): value is number => value !== undefined);

    return {
      playlist: expanded.playlist,
      run: {
        maxVideos,
        processed: analysis.processedCount,
        failed: analysis.failedCount,
      },
      items: analysis.items,
      aggregate: {
        medianViews: median(viewValues),
        avgSentimentScore: average(sentimentScores),
        dominantThemes: topStrings(allThemes, 5),
        hookBenchmark: {
          medianHookScore: median(hookScores),
          topQuartileHookScore: percentile(hookScores, 0.75),
        },
      },
      provenance: this.mergeProvenances([expanded.provenance, ...analysis.items.map((item) => item.provenance)]),
    };
  }

  async scoreHookPatterns(input: ScoreHookPatternsInput, options: ServiceOptions = {}): Promise<ScoreHookPatternsOutput> {
    if (!Array.isArray(input.videoIdsOrUrls) || input.videoIdsOrUrls.length === 0) {
      throw this.invalidInput("videoIdsOrUrls must contain at least one video");
    }
    const hookWindowSec = clamp(input.hookWindowSec ?? 30, 10, 120);
    const videos: ScoreHookPatternsOutput["videos"] = [];
    const provenances: Provenance[] = [];
    const failureNotes: string[] = [];

    for (const raw of input.videoIdsOrUrls.slice(0, 20)) {
      const videoId = parseVideoId(raw);
      if (!videoId) {
        failureNotes.push(`Skipped invalid video reference: ${raw}`);
        continue;
      }
      try {
        const transcript = await this.readTranscript(
          {
            videoIdOrUrl: videoId,
            mode: "full",
            limit: 12000,
          },
          options,
        );
        const transcriptRecord: TranscriptRecord = {
          videoId,
          languageUsed: transcript.languageUsed,
          sourceType: transcript.quality.sourceType,
          confidence: transcript.quality.confidence,
          transcriptText: transcript.transcript.text ?? transcript.transcript.segments?.map((segment) => segment.text).join(" ") ?? "",
          segments: transcript.transcript.segments?.map((segment) => ({
            tStartSec: segment.tStartSec,
            tEndSec: segment.tEndSec,
            text: segment.text,
          })) ?? [],
          chapters: transcript.chapters,
        };
        const hook = scoreHookPattern(videoId, transcriptRecord, hookWindowSec);
        videos.push({
          videoId,
          hookScore: hook.hookScore,
          hookType: hook.hookType,
          first30SecSummary: hook.first30SecSummary,
          weakSignals: hook.weakSignals,
          improvements: hook.improvements,
        });
        provenances.push(transcript.provenance);
      } catch (error) {
        failureNotes.push(`${videoId}: ${toMessage(error)}`);
      }
    }

    if (videos.length === 0) {
      throw new ToolExecutionError({
        code: "UPSTREAM_UNAVAILABLE",
        message: "Could not score hooks for any of the requested videos.",
        retryable: true,
        attemptedTiers: ["yt_dlp"],
        suggestion: "Ensure subtitles are available for the selected videos or try videos with public captions.",
      });
    }

    const scores = videos.map((video) => video.hookScore);
    const provenance = this.mergeProvenances(provenances);
    if (failureNotes.length > 0) {
      provenance.partial = true;
      provenance.sourceNotes = [...(provenance.sourceNotes ?? []), ...failureNotes];
    }

    return {
      videos,
      benchmark: {
        medianHookScore: median(scores) ?? 0,
        topQuartileHookScore: percentile(scores, 0.75) ?? 0,
      },
      provenance,
    };
  }

  async researchTagsAndTitles(
    input: ResearchTagsAndTitlesInput,
    options: ServiceOptions = {},
  ): Promise<ResearchTagsAndTitlesOutput> {
    const seedTopic = input.seedTopic?.trim();
    if (!seedTopic) {
      throw this.invalidInput("seedTopic cannot be empty");
    }

    const maxExamples = clamp(input.maxExamples ?? 20, 3, 20);
    const search = await this.findVideos(
      {
        query: seedTopic,
        maxResults: maxExamples,
        regionCode: input.regionCode,
      },
      options,
    );

    const rawExamples = await Promise.all(
      search.results.slice(0, Math.min(search.results.length, 10)).map(async (result) => {
        try {
          return await this.inspectVideo({ videoIdOrUrl: result.videoId }, options);
        } catch {
          return undefined;
        }
      }),
    );

    const videos: VideoRecord[] = rawExamples
      .filter((item): item is InspectVideoOutput => Boolean(item))
      .map((item) => ({
        videoId: item.video.videoId,
        title: item.video.title,
        channelId: item.video.channelId,
        channelTitle: item.video.channelTitle,
        publishedAt: item.video.publishedAt,
        durationSec: item.video.durationSec,
        views: item.stats.views,
        likes: item.stats.likes,
        comments: item.stats.comments,
        tags: item.video.tags,
        language: item.video.language,
        category: item.video.category,
        url: "",
      }));

    const recurringKeywords = extractRecurringKeywords(videos.length > 0 ? videos : search.results.map((result) => ({
      videoId: result.videoId,
      title: result.title,
      channelTitle: result.channelTitle,
      url: "",
      tags: [],
    } as VideoRecord)));
    const titleStructures = topStrings((videos.length > 0 ? videos : search.results.map((result) => ({ title: result.title } as Pick<VideoRecord, "title">))).map((video) => titleStructure(video.title)), 6);

    const sortedByViews = [...videos].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    const topHalf = sortedByViews.slice(0, Math.max(1, Math.ceil(sortedByViews.length / 2)));
    const bottomThird = sortedByViews.slice(Math.floor(sortedByViews.length * 0.66));

    return {
      seedTopic,
      winningPatterns: {
        titleStructures,
        recurringKeywords,
        highSignalTags: extractRecurringKeywords(topHalf, 10),
        lowSignalTags: extractRecurringKeywords(bottomThird, 10).filter((tag) => !extractRecurringKeywords(topHalf, 10).includes(tag)),
      },
      examples: (videos.length > 0 ? videos : search.results.map((result) => ({
        videoId: result.videoId,
        title: result.title,
        tags: undefined,
        views: result.views,
        engagementRate: result.engagementRate,
      }))).slice(0, maxExamples).map((video) => ({
        videoId: video.videoId,
        title: video.title,
        tags: video.tags,
        views: video.views,
        engagementRate: computeEngagementRate(video),
      })),
      provenance: search.provenance,
    };
  }

  async compareShortsVsLong(
    input: CompareShortsVsLongInput,
    options: ServiceOptions = {},
  ): Promise<CompareShortsVsLongOutput> {
    const catalog = await this.listChannelCatalog(
      {
        channelIdOrHandleOrUrl: input.channelIdOrHandleOrUrl,
        maxResults: 50,
        publishedWithinDays: input.lookbackDays ?? 180,
      },
      options,
    );

    const shorts = catalog.items.filter((item) => item.format === "short");
    const longForm = catalog.items.filter((item) => item.format === "long");

    const shortEngagements = shorts.map((item) => rate(item.likes, item.comments, item.views)).filter(isNumber);
    const longEngagements = longForm.map((item) => rate(item.likes, item.comments, item.views)).filter(isNumber);
    const shortCommentRates = shorts.map((item) => rate(item.comments, undefined, item.views)).filter(isNumber);
    const longCommentRates = longForm.map((item) => rate(item.comments, undefined, item.views)).filter(isNumber);

    const shortsBetter = (median(shortEngagements) ?? 0) >= (median(longEngagements) ?? 0);
    return {
      channelId: catalog.channelId,
      shorts: {
        count: shorts.length,
        medianViews: median(shorts.map((item) => item.views ?? 0)),
        medianEngagementRate: median(shortEngagements),
        medianCommentRate: median(shortCommentRates),
      },
      longForm: {
        count: longForm.length,
        medianViews: median(longForm.map((item) => item.views ?? 0)),
        medianEngagementRate: median(longEngagements),
        medianCommentRate: median(longCommentRates),
      },
      recommendation: {
        suggestedMixShortPct: shortsBetter ? 60 : 40,
        suggestedMixLongPct: shortsBetter ? 40 : 60,
        rationale: [
          shortsBetter
            ? "Shorts show stronger or comparable engagement efficiency in the sampled catalog."
            : "Long-form videos show stronger engagement efficiency in the sampled catalog.",
          shorts.length === 0 || longForm.length === 0
            ? "The catalog is format-skewed, so treat this recommendation as directional only."
            : "Recommendation uses recent catalog mix, not absolute channel strategy certainty.",
        ],
      },
      provenance: catalog.provenance,
    };
  }

  async recommendUploadWindows(
    input: RecommendUploadWindowsInput,
    options: ServiceOptions = {},
  ): Promise<RecommendUploadWindowsOutput> {
    const catalog = await this.listChannelCatalog(
      {
        channelIdOrHandleOrUrl: input.channelIdOrHandleOrUrl,
        maxResults: 60,
        publishedWithinDays: input.lookbackDays ?? 120,
      },
      options,
    );

    const slots = new Map<string, { weekday: RecommendUploadWindowsOutput["recommendedSlots"][number]["weekday"]; hourLocal: number; count: number; views: number[] }>();
    for (const item of catalog.items) {
      if (!item.publishedAt) {
        continue;
      }
      const date = new Date(item.publishedAt);
      if (Number.isNaN(date.getTime())) {
        continue;
      }
      const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: input.timezone }).format(date) as RecommendUploadWindowsOutput["recommendedSlots"][number]["weekday"];
      const hourLocal = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: input.timezone }).format(date));
      const key = `${weekday}-${hourLocal}`;
      const current = slots.get(key) ?? { weekday, hourLocal, count: 0, views: [] };
      current.count += 1;
      if (item.views) current.views.push(item.views);
      slots.set(key, current);
    }

    const ranked = Array.from(slots.values())
      .sort((a, b) => {
        const scoreA = a.count * 1000 + (median(a.views) ?? 0);
        const scoreB = b.count * 1000 + (median(b.views) ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, 3);

    const maxCount = Math.max(...ranked.map((slot) => slot.count), 1);
    const recommendedSlots = ranked.map((slot) => ({
      weekday: slot.weekday,
      hourLocal: slot.hourLocal,
      confidence: round(slot.count / maxCount, 2),
      rationale: `${slot.count} recent uploads landed in this slot with median views ${median(slot.views) ?? 0}.`,
    }));

    return {
      channelId: catalog.channelId,
      recommendedSlots,
      observedPatterns: {
        bestDay: ranked[0]?.weekday,
        bestHour: ranked[0]?.hourLocal,
        consistencyScore: round(((ranked[0]?.count ?? 0) / Math.max(catalog.items.length, 1)) * 100, 1),
      },
      provenance: catalog.provenance,
    };
  }

  private async analyzeSingleVideo(
    videoId: string,
    analyses: VideoAnalysisMode[],
    config: { commentsSampleSize: number; transcriptMode: "summary" | "key_moments" | "full" },
    options: ServiceOptions,
  ): Promise<AnalyzeVideoSetItem> {
    const item: AnalyzeVideoSetItem = {
      videoId,
      analyses: {},
      errors: [],
      provenance: this.makeProvenance("none", false),
    };
    const provenances: Provenance[] = [];

    let cachedVideoInfo: InspectVideoOutput | undefined;
    let cachedTranscript: ReadTranscriptOutput | undefined;
    let cachedComments: ReadCommentsOutput | undefined;

    for (const analysis of analyses) {
      try {
        if (analysis === "video_info") {
          cachedVideoInfo = cachedVideoInfo ?? (await this.inspectVideo({ videoIdOrUrl: videoId }, options));
          item.analyses.videoInfo = cachedVideoInfo;
          provenances.push(cachedVideoInfo.provenance);
        } else if (analysis === "transcript") {
          cachedTranscript = cachedTranscript ??
            (await this.readTranscript({ videoIdOrUrl: videoId, mode: config.transcriptMode }, options));
          item.analyses.transcript = cachedTranscript;
          provenances.push(cachedTranscript.provenance);
        } else if (analysis === "comments") {
          cachedComments = cachedComments ??
            (await this.readComments({ videoIdOrUrl: videoId, maxTopLevel: config.commentsSampleSize }, options));
          item.analyses.comments = cachedComments;
          provenances.push(cachedComments.provenance);
        } else if (analysis === "sentiment") {
          const sentiment = await this.measureAudienceSentiment(
            { videoIdOrUrl: videoId, sampleSize: config.commentsSampleSize },
            options,
          );
          item.analyses.sentiment = sentiment;
          provenances.push(sentiment.provenance);
        } else if (analysis === "hook_patterns") {
          cachedTranscript = cachedTranscript ??
            (await this.readTranscript({ videoIdOrUrl: videoId, mode: "full", limit: 12000 }, options));
          const transcriptRecord: TranscriptRecord = {
            videoId,
            languageUsed: cachedTranscript.languageUsed,
            sourceType: cachedTranscript.quality.sourceType,
            confidence: cachedTranscript.quality.confidence,
            transcriptText: cachedTranscript.transcript.text ?? cachedTranscript.transcript.segments?.map((segment) => segment.text).join(" ") ?? "",
            segments: cachedTranscript.transcript.segments?.map((segment) => ({
              tStartSec: segment.tStartSec,
              tEndSec: segment.tEndSec,
              text: segment.text,
            })) ?? [],
            chapters: cachedTranscript.chapters,
          };
          const hook = scoreHookPattern(videoId, transcriptRecord, 30);
          item.analyses.hookPatterns = {
            hookScore: hook.hookScore,
            hookType: hook.hookType,
            first30SecSummary: hook.first30SecSummary,
          };
          provenances.push(cachedTranscript.provenance);
        } else if (analysis === "tag_title_patterns") {
          cachedVideoInfo = cachedVideoInfo ?? (await this.inspectVideo({ videoIdOrUrl: videoId }, options));
          item.analyses.tagTitlePatterns = {
            recurringKeywords: extractRecurringKeywords([
              {
                videoId,
                title: cachedVideoInfo.video.title,
                channelId: cachedVideoInfo.video.channelId,
                channelTitle: cachedVideoInfo.video.channelTitle,
                publishedAt: cachedVideoInfo.video.publishedAt,
                durationSec: cachedVideoInfo.video.durationSec,
                views: cachedVideoInfo.stats.views,
                likes: cachedVideoInfo.stats.likes,
                comments: cachedVideoInfo.stats.comments,
                tags: cachedVideoInfo.video.tags,
                language: cachedVideoInfo.video.language,
                category: cachedVideoInfo.video.category,
                url: "",
              },
            ]),
            titleStructure: [titleStructure(cachedVideoInfo.video.title)],
          };
          provenances.push(cachedVideoInfo.provenance);
        }
      } catch (error) {
        item.errors?.push(this.normalizeError(error));
      }
    }

    item.errors = item.errors && item.errors.length > 0 ? item.errors : undefined;
    item.provenance = provenances.length > 0
      ? this.mergeProvenances(provenances, Boolean(item.errors?.length))
      : this.makeProvenance("none", true, ["No requested analyses completed successfully."]);
    return item;
  }

  private async resolveChannel(
    ref: ChannelRef,
    options: ServiceOptions,
  ): Promise<{ data: ChannelRecord; provenance: Provenance }> {
    return this.executeFallback(
      {
        youtube_api: () => this.api.getChannel(ref),
        yt_dlp: () => this.ytdlp.channel(ref),
        page_extract: () => this.pageExtract.getChannelInfo(ref),
      },
      this.sampleChannel(ref),
      options,
      { partialTiers: ["page_extract"] },
    );
  }

  private async bestEffortChannelCadence(
    ref: ChannelRef,
    options: ServiceOptions,
  ): Promise<{
    data: InspectChannelOutput["cadence"];
    provenance: Provenance;
  }> {
    try {
      const catalog = await this.executeFallback(
        {
          youtube_api: () => this.api.listChannelVideos(ref, 30),
          yt_dlp: () => this.ytdlp.channelVideos(ref, 30),
        },
        this.sampleChannelVideos("UC_x5XG1OV2P6uZZ5FSM9Ttw"),
        options,
        { partialTiers: ["yt_dlp"] },
      );

      const dates = catalog.data
        .map((video) => video.publishedAt)
        .filter((value): value is string => Boolean(value))
        .map((value) => new Date(value))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => b.getTime() - a.getTime());

      const now = Date.now();
      const uploadsLast30d = dates.filter((date) => now - date.getTime() <= 30 * 86_400_000).length;
      const uploadsLast90d = dates.filter((date) => now - date.getTime() <= 90 * 86_400_000).length;
      const intervals: number[] = [];
      for (let index = 0; index < dates.length - 1; index += 1) {
        intervals.push((dates[index].getTime() - dates[index + 1].getTime()) / 86_400_000);
      }

      return {
        data: {
          uploadsLast30d,
          uploadsLast90d,
          medianDaysBetweenUploads: median(intervals),
        },
        provenance: catalog.provenance,
      };
    } catch (error) {
      return {
        data: {},
        provenance: this.makeProvenance("none", true, [`Cadence unavailable: ${toMessage(error)}`]),
      };
    }
  }

  private filterAndSortCatalog(
    videos: VideoRecord[],
    options: {
      sortBy?: ListChannelCatalogInput["sortBy"];
      includeShorts: boolean;
      includeLongForm: boolean;
      publishedWithinDays?: number;
    },
  ): VideoRecord[] {
    let filtered = [...videos];
    if (options.publishedWithinDays) {
      const boundary = Date.now() - options.publishedWithinDays * 86_400_000;
      filtered = filtered.filter((video) => {
        if (!video.publishedAt) {
          return false;
        }
        const published = new Date(video.publishedAt).getTime();
        return !Number.isNaN(published) && published >= boundary;
      });
    }

    filtered = filtered.filter((video) => {
      const format = inferVideoFormat(video.durationSec);
      if (format === "short") {
        return options.includeShorts;
      }
      if (format === "long") {
        return options.includeLongForm;
      }
      return true;
    });

    const sortBy = options.sortBy ?? "date_desc";
    filtered.sort((a, b) => {
      if (sortBy === "views_desc") {
        return (b.views ?? 0) - (a.views ?? 0);
      }
      const left = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const right = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return sortBy === "date_asc" ? left - right : right - left;
    });

    return filtered;
  }

  private async executeFallback<T>(
    actions: Partial<Record<Exclude<SourceTier, "none">, () => Promise<T>>>,
    dryRunData: T,
    options: ServiceOptions,
    config: { partialTiers?: SourceTier[] } = {},
  ): Promise<{ data: T; provenance: Provenance }> {
    if (this.isDryRun(options)) {
      return {
        data: dryRunData,
        provenance: this.makeProvenance("none", false, ["Dry-run mode enabled. No external calls were made."]),
      };
    }

    const attempted: SourceTier[] = [];
    const notes: string[] = [];
    const orderedTiers: Exclude<SourceTier, "none">[] = ["youtube_api", "yt_dlp", "page_extract"];

    for (const tier of orderedTiers) {
      const action = actions[tier];
      if (!action) {
        continue;
      }
      if (tier === "youtube_api" && !this.api.isConfigured()) {
        notes.push("youtube_api skipped: YOUTUBE_API_KEY not configured.");
        continue;
      }

      attempted.push(tier);
      try {
        const data = await action();
        return {
          data,
          provenance: this.makeProvenance(tier, config.partialTiers?.includes(tier) ?? tier === "page_extract", notes),
        };
      } catch (error) {
        notes.push(`${tier} failed: ${toMessage(error)}`);
      }
    }

    throw new ToolExecutionError({
      code: "UPSTREAM_UNAVAILABLE",
      message: "All available source tiers failed for this request.",
      retryable: true,
      attemptedTiers: attempted,
      suggestion: "Try again later, provide an API key for higher fidelity, or choose a public video/channel with captions enabled.",
    });
  }

  private isDryRun(options: ServiceOptions): boolean {
    return this.dryRun || Boolean(options.dryRun);
  }

  private requireVideoId(input: string): string {
    const videoId = parseVideoId(input);
    if (!videoId) {
      throw this.invalidInput("Could not extract a valid YouTube video ID from input.");
    }
    return videoId;
  }

  private requireChannelRef(input: string): ChannelRef {
    const ref = parseChannelRef(input);
    if (!ref) {
      throw this.invalidInput("Channel input cannot be empty.");
    }
    return ref;
  }

  private requirePlaylistId(input: string): string {
    const playlistId = parsePlaylistId(input);
    if (!playlistId) {
      throw this.invalidInput("Could not extract a valid YouTube playlist ID from input.");
    }
    return playlistId;
  }

  private invalidInput(message: string): ToolExecutionError {
    return new ToolExecutionError(this.invalidInputDetail(message));
  }

  private invalidInputDetail(message: string): GracefulError {
    return {
      code: "INVALID_INPUT",
      message,
      retryable: false,
      attemptedTiers: [],
      suggestion: "Provide a valid YouTube URL, ID, handle, or playlist reference.",
    };
  }

  private normalizeError(error: unknown): GracefulError {
    if (error instanceof ToolExecutionError) {
      return error.detail;
    }
    return {
      code: "INTERNAL_ERROR",
      message: toMessage(error),
      retryable: false,
      attemptedTiers: [],
    };
  }

  private makeProvenance(sourceTier: SourceTier, partial: boolean, sourceNotes?: string[]): Provenance {
    return {
      sourceTier,
      fetchedAt: new Date().toISOString(),
      fallbackDepth: FALLBACK_DEPTH[sourceTier],
      partial,
      sourceNotes: sourceNotes && sourceNotes.length > 0 ? sourceNotes : undefined,
    };
  }

  private mergeProvenances(provenances: Provenance[], forcePartial = false): Provenance {
    const existing = provenances.filter(Boolean);
    if (existing.length === 0) {
      return this.makeProvenance("none", true);
    }

    const worst = existing.reduce((current, candidate) =>
      candidate.fallbackDepth > current.fallbackDepth ? candidate : current,
    );

    return {
      sourceTier: worst.sourceTier,
      fetchedAt: existing[0]?.fetchedAt ?? new Date().toISOString(),
      fallbackDepth: worst.fallbackDepth,
      partial: forcePartial || existing.some((item) => item.partial),
      sourceNotes: existing.flatMap((item) => item.sourceNotes ?? []).slice(0, 12),
    };
  }

  private sampleSearch(query: string, maxResults: number): VideoRecord[] {
    return Array.from({ length: Math.min(maxResults, 3) }, (_, index) => ({
      videoId: `dryRunVid${index}`.padEnd(11, "0").slice(0, 11),
      title: `${query} result ${index + 1}`,
      channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      channelTitle: "youtube-mcp",
      publishedAt: "2026-03-01T10:00:00.000Z",
      durationSec: 420 + index * 60,
      views: 10000 - index * 500,
      likes: 500 - index * 20,
      comments: 40 - index * 5,
      tags: ["youtube", "mcp", query],
      description: "Dry-run video record",
      transcriptAvailable: true,
      transcriptLanguages: ["en"],
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    }));
  }

  private sampleVideo(videoId: string): VideoRecord {
    return {
      videoId,
      title: "Dry-run sample video",
      channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      channelTitle: "youtube-mcp",
      publishedAt: "2026-03-01T10:00:00.000Z",
      durationSec: 642,
      views: 125000,
      likes: 5600,
      comments: 412,
      tags: ["mcp", "youtube", "analysis"],
      language: "en",
      category: "Education",
      description: "0:00 Intro\n1:12 Problem\n4:40 Solution\n8:30 Wrap up",
      chapters: parseDescriptionChapters("0:00 Intro\n1:12 Problem\n4:40 Solution\n8:30 Wrap up"),
      transcriptAvailable: true,
      transcriptLanguages: ["en"],
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  private sampleChannel(ref: ChannelRef): ChannelRecord {
    const handle = ref.type === "handle" ? ref.value : "GoogleDevelopers";
    return {
      channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      title: "Dry-run channel",
      handle,
      createdAt: "2010-01-01T00:00:00.000Z",
      country: "US",
      description: "Dry-run channel description for tonight's demo build.",
      descriptionSummary: "Dry-run channel description for tonight's demo build.",
      subscribers: 1200000,
      totalViews: 56000000,
      totalVideos: 540,
      url: "https://www.youtube.com/@GoogleDevelopers",
    };
  }

  private sampleChannelVideos(channelId: string): VideoRecord[] {
    return [
      {
        videoId: "dryrun00001",
        title: "Hook patterns that convert",
        channelId,
        channelTitle: "Dry-run channel",
        publishedAt: "2026-03-09T08:00:00.000Z",
        durationSec: 45,
        views: 42000,
        likes: 2600,
        comments: 190,
        tags: ["hooks", "shorts"],
        url: "https://www.youtube.com/watch?v=dryrun00001",
      },
      {
        videoId: "dryrun00002",
        title: "Title research workflow",
        channelId,
        channelTitle: "Dry-run channel",
        publishedAt: "2026-03-05T08:00:00.000Z",
        durationSec: 720,
        views: 18000,
        likes: 920,
        comments: 80,
        tags: ["titles", "seo"],
        url: "https://www.youtube.com/watch?v=dryrun00002",
      },
      {
        videoId: "dryrun00003",
        title: "Audience sentiment breakdown",
        channelId,
        channelTitle: "Dry-run channel",
        publishedAt: "2026-02-25T08:00:00.000Z",
        durationSec: 510,
        views: 22000,
        likes: 1100,
        comments: 95,
        tags: ["comments", "sentiment"],
        url: "https://www.youtube.com/watch?v=dryrun00003",
      },
    ];
  }

  private sampleTranscript(videoId: string): TranscriptRecord {
    return {
      videoId,
      languageUsed: "en",
      sourceType: "manual_caption",
      confidence: 0.93,
      transcriptText:
        "Today I'm going to show you how to research YouTube titles that actually earn clicks without resorting to clickbait. We'll look at patterns, compare examples, and leave with a checklist you can reuse.",
      segments: [
        { tStartSec: 0, tEndSec: 9, text: "Today I'm going to show you how to research YouTube titles that actually earn clicks without resorting to clickbait." },
        { tStartSec: 9, tEndSec: 18, text: "We'll look at patterns, compare examples, and leave with a checklist you can reuse." },
        { tStartSec: 18, tEndSec: 34, text: "First, start by mapping titles that use a clear promise, proof point, or surprising contrast." },
        { tStartSec: 34, tEndSec: 52, text: "Then compare the opening hook and audience comments to see whether the title matched the payoff." },
      ],
      chapters: [
        { title: "Intro", tStartSec: 0, tEndSec: 18 },
        { title: "Pattern map", tStartSec: 18, tEndSec: 52 },
      ],
    };
  }

  private sampleComments(videoId: string): CommentRecord[] {
    return [
      {
        commentId: "comment-1",
        author: "Builder One",
        text: "Great breakdown. Super clear and helpful.",
        likeCount: 12,
        publishedAt: "2026-03-01T10:00:00.000Z",
      },
      {
        commentId: "comment-2",
        author: "Builder Two",
        text: "Useful examples. The pacing felt a little slow in the middle but overall excellent.",
        likeCount: 7,
        publishedAt: "2026-03-01T11:00:00.000Z",
      },
      {
        commentId: "comment-3",
        author: "Builder Three",
        text: "Love the practical checklist. This is the best explanation I've found.",
        likeCount: 5,
        publishedAt: "2026-03-01T12:00:00.000Z",
      },
    ];
  }

  private samplePlaylist(playlistId: string): {
    playlistId: string;
    title?: string;
    channelTitle?: string;
    videoCountReported?: number;
    videos: VideoRecord[];
  } {
    return {
      playlistId,
      title: "Dry-run playlist",
      channelTitle: "youtube-mcp",
      videoCountReported: 3,
      videos: this.sampleChannelVideos("UC_x5XG1OV2P6uZZ5FSM9Ttw"),
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function rate(primary: number | undefined, secondary: number | undefined, denominator: number | undefined): number | undefined {
  if (!denominator || denominator <= 0) {
    return undefined;
  }
  const numerator = (primary ?? 0) + (secondary ?? 0);
  return round((numerator / denominator) * 100, 2);
}

function isNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toMessage(error: unknown): string {
  if (error instanceof ToolExecutionError) {
    return error.detail.message;
  }
  return error instanceof Error ? error.message : String(error);
}

function topStrings(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

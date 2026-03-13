export type SourceTier = "youtube_api" | "yt_dlp" | "page_extract" | "none";

export interface Provenance {
  sourceTier: SourceTier;
  sourceNotes?: string[];
  fetchedAt: string;
  fallbackDepth: 0 | 1 | 2 | 3;
  partial: boolean;
}

export interface Pagination {
  nextPageToken?: string;
  prevPageToken?: string;
}

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

export interface TokenControls {
  compact?: boolean;
  includeRaw?: boolean;
  fields?: string[];
}

export interface ServiceOptions {
  dryRun?: boolean;
}

export interface SearchItem {
  videoId: string;
  title: string;
  channelId?: string;
  channelTitle: string;
  publishedAt?: string;
  durationSec?: number;
  views?: number;
  likes?: number;
  comments?: number;
  tags?: string[];
  description?: string;
  url: string;
}

export interface VideoRecord {
  videoId: string;
  title: string;
  channelId?: string;
  channelTitle: string;
  publishedAt?: string;
  durationSec?: number;
  views?: number;
  likes?: number;
  comments?: number;
  tags?: string[];
  language?: string;
  category?: string;
  description?: string;
  transcriptLanguages?: string[];
  transcriptAvailable?: boolean;
  chapters?: Chapter[];
  url: string;
}

export interface Chapter {
  title: string;
  tStartSec: number;
  tEndSec?: number;
}

export interface CommentRecord {
  commentId?: string;
  author: string;
  text: string;
  likeCount?: number;
  publishedAt?: string;
  replies?: CommentRecord[];
}

export interface ChannelRecord {
  channelId: string;
  title: string;
  handle?: string;
  createdAt?: string;
  country?: string;
  description?: string;
  descriptionSummary?: string;
  subscribers?: number;
  totalViews?: number;
  totalVideos?: number;
  uploadsPlaylistId?: string;
  url: string;
}

export interface TranscriptSegment {
  tStartSec: number;
  tEndSec?: number;
  text: string;
  topicLabel?: string;
  chapterTitle?: string;
}

export interface TranscriptRecord {
  videoId: string;
  languageUsed?: string;
  sourceType: "manual_caption" | "auto_caption" | "generated_from_audio" | "unknown";
  confidence?: number;
  transcriptText: string;
  segments: TranscriptSegment[];
  chapters?: Chapter[];
}

export interface FindVideosInput extends TokenControls {
  query: string;
  maxResults?: number;
  order?: "relevance" | "date" | "viewCount" | "rating";
  regionCode?: string;
  publishedAfter?: string;
  publishedBefore?: string;
  channelId?: string;
  duration?: "any" | "short" | "medium" | "long";
}

export interface FindVideosOutput {
  query: string;
  results: Array<{
    videoId: string;
    title: string;
    channelId?: string;
    channelTitle: string;
    publishedAt?: string;
    durationSec?: number;
    views?: number;
    engagementRate?: number;
  }>;
  pagination?: Pagination;
  provenance: Provenance;
}

export interface InspectVideoInput extends TokenControls {
  videoIdOrUrl: string;
  includeTranscriptMeta?: boolean;
  includeEngagementRatios?: boolean;
}

export interface InspectVideoOutput {
  video: {
    videoId: string;
    title: string;
    channelId?: string;
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

export interface ListChannelCatalogInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  maxResults?: number;
  sortBy?: "date_desc" | "date_asc" | "views_desc";
  includeShorts?: boolean;
  includeLongForm?: boolean;
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

export interface ReadTranscriptInput extends TokenControls {
  videoIdOrUrl: string;
  language?: string;
  mode?: "full" | "summary" | "key_moments" | "chapters";
  includeTimestamps?: boolean;
  chunkWindowSec?: number;
  offset?: number;
  limit?: number;
}

export interface ReadTranscriptOutput {
  videoId: string;
  languageUsed?: string;
  transcript: {
    mode: "full" | "summary" | "key_moments" | "chapters";
    text?: string;
    segments?: Array<{
      tStartSec: number;
      tEndSec?: number;
      text: string;
      topicLabel?: string;
      chapterTitle?: string;
    }>;
  };
  longVideoHandling?: {
    totalCharacters: number;
    totalEstimatedTokens: number;
    autoDowngraded: boolean;
    originalMode?: string;
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
    confidence?: number;
  };
  provenance: Provenance;
}

export interface ReadCommentsInput extends TokenControls {
  videoIdOrUrl: string;
  maxTopLevel?: number;
  includeReplies?: boolean;
  maxRepliesPerThread?: number;
  order?: "relevance" | "time";
  languageHint?: string;
}

export interface ReadCommentsOutput {
  videoId: string;
  totalFetched: number;
  threads: Array<{
    commentId?: string;
    author: string;
    text: string;
    likeCount?: number;
    publishedAt?: string;
    replies?: Array<{
      commentId?: string;
      author: string;
      text: string;
      likeCount?: number;
      publishedAt?: string;
    }>;
  }>;
  pagination?: Pagination;
  provenance: Provenance;
}

export interface MeasureAudienceSentimentInput extends TokenControls {
  videoIdOrUrl: string;
  sampleSize?: number;
  includeThemes?: boolean;
  includeRepresentativeQuotes?: boolean;
}

export interface MeasureAudienceSentimentOutput {
  videoId: string;
  sampleSize: number;
  sentiment: {
    positivePct: number;
    neutralPct: number;
    negativePct: number;
    sentimentScore: number;
  };
  themes?: Array<{
    theme: string;
    prevalencePct: number;
    sentimentScore: number;
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

export type VideoAnalysisMode =
  | "video_info"
  | "transcript"
  | "comments"
  | "sentiment"
  | "hook_patterns"
  | "tag_title_patterns";

export interface AnalyzeVideoSetInput extends TokenControls {
  videoIdsOrUrls: string[];
  analyses: VideoAnalysisMode[];
  commentsSampleSize?: number;
  transcriptMode?: "summary" | "key_moments" | "full";
}

export interface AnalyzeVideoSetItem {
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
}

export interface AnalyzeVideoSetOutput {
  requestedCount: number;
  processedCount: number;
  failedCount: number;
  items: AnalyzeVideoSetItem[];
  summary: {
    successRatePct: number;
    avgFallbackDepth: number;
  };
}

export interface ExpandPlaylistInput extends TokenControls {
  playlistUrlOrId: string;
  maxVideos?: number;
  includeVideoMeta?: boolean;
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

export interface AnalyzePlaylistInput extends TokenControls {
  playlistUrlOrId: string;
  analyses: VideoAnalysisMode[];
  maxVideos?: number;
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
  items: AnalyzeVideoSetItem[];
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

export interface ScoreHookPatternsInput extends TokenControls {
  videoIdsOrUrls: string[];
  hookWindowSec?: number;
}

export interface ScoreHookPatternsOutput {
  videos: Array<{
    videoId: string;
    hookScore: number;
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

export interface ResearchTagsAndTitlesInput extends TokenControls {
  seedTopic: string;
  regionCode?: string;
  language?: string;
  maxExamples?: number;
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

export interface CompareShortsVsLongInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  lookbackDays?: number;
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
    suggestedMixShortPct: number;
    suggestedMixLongPct: number;
    rationale: string[];
  };
  provenance: Provenance;
}

export interface RecommendUploadWindowsInput extends TokenControls {
  channelIdOrHandleOrUrl: string;
  timezone: string;
  lookbackDays?: number;
}

export interface RecommendUploadWindowsOutput {
  channelId: string;
  recommendedSlots: Array<{
    weekday: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
    hourLocal: number;
    confidence: number;
    rationale: string;
  }>;
  observedPatterns: {
    bestDay?: string;
    bestHour?: number;
    consistencyScore?: number;
  };
  provenance: Provenance;
}

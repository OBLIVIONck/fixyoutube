export type YouTubeResourceKind =
  | "video"
  | "short"
  | "post"
  | "channel"
  | "playlist"
  | "unknown";

export interface PollChoice {
  text: string;
  votePercentage?: string;
}

export interface CommunityPoll {
  choices: PollChoice[];
  totalVotes?: string;
}

export interface YouTubeEmbed {
  kind: YouTubeResourceKind;
  canonicalUrl: string;
  title: string;
  description: string;
  author?: string;
  authorUrl?: string;
  thumbnail?: string;
  videoUrl?: string;
  videoWidth?: number;
  videoHeight?: number;
  durationSeconds?: number;
  viewCount?: string;
  publishedAt?: string;
  images?: string[];
  poll?: CommunityPoll;
  likes?: string;
  comments?: string;
}

export interface Env {
  INNERTUBE_API_KEY?: string;
  INNERTUBE_CLIENT_VERSION?: string;
}

export type ContentType = "DRAMA" | "MOVIE" | "ANIMATION";

export interface ContentCardResponse {
  contentId: number;
  title: string;
  contentType: ContentType;
  thumbnailUrl: string;
}

export interface ContentSummaryResponse extends ContentCardResponse {
  viewCount: number;
}

export interface ContentSliceResponse {
  content: ContentCardResponse[];
  limit: number;
  totalElements: number;
  last: boolean;
}

export interface ContentDetailResponse extends ContentCardResponse {
  description: string;
  releaseYear: number;
  country: string;
}

export interface PagedContentResponse {
  content: ContentCardResponse[];
  page: number;
  size: number;
  totalElements: number;
  last: boolean;
}

export interface SearchContentsParams {
  keyword: string;
  page?: number;
  size?: number;
}

export interface ContentListParams {
  contentType: ContentType;
  limit?: number;
}

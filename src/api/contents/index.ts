import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  apiRequest,
  buildQuery,
  invalidResponse,
  isRecord,
  readArray,
  readBoolean,
  readNumber,
  readString,
} from "@/api/client";

import type {
  ContentCardResponse,
  ContentDetailResponse,
  ContentListParams,
  ContentSliceResponse,
  ContentSummaryResponse,
  ContentType,
  PagedContentResponse,
  SearchContentsParams,
} from "./type";

const CONTENT_TYPES = new Set<ContentType>(["DRAMA", "MOVIE", "ANIMATION"]);

function parseContentType(value: string): ContentType {
  if (!CONTENT_TYPES.has(value as ContentType)) throw invalidResponse("contentType");
  return value as ContentType;
}

function parseCard(value: unknown): ContentCardResponse {
  if (!isRecord(value)) throw invalidResponse();
  return {
    contentId: readNumber(value, "contentId"),
    title: readString(value, "title"),
    contentType: parseContentType(readString(value, "contentType")),
    thumbnailUrl: readString(value, "thumbnailUrl"),
  };
}

function parseSummary(value: unknown): ContentSummaryResponse {
  if (!isRecord(value)) throw invalidResponse();
  return { ...parseCard(value), viewCount: readNumber(value, "viewCount") };
}

function parseSlice(value: unknown): ContentSliceResponse {
  if (!isRecord(value)) throw invalidResponse();
  return {
    content: readArray(value, "content").map(parseCard),
    limit: readNumber(value, "limit"),
    totalElements: readNumber(value, "totalElements"),
    last: readBoolean(value, "last"),
  };
}

export const contentKeys = {
  all: ["contents"] as const,
  list: (kind: string, params: ContentListParams) =>
    [...contentKeys.all, kind, params.contentType, params.limit ?? 5] as const,
  detail: (contentId: number) => [...contentKeys.all, "detail", contentId] as const,
  search: (params: Required<SearchContentsParams>) =>
    [...contentKeys.all, "search", params] as const,
};

export async function getPopularContents({ contentType, limit = 5 }: ContentListParams) {
  const value = await apiRequest(
    `/contents/${contentType}/popular${buildQuery({ limit })}`,
  );
  if (!Array.isArray(value)) throw invalidResponse();
  return value.map(parseSummary);
}

export async function getRecommendedContents({ contentType, limit = 5 }: ContentListParams) {
  return parseSlice(
    await apiRequest(`/contents/${contentType}/recommended${buildQuery({ limit })}`),
  );
}

export async function getMostVisitedContents({ contentType, limit = 5 }: ContentListParams) {
  return parseSlice(
    await apiRequest(`/contents/${contentType}/most-visited${buildQuery({ limit })}`),
  );
}

export async function getContentDetail(contentId: number): Promise<ContentDetailResponse> {
  const value = await apiRequest(`/contents/${contentId}`);
  if (!isRecord(value)) throw invalidResponse();
  return {
    ...parseCard(value),
    description: readString(value, "description"),
    releaseYear: readNumber(value, "releaseYear"),
    country: readString(value, "country"),
  };
}

export async function searchContents({
  keyword,
  page = 0,
  size = 10,
}: SearchContentsParams): Promise<PagedContentResponse> {
  const value = await apiRequest(
    `/contents/search${buildQuery({ keyword, page, size })}`,
  );
  if (!isRecord(value)) throw invalidResponse();
  return {
    content: readArray(value, "content").map(parseCard),
    page: readNumber(value, "page"),
    size: readNumber(value, "size"),
    totalElements: readNumber(value, "totalElements"),
    last: readBoolean(value, "last"),
  };
}

export function popularContentsQuery(params: ContentListParams) {
  return queryOptions({
    queryKey: contentKeys.list("popular", params),
    queryFn: () => getPopularContents(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function recommendedContentsQuery(params: ContentListParams) {
  return queryOptions({
    queryKey: contentKeys.list("recommended", params),
    queryFn: () => getRecommendedContents(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function mostVisitedContentsQuery(params: ContentListParams) {
  return queryOptions({
    queryKey: contentKeys.list("most-visited", params),
    queryFn: () => getMostVisitedContents(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function contentDetailQuery(contentId: number) {
  return queryOptions({
    queryKey: contentKeys.detail(contentId),
    queryFn: () => getContentDetail(contentId),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopularContents(params: ContentListParams) {
  return useQuery(popularContentsQuery(params));
}

export function useRecommendedContents(params: ContentListParams) {
  return useQuery(recommendedContentsQuery(params));
}

export function useMostVisitedContents(params: ContentListParams) {
  return useQuery(mostVisitedContentsQuery(params));
}

export function useContentDetail(contentId: number) {
  return useQuery(contentDetailQuery(contentId));
}

export function useSearchContents(params: SearchContentsParams) {
  const normalized = { keyword: params.keyword, page: params.page ?? 0, size: params.size ?? 10 };
  return useQuery({
    queryKey: contentKeys.search(normalized),
    queryFn: () => searchContents(normalized),
    enabled: normalized.keyword.length > 0,
    staleTime: 60 * 1000,
  });
}

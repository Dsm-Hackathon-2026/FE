import { queryOptions, useQuery } from "@tanstack/react-query";

import {
  apiRequest,
  invalidResponse,
  isRecord,
  readArray,
  readBoolean,
  readNullableString,
  readNumber,
  readString,
} from "@/api/client";

import type { SpotDetailResponse, SpotListItemResponse, SpotListResponse } from "./type";

function parseSpot(value: unknown): SpotListItemResponse {
  if (!isRecord(value)) throw invalidResponse();
  return {
    spotId: readNumber(value, "spotId"),
    name: readString(value, "name"),
    latitude: readNumber(value, "latitude"),
    longitude: readNumber(value, "longitude"),
    address: readString(value, "address"),
    imageUrl: readString(value, "imageUrl"),
    verified: readBoolean(value, "verified"),
  };
}

export const spotKeys = {
  all: ["spots"] as const,
  list: (contentId: number) => [...spotKeys.all, "list", contentId] as const,
  detail: (contentId: number, spotId: number) =>
    [...spotKeys.all, "detail", contentId, spotId] as const,
};

export async function getSpots(contentId: number): Promise<SpotListResponse> {
  const value = await apiRequest(`/spots/${contentId}`);
  if (!isRecord(value)) throw invalidResponse();
  return {
    content: readArray(value, "content").map(parseSpot),
    totalElements: readNumber(value, "totalElements"),
  };
}

export async function getSpotDetail(
  contentId: number,
  spotId: number,
): Promise<SpotDetailResponse> {
  const value = await apiRequest(`/spots/${contentId}/${spotId}`);
  if (!isRecord(value)) throw invalidResponse();
  return {
    spotId: readNumber(value, "spotId"),
    contentId: readNumber(value, "contentId"),
    contentTitle: readString(value, "contentTitle"),
    name: readString(value, "name"),
    latitude: readNumber(value, "latitude"),
    longitude: readNumber(value, "longitude"),
    address: readString(value, "address"),
    imageUrl: readString(value, "imageUrl"),
    verificationImageUrl: readNullableString(value, "verificationImageUrl"),
  };
}

export function spotsQuery(contentId: number) {
  return queryOptions({
    queryKey: spotKeys.list(contentId),
    queryFn: () => getSpots(contentId),
    staleTime: 5 * 60 * 1000,
  });
}

export function spotDetailQuery(contentId: number, spotId: number) {
  return queryOptions({
    queryKey: spotKeys.detail(contentId, spotId),
    queryFn: () => getSpotDetail(contentId, spotId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSpots(contentId: number) {
  return useQuery(spotsQuery(contentId));
}

export function useSpotDetail(contentId: number, spotId: number) {
  return useQuery(spotDetailQuery(contentId, spotId));
}

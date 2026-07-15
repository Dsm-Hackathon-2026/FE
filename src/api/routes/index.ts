import { useMutation } from "@tanstack/react-query";

import {
  ApiError,
  apiRequest,
  invalidResponse,
  isRecord,
  readArray,
  readNumber,
  readString,
} from "@/api/client";

import type {
  AiRecommendationAddressCandidatesRequest,
  AiRecommendationRequest,
  AiRecommendationResponse,
  TimelineItemResponse,
} from "./type";

function readAliasedString(
  record: Record<string, unknown>,
  primaryKey: string,
  fallbackKey: string,
) {
  const value = record[primaryKey] ?? record[fallbackKey];
  if (typeof value !== "string") throw invalidResponse(primaryKey);
  return value;
}

function readNullableString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== "string") throw invalidResponse(key);
  return value;
}

function readOptionalNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) throw invalidResponse(key);
  return value;
}

function parseTimelineItem(value: unknown): TimelineItemResponse {
  if (!isRecord(value)) throw invalidResponse();
  return {
    time: readString(value, "time"),
    place: readString(value, "place"),
    activity: readString(value, "activity"),
    address: readNullableString(value, "address"),
    latitude: readOptionalNumber(value, "latitude"),
    longitude: readOptionalNumber(value, "longitude"),
  };
}

export async function recommendRoute(
  request: AiRecommendationRequest,
): Promise<AiRecommendationResponse> {
  const value = await apiRequest("/routes/recommended", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!isRecord(value) || !isRecord(value.meta)) throw invalidResponse();
  return {
    status: readNumber(value, "status"),
    meta: {
      startPlace: readAliasedString(value.meta, "startPlace", "start_place"),
      destination: readString(value.meta, "destination"),
    },
    courseConcept: readAliasedString(value, "courseConcept", "course_concept"),
    timeline: readArray(value, "timeline").map(parseTimelineItem),
  };
}

export function isUnrecognizedAddressError(error: unknown) {
  return error instanceof ApiError
    && error.status === 400
    && /(출발지|도착지|주소).*(인식|정확)/.test(error.message);
}

export async function recommendRouteWithAddressFallback({
  startAddresses,
  destAddresses,
  startTime,
}: AiRecommendationAddressCandidatesRequest) {
  const attemptCount = Math.max(startAddresses.length, destAddresses.length);
  const attemptedPairs = new Set<string>();
  let lastError: unknown;

  for (let index = 0; index < attemptCount; index += 1) {
    const startAddress = startAddresses[index] ?? startAddresses[0];
    const destAddress = destAddresses[index] ?? destAddresses[0];
    if (!startAddress || !destAddress) break;

    const pairKey = `${startAddress}\n${destAddress}`;
    if (attemptedPairs.has(pairKey)) continue;
    attemptedPairs.add(pairKey);

    try {
      return await recommendRoute({ startAddress, destAddress, startTime });
    } catch (error) {
      lastError = error;
      if (!isUnrecognizedAddressError(error)) throw error;
    }
  }

  throw lastError ?? new Error("추천 일정에 사용할 주소가 없습니다.");
}

export function useRecommendRoute() {
  return useMutation({ mutationFn: recommendRouteWithAddressFallback });
}

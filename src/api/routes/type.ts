export interface AiRecommendationRequest {
  startAddress: string;
  destAddress: string;
  startTime: string;
}

export interface AiRecommendationAddressCandidatesRequest {
  startAddresses: readonly string[];
  destAddresses: readonly string[];
  startTime: string;
}

export interface AiRecommendationMetaResponse {
  startPlace: string;
  destination: string;
}

export interface PilgrimageRouteRequest {
  startAddress: string;
  startTime: string;
  spotIds: readonly number[];
}

export interface PilgrimageRecommendationMetaResponse {
  startPlace: string;
  startAddress: string | null;
  destinations: string[];
}

export interface TimelineItemResponse {
  time: string;
  place: string;
  activity: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AiRecommendationResponse {
  status: number;
  meta: AiRecommendationMetaResponse;
  courseConcept: string;
  timeline: TimelineItemResponse[];
}

export interface PilgrimageRecommendationResponse {
  status: number;
  meta: PilgrimageRecommendationMetaResponse;
  courseConcept: string;
  timeline: TimelineItemResponse[];
}

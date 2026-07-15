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

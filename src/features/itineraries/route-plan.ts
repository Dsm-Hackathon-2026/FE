import type { AiRecommendationResponse, TimelineItemResponse } from "@/api/routes/type";
import type {
  Itinerary,
  ItineraryStop,
  ItineraryStopKind,
} from "@/features/itineraries/itinerary";
import {
  geocodeAddress,
  type MapCoordinates,
  type RouteDeparture,
} from "@/features/map/kakao-map";
import {
  distanceBetweenMeters,
  formatItineraryDistance,
} from "@/features/map/route-following";

const ROUTE_PLAN_VERSION = 2;
const ROUTE_PLAN_PREFIX = "seongdeok:route-plan";
export const DEPARTURE_REUSE_RADIUS_METERS = 250;
const STOP_KINDS = new Set<ItineraryStopKind>([
  "station",
  "current-location",
  "restaurant",
  "cafe",
  "attraction",
  "filming-location",
]);

export type RouteDestination = {
  id: string;
  name: string;
  address: string;
  imageSrc: string;
  imageAlt: string;
  coordinates: MapCoordinates;
};

type StoredRoutePlan = {
  version: typeof ROUTE_PLAN_VERSION;
  contentId: number;
  destinationId: string;
  itinerary: Itinerary;
};

function inferStopKind(item: TimelineItemResponse): ItineraryStopKind {
  const text = `${item.place} ${item.activity}`;
  if (/(카페|커피|디저트)/.test(text)) return "cafe";
  if (/(식당|맛집|횟집|한식|중식|일식|양식|분식)/.test(text)) return "restaurant";
  return "attraction";
}

function storageKey(contentId: number, destinationId: string) {
  return `${ROUTE_PLAN_PREFIX}:${contentId}:${destinationId}`;
}

const ADDRESS_REGION_ALIASES = [
  ["서울특별시", "서울"],
  ["부산광역시", "부산"],
  ["대구광역시", "대구"],
  ["인천광역시", "인천"],
  ["광주광역시", "광주"],
  ["대전광역시", "대전"],
  ["울산광역시", "울산"],
  ["세종특별자치시", "세종"],
  ["강원특별자치도", "강원"],
  ["전북특별자치도", "전북"],
] as const;

function normalizeAddress(address: string) {
  let normalized = address.trim();
  for (const [fullName, shortName] of ADDRESS_REGION_ALIASES) {
    normalized = normalized.replace(fullName, shortName);
  }
  return normalized.replace(/[\s,()]/g, "");
}

function timelineCoordinates(item: TimelineItemResponse): MapCoordinates | null {
  return item.latitude !== null && item.longitude !== null
    ? { latitude: item.latitude, longitude: item.longitude }
    : null;
}

function isEndpointItem(
  item: TimelineItemResponse & { address: string },
  endpoint: { address: string; coordinates: MapCoordinates },
) {
  if (normalizeAddress(item.address) === normalizeAddress(endpoint.address)) return true;
  const coordinates = timelineCoordinates(item);
  return coordinates
    ? distanceBetweenMeters(coordinates, endpoint.coordinates) <= 25
    : false;
}

function isCoordinates(value: unknown): value is MapCoordinates {
  if (!value || typeof value !== "object") return false;
  const coordinates = value as Record<string, unknown>;
  return Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude);
}

function isItineraryStop(value: unknown): value is ItineraryStop {
  if (!value || typeof value !== "object") return false;
  const stop = value as Record<string, unknown>;
  return (
    typeof stop.id === "string"
    && typeof stop.order === "number"
    && typeof stop.name === "string"
    && typeof stop.description === "string"
    && typeof stop.address === "string"
    && typeof stop.kind === "string"
    && STOP_KINDS.has(stop.kind as ItineraryStopKind)
    && isCoordinates(stop.coordinates)
    && (stop.imageSrc === undefined || typeof stop.imageSrc === "string")
    && (stop.imageAlt === undefined || typeof stop.imageAlt === "string")
    && (stop.distanceToNext === undefined || typeof stop.distanceToNext === "string")
  );
}

function withStopDistances(stops: readonly ItineraryStop[]) {
  return stops.map((stop, index) => {
    const nextStop = stops[index + 1];
    if (!nextStop) {
      const lastStop = { ...stop };
      delete lastStop.distanceToNext;
      return lastStop;
    }

    return {
      ...stop,
      distanceToNext: formatItineraryDistance(
        distanceBetweenMeters(stop.coordinates, nextStop.coordinates),
      ),
    };
  });
}

function isStoredRoutePlan(value: unknown): value is StoredRoutePlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Record<string, unknown>;
  if (!plan.itinerary || typeof plan.itinerary !== "object") return false;
  const itinerary = plan.itinerary as Record<string, unknown>;
  return (
    plan.version === ROUTE_PLAN_VERSION
    && typeof plan.contentId === "number"
    && typeof plan.destinationId === "string"
    && typeof itinerary.id === "string"
    && typeof itinerary.title === "string"
    && Array.isArray(itinerary.stops)
    && itinerary.stops.length > 0
    && itinerary.stops.every(isItineraryStop)
  );
}

export async function createRecommendedItinerary({
  appKey,
  contentId,
  departure,
  destination,
  recommendation,
}: {
  appKey: string;
  contentId: number;
  departure: RouteDeparture;
  destination: RouteDestination;
  recommendation: AiRecommendationResponse;
}): Promise<Itinerary> {
  const seenAddresses = new Set<string>();
  const recommendedItems = recommendation.timeline.filter(
    (item): item is TimelineItemResponse & { address: string } =>
      typeof item.address === "string"
      && item.place !== recommendation.meta.startPlace
      && item.place !== recommendation.meta.destination
      && !isEndpointItem(item as TimelineItemResponse & { address: string }, departure)
      && !isEndpointItem(item as TimelineItemResponse & { address: string }, destination),
  ).filter((item) => {
    const address = normalizeAddress(item.address);
    if (seenAddresses.has(address)) return false;
    seenAddresses.add(address);
    return true;
  });
  const geocodedItems = await Promise.all(
    recommendedItems.map(async (item) => ({
      item,
      coordinates: timelineCoordinates(item) ?? await geocodeAddress(appKey, item.address),
    })),
  );
  const stops: ItineraryStop[] = [
    {
      id: "departure",
      order: 0,
      name: departure.kind === "current-location"
        ? departure.name
        : recommendation.meta.startPlace || departure.name,
      description: "여행 시작",
      address: departure.address,
      kind: departure.kind === "current-location" ? "current-location" : "station",
      coordinates: departure.coordinates,
    },
  ];

  for (const { item, coordinates } of geocodedItems) {
    if (!item.address || !coordinates) continue;
    stops.push({
      id: `recommendation-${stops.length}`,
      order: stops.length,
      name: item.place,
      description: item.activity,
      address: item.address,
      kind: inferStopKind(item),
      coordinates,
    });
  }

  stops.push({
    id: `destination-${destination.id}`,
    order: stops.length,
    name: destination.name,
    description: "여정의 마지막 명장면 장소",
    address: destination.address,
    imageSrc: destination.imageSrc,
    imageAlt: destination.imageAlt,
    kind: "filming-location",
    coordinates: destination.coordinates,
  });

  return {
    id: `recommended-${contentId}-${destination.id}`,
    title: recommendation.courseConcept,
    stops: withStopDistances(stops),
  };
}

export function saveRoutePlan(
  contentId: number,
  destinationId: string,
  itinerary: Itinerary,
) {
  const plan: StoredRoutePlan = {
    version: ROUTE_PLAN_VERSION,
    contentId,
    destinationId,
    itinerary,
  };
  sessionStorage.setItem(storageKey(contentId, destinationId), JSON.stringify(plan));
}

export function hasRoutePlan(contentId: number, destinationId: string) {
  return readRoutePlan(contentId, destinationId) !== null;
}

export function isRoutePlanReusable(
  itinerary: Itinerary,
  departure: RouteDeparture,
) {
  const storedDeparture = itinerary.stops[0];
  if (!storedDeparture) return false;

  const expectedKind = departure.kind === "current-location" ? "current-location" : "station";
  return storedDeparture.kind === expectedKind
    && distanceBetweenMeters(storedDeparture.coordinates, departure.coordinates)
      <= DEPARTURE_REUSE_RADIUS_METERS;
}

export function readReusableRoutePlan(
  contentId: number,
  destinationId: string,
  departure: RouteDeparture,
) {
  const itinerary = readRoutePlan(contentId, destinationId);
  return itinerary && isRoutePlanReusable(itinerary, departure) ? itinerary : null;
}

export function readRoutePlan(contentId: number, destinationId: string) {
  const serialized = sessionStorage.getItem(storageKey(contentId, destinationId));
  if (!serialized) return null;

  try {
    const plan: unknown = JSON.parse(serialized);
    return isStoredRoutePlan(plan) && plan.contentId === contentId
      && plan.destinationId === destinationId
      ? { ...plan.itinerary, stops: withStopDistances(plan.itinerary.stops) }
      : null;
  } catch {
    return null;
  }
}

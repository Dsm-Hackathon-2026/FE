import type { ItineraryStop } from "@/features/itineraries/itinerary";

export const ARRIVAL_RADIUS_METERS = 45;
export const OFF_ROUTE_THRESHOLD_METERS = 120;
export const OFF_ROUTE_CONFIRMATION_COUNT = 3;

type Coordinates = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

export function distanceBetweenMeters(from: Coordinates, to: Coordinates) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function distanceToSegmentMeters(
  point: Coordinates,
  start: Coordinates,
  end: Coordinates,
) {
  const referenceLatitude = toRadians((start.latitude + end.latitude + point.latitude) / 3);
  const project = (coordinates: Coordinates) => ({
    x: toRadians(coordinates.longitude) * Math.cos(referenceLatitude) * EARTH_RADIUS_METERS,
    y: toRadians(coordinates.latitude) * EARTH_RADIUS_METERS,
  });
  const projectedPoint = project(point);
  const projectedStart = project(start);
  const projectedEnd = project(end);
  const segmentX = projectedEnd.x - projectedStart.x;
  const segmentY = projectedEnd.y - projectedStart.y;
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;

  if (segmentLengthSquared === 0) return distanceBetweenMeters(point, start);

  const projection = Math.max(0, Math.min(1,
    ((projectedPoint.x - projectedStart.x) * segmentX
      + (projectedPoint.y - projectedStart.y) * segmentY) / segmentLengthSquared,
  ));
  const closestX = projectedStart.x + projection * segmentX;
  const closestY = projectedStart.y + projection * segmentY;
  return Math.hypot(projectedPoint.x - closestX, projectedPoint.y - closestY);
}

export function findNextStopIndex(
  stops: readonly ItineraryStop[],
  currentIndex: number,
  coordinates: Coordinates,
) {
  let nextIndex = currentIndex;

  while (
    nextIndex < stops.length
    && distanceBetweenMeters(coordinates, stops[nextIndex].coordinates) <= ARRIVAL_RADIUS_METERS
  ) {
    nextIndex += 1;
  }

  return nextIndex;
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) return `${Math.max(1, Math.round(distanceMeters / 10) * 10)}m`;
  const kilometers = distanceMeters / 1_000;
  return `${kilometers < 10 ? kilometers.toFixed(1) : Math.round(kilometers)}km`;
}

export function formatItineraryDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) return `${Math.max(1, Math.round(distanceMeters))}m`;
  const kilometers = distanceMeters / 1_000;
  return `${kilometers < 10 ? kilometers.toFixed(1) : Math.round(kilometers)}km`;
}

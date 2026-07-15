import type { ItineraryStop } from "@/features/itineraries/itinerary";
import { distanceBetweenMeters } from "@/features/map/route-following";

type KakaoMapInstance = {
  getCenter(): KakaoLatLng;
  getProjection(): KakaoMapProjection;
  panTo(center: KakaoLatLng): void;
  setCenter(center: KakaoLatLng): void;
  setBounds(bounds: KakaoBounds): void;
  setDraggable(draggable: boolean): void;
  setLevel(level: number, options?: { animate: { duration: number } }): void;
  setZoomable(zoomable: boolean): void;
};
type KakaoBounds = { extend(position: KakaoLatLng): void };
type KakaoLatLng = object;
type KakaoPoint = { x: number; y: number };
type KakaoMapProjection = {
  containerPointFromCoords(position: KakaoLatLng): KakaoPoint;
  coordsFromContainerPoint(point: KakaoPoint): KakaoLatLng;
};
type KakaoDrawable = { setMap(map: KakaoMapInstance | null): void };
type KakaoPlace = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
};
type KakaoPlaces = {
  categorySearch(
    categoryCode: string,
    callback: (places: KakaoPlace[], status: string) => void,
    options: KakaoPlaceSearchOptions,
  ): void;
  keywordSearch(
    keyword: string,
    callback: (places: KakaoPlace[], status: string) => void,
    options: KakaoPlaceSearchOptions,
  ): void;
};
type KakaoAddressResult = {
  address_name: string;
  x: string;
  y: string;
};
type KakaoCoordinateAddressResult = {
  address: { address_name: string } | null;
  road_address: { address_name: string } | null;
};
type KakaoGeocoder = {
  addressSearch(
    address: string,
    callback: (results: KakaoAddressResult[], status: string) => void,
  ): void;
  coord2Address(
    longitude: number,
    latitude: number,
    callback: (results: KakaoCoordinateAddressResult[], status: string) => void,
  ): void;
};
type KakaoPlaceSearchOptions = {
  location: KakaoLatLng;
  radius: number;
  sort: string;
};

type KakaoMapsApi = {
  load(callback: () => void): void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  Point: new (x: number, y: number) => KakaoPoint;
  LatLngBounds: new () => KakaoBounds;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance;
  CustomOverlay: new (options: {
    map: KakaoMapInstance;
    position: KakaoLatLng;
    content: HTMLElement;
    yAnchor: number;
  }) => KakaoDrawable;
  Polyline: new (options: {
    map: KakaoMapInstance;
    path: KakaoLatLng[];
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeStyle: string;
    clickable: boolean;
  }) => KakaoDrawable;
  services: {
    Places: new () => KakaoPlaces;
    Geocoder: new () => KakaoGeocoder;
    Status: { OK: string };
    SortBy: { DISTANCE: string };
  };
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsApi };
  }
}

const SDK_ID = "kakao-map-sdk";
const PIN_COLORS = ["#ffffff", "#8f62f7", "#8f62f7", "#f78562", "#62aaf7"];

export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

export type RouteDeparture = {
  name: string;
  address: string;
  coordinates: MapCoordinates;
  kind: "current-location" | "transit";
};

export type KakaoItineraryMapController = {
  focusCurrentPosition(coordinates: MapCoordinates, animate: boolean): void;
  focusFallbackDeparture(animate: boolean): void;
  updateCurrentPosition(coordinates: MapCoordinates, followCamera: boolean): void;
  updateRouteProgress(
    activeStopIndex: number,
    coordinates?: MapCoordinates,
    rerouted?: boolean,
  ): void;
};

const TRANSIT_CATEGORY_PATTERN = /(지하철역|기차역|버스터미널)/;
const TRANSIT_KEYWORDS = ["기차역", "고속버스터미널", "시외버스터미널", "버스터미널"];
const TRANSIT_SEARCH_RADIUS_METERS = 20_000;
export const DIRECT_DEPARTURE_RADIUS_METERS = 3_000;
const LOCAL_ACCESS_METERS_PER_MINUTE = 400;
const TRANSIT_METERS_PER_MINUTE = 583;
const TRANSIT_TRANSFER_MINUTES = 8;

export type DepartureCandidate = {
  name: string;
  address: string;
  coordinates: MapCoordinates;
};

function estimatedTransitMinutes(
  current: MapCoordinates,
  destination: MapCoordinates,
  candidate: DepartureCandidate,
) {
  return distanceBetweenMeters(current, candidate.coordinates) / LOCAL_ACCESS_METERS_PER_MINUTE
    + TRANSIT_TRANSFER_MINUTES
    + distanceBetweenMeters(candidate.coordinates, destination) / TRANSIT_METERS_PER_MINUTE;
}

export function chooseRouteDeparture(
  current: MapCoordinates,
  destination: MapCoordinates,
  candidates: readonly DepartureCandidate[],
): RouteDeparture | null {
  if (distanceBetweenMeters(current, destination) <= DIRECT_DEPARTURE_RADIUS_METERS) {
    return {
      name: "현재 위치",
      address: "현재 위치",
      coordinates: current,
      kind: "current-location",
    };
  }

  const bestCandidate = candidates.reduce<DepartureCandidate | null>((best, candidate) => {
    if (!best) return candidate;
    return estimatedTransitMinutes(current, destination, candidate)
      < estimatedTransitMinutes(current, destination, best)
      ? candidate
      : best;
  }, null);

  return bestCandidate ? { ...bestCandidate, kind: "transit" } : null;
}

function searchTransitPlaces(
  maps: KakaoMapsApi,
  coordinates: MapCoordinates,
): Promise<KakaoPlace[]> {
  const options: KakaoPlaceSearchOptions = {
    location: new maps.LatLng(coordinates.latitude, coordinates.longitude),
    radius: TRANSIT_SEARCH_RADIUS_METERS,
    sort: maps.services.SortBy.DISTANCE,
  };
  const searches = [
    new Promise<KakaoPlace[]>((resolve) => {
      new maps.services.Places().categorySearch(
        "SW8",
        (places, status) => resolve(status === maps.services.Status.OK ? places : []),
        options,
      );
    }),
    ...TRANSIT_KEYWORDS.map(
      (keyword) => new Promise<KakaoPlace[]>((resolve) => {
        new maps.services.Places().keywordSearch(
          keyword,
          (places, status) => resolve(status === maps.services.Status.OK ? places : []),
          options,
        );
      }),
    ),
  ];

  return Promise.all(searches).then((results) => results.flat());
}

async function findBestRouteDeparture(
  maps: KakaoMapsApi,
  current: MapCoordinates,
  destination: MapCoordinates,
): Promise<RouteDeparture | null> {
  if (distanceBetweenMeters(current, destination) <= DIRECT_DEPARTURE_RADIUS_METERS) {
    return chooseRouteDeparture(current, destination, []);
  }

  const places = await searchTransitPlaces(maps, current);
  const uniquePlaces = new Map<string, KakaoPlace>();

  for (const place of places) {
    if (
      (place.category_group_code === "SW8" || TRANSIT_CATEGORY_PATTERN.test(place.category_name))
      && !uniquePlaces.has(place.id)
    ) {
      uniquePlaces.set(place.id, place);
    }
  }

  const candidates = [...uniquePlaces.values()].flatMap<DepartureCandidate>((place) => {
    const latitude = Number(place.y);
    const longitude = Number(place.x);
    const address = place.road_address_name || place.address_name;
    return address && Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [{ name: place.place_name, address, coordinates: { latitude, longitude } }]
      : [];
  });

  return chooseRouteDeparture(current, destination, candidates);
}

export function getCurrentCoordinates() {
  return new Promise<MapCoordinates>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("현재 위치를 지원하지 않는 브라우저입니다."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 },
    );
  });
}

export async function findRouteDepartureFromCurrentLocation(
  appKey: string,
  destination: MapCoordinates,
) {
  const [maps, coordinates] = await Promise.all([
    loadKakaoMaps(appKey),
    getCurrentCoordinates(),
  ]);
  return findBestRouteDeparture(maps, coordinates, destination);
}

export async function geocodeAddress(appKey: string, address: string) {
  const maps = await loadKakaoMaps(appKey);

  return new Promise<MapCoordinates | null>((resolve) => {
    new maps.services.Geocoder().addressSearch(address, (results, status) => {
      if (status !== maps.services.Status.OK || results.length === 0) {
        resolve(null);
        return;
      }

      const latitude = Number(results[0].y);
      const longitude = Number(results[0].x);
      resolve(
        Number.isFinite(latitude) && Number.isFinite(longitude)
          ? { latitude, longitude }
          : null,
      );
    });
  });
}

export async function getAddressCandidates(
  appKey: string,
  coordinates: MapCoordinates,
  fallbackAddress: string,
) {
  const maps = await loadKakaoMaps(appKey);

  return new Promise<string[]>((resolve) => {
    new maps.services.Geocoder().coord2Address(
      coordinates.longitude,
      coordinates.latitude,
      (results, status) => {
        const firstResult = results[0];
        const candidates = status === maps.services.Status.OK && firstResult
          ? [
              firstResult.road_address?.address_name,
              firstResult.address?.address_name,
              fallbackAddress,
            ]
          : [fallbackAddress];
        resolve(
          [...new Set(candidates
            .filter((address): address is string => typeof address === "string")
            .map((address) => address.trim())
            .filter(Boolean))],
        );
      },
    );
  });
}

function enableSingleTouchPan(
  maps: KakaoMapsApi,
  map: KakaoMapInstance,
  container: HTMLElement,
) {
  let previousTouch: { identifier: number; x: number; y: number } | null = null;
  let isCustomPanning = false;

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      previousTouch = null;
      isCustomPanning = false;
      map.setDraggable(true);
      return;
    }

    const touch = event.touches[0];
    previousTouch = { identifier: touch.identifier, x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!previousTouch || event.touches.length !== 1) return;

    const touch = Array.from(event.touches).find(
      (currentTouch) => currentTouch.identifier === previousTouch?.identifier,
    );
    if (!touch) return;

    if (!isCustomPanning) {
      isCustomPanning = true;
      map.setDraggable(false);
    }

    const deltaX = touch.clientX - previousTouch.x;
    const deltaY = touch.clientY - previousTouch.y;
    const projection = map.getProjection();
    const centerPoint = projection.containerPointFromCoords(map.getCenter());
    const nextCenter = projection.coordsFromContainerPoint(
      new maps.Point(centerPoint.x - deltaX, centerPoint.y - deltaY),
    );
    map.setCenter(nextCenter);
    previousTouch = { identifier: touch.identifier, x: touch.clientX, y: touch.clientY };
    event.preventDefault();
    event.stopPropagation();
  };

  const finishTouch = (event: TouchEvent) => {
    if (!previousTouch) return;
    previousTouch = null;
    map.setDraggable(true);
    if (isCustomPanning) {
      isCustomPanning = false;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const listenerOptions = { capture: true, passive: false } as const;
  container.addEventListener("touchstart", handleTouchStart, listenerOptions);
  container.addEventListener("touchmove", handleTouchMove, listenerOptions);
  container.addEventListener("touchend", finishTouch, listenerOptions);
  container.addEventListener("touchcancel", finishTouch, listenerOptions);

  return () => {
    container.removeEventListener("touchstart", handleTouchStart, listenerOptions);
    container.removeEventListener("touchmove", handleTouchMove, listenerOptions);
    container.removeEventListener("touchend", finishTouch, listenerOptions);
    container.removeEventListener("touchcancel", finishTouch, listenerOptions);
    map.setDraggable(true);
  };
}

export function loadKakaoMaps(appKey: string): Promise<KakaoMapsApi> {
  return new Promise((resolve, reject) => {
    const resolveMaps = () => {
      if (!window.kakao) {
        reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."));
        return;
      }

      window.kakao.maps.load(() => {
        if (!window.kakao?.maps.services) {
          reject(new Error("카카오 장소 검색 SDK를 불러오지 못했습니다."));
          return;
        }

        resolve(window.kakao.maps);
      });
    };

    const existingScript = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.kakao) resolveMaps();
      else existingScript.addEventListener("load", resolveMaps, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
    script.addEventListener("load", resolveMaps, { once: true });
    script.addEventListener("error", () => reject(new Error("카카오 지도 SDK 요청에 실패했습니다.")), {
      once: true,
    });
    document.head.append(script);
  });
}

export function mountKakaoItineraryMap(
  maps: KakaoMapsApi,
  container: HTMLElement,
  stops: readonly ItineraryStop[],
) {
  const centerStop = stops[Math.floor(stops.length / 2)];
  const map = new maps.Map(container, {
    center: new maps.LatLng(centerStop.coordinates.latitude, centerStop.coordinates.longitude),
    level: 8,
  });
  map.setDraggable(true);
  map.setZoomable(true);
  const disableTouchPan = enableSingleTouchPan(maps, map, container);
  const bounds = new maps.LatLngBounds();
  const positions = stops.map(
    (stop) => new maps.LatLng(stop.coordinates.latitude, stop.coordinates.longitude),
  );
  const overlays: KakaoDrawable[] = [];
  let currentPositionOverlay: KakaoDrawable | null = null;
  let routeSegments: KakaoDrawable[] = [];

  const focusPosition = (position: KakaoLatLng, animate: boolean) => {
    if (animate) {
      map.setLevel(4, { animate: { duration: 450 } });
      map.panTo(position);
      return;
    }

    map.setLevel(4);
    map.setCenter(position);
  };

  positions.forEach((position, index) => {
    bounds.extend(position);
    const pin = document.createElement("span");
    pin.className = "map-pin";
    pin.style.setProperty("--pin-color", PIN_COLORS[index] ?? PIN_COLORS[1]);
    pin.textContent = index === 0 ? "" : String(index);
    pin.setAttribute("aria-hidden", "true");
    overlays.push(new maps.CustomOverlay({ map, position, content: pin, yAnchor: 0.5 }));
  });

  const drawRoute = (
    activeStopIndex: number,
    coordinates?: MapCoordinates,
    rerouted = false,
  ) => {
    routeSegments.forEach((segment) => segment.setMap(null));
    routeSegments = [];

    if (activeStopIndex === 0 && coordinates) {
      routeSegments.push(new maps.Polyline({
        map,
        path: [
          new maps.LatLng(coordinates.latitude, coordinates.longitude),
          positions[0],
        ],
        strokeWeight: 6,
        strokeColor: "#0b68ff",
        strokeOpacity: 0.95,
        strokeStyle: rerouted ? "shortdash" : "solid",
        clickable: false,
      }));
    }

    for (let destinationIndex = 1; destinationIndex < positions.length; destinationIndex += 1) {
      const isCompleted = destinationIndex < activeStopIndex;
      const isActive = destinationIndex === activeStopIndex;
      const start = isActive && rerouted && coordinates
        ? new maps.LatLng(coordinates.latitude, coordinates.longitude)
        : positions[destinationIndex - 1];
      routeSegments.push(new maps.Polyline({
        map,
        path: [start, positions[destinationIndex]],
        strokeWeight: isActive ? 6 : 5,
        strokeColor: isCompleted ? "#777777" : isActive ? "#0b68ff" : "#ffffff",
        strokeOpacity: isCompleted ? 0.48 : isActive ? 0.98 : 0.72,
        strokeStyle: isActive && rerouted ? "shortdash" : "solid",
        clickable: false,
      }));
    }
  };

  drawRoute(0);
  map.setBounds(bounds);

  const updateCurrentPosition = (coordinates: MapCoordinates, followCamera: boolean) => {
    const position = new maps.LatLng(coordinates.latitude, coordinates.longitude);
    currentPositionOverlay?.setMap(null);
    const marker = document.createElement("span");
    marker.className = "current-location-marker";
    marker.dataset.testid = "current-location-marker";
    marker.setAttribute("aria-hidden", "true");
    currentPositionOverlay = new maps.CustomOverlay({
      map,
      position,
      content: marker,
      yAnchor: 0.5,
    });
    if (followCamera) focusPosition(position, false);
  };

  const controller: KakaoItineraryMapController = {
    focusCurrentPosition(coordinates, animate) {
      updateCurrentPosition(coordinates, false);
      focusPosition(new maps.LatLng(coordinates.latitude, coordinates.longitude), animate);
    },
    focusFallbackDeparture(animate) {
      focusPosition(positions[0], animate);
    },
    updateCurrentPosition,
    updateRouteProgress(activeStopIndex, coordinates, rerouted) {
      drawRoute(activeStopIndex, coordinates, rerouted);
    },
  };

  return {
    controller,
    dispose() {
      disableTouchPan();
      currentPositionOverlay?.setMap(null);
      overlays.forEach((overlay) => overlay.setMap(null));
      routeSegments.forEach((segment) => segment.setMap(null));
    },
  };
}

import type { ItineraryStop } from "@/features/itineraries/itinerary";

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

export type KakaoItineraryMapController = {
  focusCurrentPosition(coordinates: MapCoordinates, animate: boolean): void;
  focusDeparture(animate: boolean): void;
};

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

      window.kakao.maps.load(() => resolve(window.kakao!.maps));
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
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
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

  const route = new maps.Polyline({
    map,
    path: positions,
    strokeWeight: 5,
    strokeColor: "#ffffff",
    strokeOpacity: 0.92,
    strokeStyle: "solid",
    clickable: false,
  });
  map.setBounds(bounds);

  const controller: KakaoItineraryMapController = {
    focusCurrentPosition(coordinates, animate) {
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
      focusPosition(position, animate);
    },
    focusDeparture(animate) {
      focusPosition(positions[0], animate);
    },
  };

  return {
    controller,
    dispose() {
      disableTouchPan();
      currentPositionOverlay?.setMap(null);
      overlays.forEach((overlay) => overlay.setMap(null));
      route.setMap(null);
    },
  };
}

"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import type { ItineraryStop } from "@/features/itineraries/itinerary";
import {
  type KakaoItineraryMapController,
  type MapCoordinates,
  loadKakaoMaps,
  mountKakaoItineraryMap,
} from "@/features/map/kakao-map";

type KakaoMapProps = {
  appKey?: string;
  onManualInteraction?: () => void;
  stops: readonly ItineraryStop[];
};

export type KakaoMapHandle = {
  focusCurrentPosition(coordinates: MapCoordinates): void;
  focusDeparture(): void;
  updateCurrentPosition(coordinates: MapCoordinates, followCamera: boolean): void;
  updateRouteProgress(
    activeStopIndex: number,
    coordinates?: MapCoordinates,
    rerouted?: boolean,
  ): void;
};

const PIN_COLORS = ["#ffffff", "#8f62f7", "#8f62f7", "#f78562", "#62aaf7"];

function toPreviewPoints(stops: readonly ItineraryStop[]) {
  const latitudes = stops.map((stop) => stop.coordinates.latitude);
  const longitudes = stops.map((stop) => stop.coordinates.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = maxLatitude - minLatitude || 1;
  const longitudeRange = maxLongitude - minLongitude || 1;

  return stops.map((stop) => ({
    x: 18 + ((stop.coordinates.longitude - minLongitude) / longitudeRange) * 64,
    y: 16 + (1 - (stop.coordinates.latitude - minLatitude) / latitudeRange) * 48,
  }));
}

function MapPreview({ onManualInteraction, stops }: KakaoMapProps) {
  const points = toPreviewPoints(stops);
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div
      className="map-preview"
      data-testid="map-preview"
      aria-label="지도 미리보기"
      onPointerDownCapture={onManualInteraction}
      onWheelCapture={onManualInteraction}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <path d="M-10 24 C18 6 35 39 112 11 M-8 61 C25 42 64 71 108 48 M12 108 C30 62 71 46 97 -8" />
        <path d="M-10 82 C29 66 45 91 110 72 M34 -8 C23 30 56 58 49 108" />
        <polyline points={path} className="map-preview-route" />
      </svg>
      {points.map((point, index) => (
        <span
          key={stops[index].id}
          className="map-pin absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            "--pin-color": PIN_COLORS[index] ?? PIN_COLORS[1],
          } as React.CSSProperties}
          aria-label={`${index + 1}번째 장소 ${stops[index].name}`}
        >
          {index === 0 ? "" : index}
        </span>
      ))}
      <p className="absolute top-1/3 left-1/2 -translate-x-1/2 text-[clamp(2rem,9vw,4.5rem)] font-bold tracking-[-0.05em] text-[#293e3b]/65">
        강릉
      </p>
      <span className="absolute top-[12%] right-4 rounded bg-white/80 px-2 py-1 text-[10px] font-semibold text-[#4b5a58]">
        지도 개발 미리보기
      </span>
    </div>
  );
}

export const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  { appKey, onManualInteraction, stops },
  ref,
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<KakaoItineraryMapController | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useImperativeHandle(ref, () => ({
    focusCurrentPosition(coordinates) {
      controllerRef.current?.focusCurrentPosition(
        coordinates,
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    },
    focusDeparture() {
      controllerRef.current?.focusFallbackDeparture(
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    },
    updateCurrentPosition(coordinates, followCamera) {
      controllerRef.current?.updateCurrentPosition(coordinates, followCamera);
    },
    updateRouteProgress(activeStopIndex, coordinates, rerouted) {
      controllerRef.current?.updateRouteProgress(activeStopIndex, coordinates, rerouted);
    },
  }), []);

  useEffect(() => {
    if (!appKey || !mapRef.current) return;

    let dispose: (() => void) | undefined;
    let isCancelled = false;

    loadKakaoMaps(appKey)
      .then((maps) => {
        if (!isCancelled && mapRef.current) {
          const mountedMap = mountKakaoItineraryMap(maps, mapRef.current, stops);
          controllerRef.current = mountedMap.controller;
          dispose = mountedMap.dispose;
          setMapReady(true);
        }
      })
      .catch(() => {
        if (!isCancelled) setLoadFailed(true);
      });

    return () => {
      isCancelled = true;
      controllerRef.current = null;
      dispose?.();
    };
  }, [appKey, stops]);

  if (!appKey || loadFailed) {
    return <MapPreview stops={stops} onManualInteraction={onManualInteraction} />;
  }

  return (
    <div
      ref={mapRef}
      className="kakao-map size-full touch-none"
      data-testid="kakao-map"
      data-map-ready={mapReady}
      aria-label="일정 지도"
      onPointerDownCapture={onManualInteraction}
      onWheelCapture={onManualInteraction}
    />
  );
});

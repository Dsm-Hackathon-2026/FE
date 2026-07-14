"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import type { Itinerary, ItineraryStop } from "@/features/itineraries/itinerary";
import { type KakaoMapHandle, KakaoMap, type RouteFollowStage } from "@/features/map/kakaoMap";

type MapScreenProps = {
  appKey?: string;
  itinerary: Itinerary;
  initialStopId?: string;
  workId: string;
};

type SheetSnap = "expanded" | "medium" | "collapsed";
type FollowStatus = "idle" | "locating" | RouteFollowStage | "location-unavailable" | "map-unavailable";

const SNAP_TOP: Record<SheetSnap, number> = {
  expanded: 10,
  medium: 46.25,
  collapsed: 76,
};

const STOP_COLORS = ["#ffffff", "#8f62f7", "#8f62f7", "#f78562", "#62aaf7"];

function findClosestSnap(topPercent: number): SheetSnap {
  let closest: SheetSnap = "medium";

  for (const [snap, top] of Object.entries(SNAP_TOP) as [SheetSnap, number][]) {
    if (Math.abs(top - topPercent) < Math.abs(SNAP_TOP[closest] - topPercent)) {
      closest = snap;
    }
  }

  return closest;
}

function SelectedPlaceCard({ stop, isHidden }: { stop: ItineraryStop; isHidden: boolean }) {
  if (!stop.imageSrc || !stop.imageAlt) return null;

  return (
    <article
      data-testid="selected-place-card"
      aria-hidden={isHidden}
      className="selected-place-card pointer-events-none absolute left-1/2 z-10 grid h-[84px] w-[calc(100%-40px)] max-w-[353px] -translate-x-1/2 grid-cols-[124px_minmax(0,1fr)] items-center gap-[13px] overflow-hidden rounded-[3px] text-white drop-shadow-[0_0_18px_rgba(0,0,0,0.25)]"
      style={{
        background:
          "linear-gradient(0deg, rgba(0, 0, 0, 0.51), rgba(0, 0, 0, 0.51)), linear-gradient(90deg, #c4c2cd 0%, #382424 100%)",
      }}
    >
      <div className="relative h-[84px] w-[124px] overflow-hidden rounded-[3px]">
        <Image src={stop.imageSrc} alt={stop.imageAlt} fill sizes="124px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <h2 className="w-full truncate text-[16px] leading-[19px] font-medium">{stop.name}</h2>
        <address className="w-[180px] max-w-full truncate text-center text-[10px] leading-3 font-medium not-italic text-[#aeaeae]">
          {stop.address}
        </address>
      </div>
    </article>
  );
}

export function MapScreen({ appKey, itinerary, initialStopId, workId }: MapScreenProps) {
  const initialStop = itinerary.stops.find((stop) => stop.id === initialStopId);
  const [followStatus, setFollowStatus] = useState<FollowStatus>("idle");
  const selectedStop = followStatus === "idle"
    ? initialStop ?? itinerary.stops.at(-1)!
    : itinerary.stops[0];
  const [snap, setSnap] = useState<SheetSnap>("medium");
  const mapRef = useRef<KakaoMapHandle>(null);
  const screenRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const dragStartRef = useRef<{ pointerY: number; topPercent: number } | null>(null);

  const followMessage = {
    idle: null,
    locating: "현재 위치를 확인하고 있어요",
    "current-location": "현재 위치에서 출발지로 이동할게요",
    departure: `출발지 · ${itinerary.stops[0].name}`,
    "location-unavailable": `현재 위치를 확인하지 못해 ${itinerary.stops[0].name}을 표시했어요`,
    "map-unavailable": "지도가 준비된 후 다시 시도해 주세요",
  }[followStatus];

  const finishDrag = (pointerId: number, pointerY: number, dragHandle: HTMLElement) => {
    const sheet = sheetRef.current;
    const screen = screenRef.current;
    if (!sheet || !screen || !dragStartRef.current) return;

    const movement = Math.abs(pointerY - dragStartRef.current.pointerY);
    const inlineTop = Number.parseFloat(sheet.style.getPropertyValue("--sheet-top"));
    const currentTop = Number.isNaN(inlineTop)
      ? (sheet.getBoundingClientRect().top / window.innerHeight) * 100
      : inlineTop;
    const nextSnap = findClosestSnap(currentTop);
    const destinationSnap = movement >= 6
      ? nextSnap
      : snap === "expanded" ? "medium" : "expanded";
    dragStartRef.current = null;
    if (dragHandle.hasPointerCapture(pointerId)) dragHandle.releasePointerCapture(pointerId);
    screen.removeAttribute("data-dragging");
    screen.style.setProperty("--sheet-top", `${SNAP_TOP[destinationSnap]}%`);
    screen.style.setProperty("--place-card-opacity", destinationSnap === "expanded" ? "0" : "1");
    setSnap(destinationSnap);
  };

  return (
    <main
      ref={screenRef}
      className="map-screen relative mx-auto h-dvh min-h-[640px] w-full max-w-3xl overflow-hidden bg-[#dfe9e5] text-white"
      data-testid="map-screen"
      style={{
        "--sheet-top": `${SNAP_TOP[snap]}%`,
        "--place-card-opacity": snap === "expanded" ? "0" : "1",
      } as React.CSSProperties}
    >
      <div className="absolute inset-0">
        <KakaoMap ref={mapRef} appKey={appKey} stops={itinerary.stops} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/45 to-transparent" />
      <Link
        href={`/detail/${workId}`}
        aria-label="작품 상세로 돌아가기"
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-2.5 z-20 flex size-11 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Image src="/back-icon.svg" alt="" width={24} height={24} priority />
      </Link>

      <SelectedPlaceCard stop={selectedStop} isHidden={snap === "expanded"} />

      <div
        aria-live="polite"
        data-testid="route-follow-status"
        className={`pointer-events-none absolute top-[max(4.25rem,calc(env(safe-area-inset-top)+3.25rem))] left-1/2 z-20 max-w-[calc(100%-40px)] -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-center text-[12px] leading-4 font-medium shadow-lg backdrop-blur-sm transition-opacity ${
          followMessage ? "opacity-100" : "opacity-0"
        }`}
      >
        {followMessage ?? ""}
      </div>

      <section
        ref={sheetRef}
        data-testid="itinerary-sheet"
        data-snap={snap}
        aria-labelledby="itinerary-title"
        className="itinerary-sheet absolute inset-x-0 z-30 flex flex-col overflow-hidden rounded-t-[50px] bg-black"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[-222px] left-[calc(50%-284.5px)] h-[561px] w-[557px] bg-[linear-gradient(180deg,rgba(196,194,205,0.26)_0%,rgba(56,36,36,0.26)_100%)] blur-[43.4px]"
        />
        <div
          className="relative z-10 touch-none px-5 pt-3 pb-2"
          onPointerDown={(event) => {
            const sheet = sheetRef.current;
            if (!sheet) return;
            dragStartRef.current = {
              pointerY: event.clientY,
              topPercent: (sheet.getBoundingClientRect().top / window.innerHeight) * 100,
            };
            screenRef.current?.setAttribute("data-dragging", "true");
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const start = dragStartRef.current;
            const sheet = sheetRef.current;
            const screen = screenRef.current;
            if (!start || !sheet || !screen) return;
            const nextTop = Math.min(
              82,
              Math.max(
                SNAP_TOP.expanded,
                start.topPercent + ((event.clientY - start.pointerY) / window.innerHeight) * 100,
              ),
            );
            const cardOpacity = Math.min(1, Math.max(0, (nextTop - SNAP_TOP.expanded) / 20));
            screen.style.setProperty("--sheet-top", `${nextTop}%`);
            screen.style.setProperty("--place-card-opacity", String(cardOpacity));
          }}
          onPointerUp={(event) => finishDrag(event.pointerId, event.clientY, event.currentTarget)}
          onPointerCancel={(event) => finishDrag(event.pointerId, event.clientY, event.currentTarget)}
        >
          <button
            type="button"
            aria-label={snap === "expanded" ? "일정 패널 접기" : "일정 패널 펼치기"}
            onClick={(event) => {
              if (event.detail === 0) {
                setSnap((current) => current === "expanded" ? "medium" : "expanded");
              }
            }}
            className="mx-auto block h-8 w-20 rounded focus-visible:outline-2 focus-visible:outline-white"
          />
        </div>

        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-[5px] sm:px-8">
          <h1 id="itinerary-title" className="sr-only">{itinerary.title}</h1>
          <ol className="relative ml-[10px] pl-[29px]" data-testid="itinerary-stop-list">
            <span
              data-testid="itinerary-timeline-line"
              aria-hidden="true"
              className="absolute top-[-12px] bottom-6 left-0 w-0.5 bg-[#838383]"
            />
            {itinerary.stops.map((stop, index) => (
              <li
                key={stop.id}
                className={`relative ${
                  index === 0 ? "pb-6" : stop.distanceToNext ? "pb-3" : ""
                }`}
              >
                <span
                  data-testid={`itinerary-marker-${index}`}
                  className={`absolute flex items-center justify-center rounded-full shadow-[0_0_2px_#000] ${
                    index === 0
                      ? "top-5 left-[-32px] size-2"
                      : "top-[15px] left-[-37px] size-[18px] text-[10px] leading-3 font-semibold text-white"
                  }`}
                  style={{ backgroundColor: STOP_COLORS[index] ?? STOP_COLORS[1] }}
                  aria-hidden="true"
                >
                  {index === 0 ? "" : index}
                </span>
                <article className="flex h-12 flex-col justify-center gap-[3px] rounded bg-[#393939] px-3">
                  <h2 className="truncate text-[16px] leading-[19px] font-semibold">{stop.name}</h2>
                  <p className="truncate text-[10px] leading-3 font-normal text-[#888888]">{stop.description}</p>
                </article>
                {stop.distanceToNext ? (
                  <p className="mt-3 text-[12px] leading-[14px] font-medium text-[#888888]">
                    {stop.distanceToNext}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="itinerary-actions relative z-10 px-5 sm:px-8">
          <button
            type="button"
            disabled={followStatus === "locating" || followStatus === "current-location"}
            onClick={async () => {
              setSnap("collapsed");
              setFollowStatus("locating");
              const result = await mapRef.current?.startRouteFollow(setFollowStatus);
              if (!result || result === "map-unavailable") setFollowStatus("map-unavailable");
              if (result === "location-unavailable") setFollowStatus("location-unavailable");
            }}
            className="h-[51px] w-full rounded-xl bg-[#0b68ff] text-[16px] leading-[19px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-70"
          >
            {followStatus === "locating"
              ? "현재 위치 확인 중..."
              : followStatus === "current-location"
                ? "출발지로 이동 중..."
                : followStatus === "departure" || followStatus === "location-unavailable"
                  ? `${itinerary.stops[0].name}에서 시작`
                  : "루트 따라가기"}
          </button>
        </div>
      </section>
    </main>
  );
}

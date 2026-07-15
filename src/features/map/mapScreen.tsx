"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LanguageSwitcher } from "@/components/languageSwitcher";
import type { Itinerary, ItineraryStop } from "@/features/itineraries/itinerary";
import type { MapCoordinates } from "@/features/map/kakao-map";
import { type KakaoMapHandle, KakaoMap } from "@/features/map/kakaoMap";
import {
  distanceBetweenMeters,
  distanceToSegmentMeters,
  findNextStopIndex,
  formatDistance,
  OFF_ROUTE_CONFIRMATION_COUNT,
  OFF_ROUTE_THRESHOLD_METERS,
} from "@/features/map/route-following";
import { useI18n } from "@/i18n/provider";

type MapScreenProps = {
  appKey?: string;
  itinerary: Itinerary;
  initialStopId?: string;
  planId: string;
  workId: string;
};

type SheetSnap = "expanded" | "medium" | "collapsed";
type FollowStatus =
  | "idle"
  | "locating"
  | "following"
  | "paused"
  | "rerouting"
  | "completed"
  | "location-unavailable"
;

type WakeLockSentinel = {
  release(): Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request(type: "screen"): Promise<WakeLockSentinel>;
  };
};

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

export function MapScreen({ appKey, itinerary, initialStopId, planId, workId }: MapScreenProps) {
  const { locale, t } = useI18n();
  const initialStop = itinerary.stops.find((stop) => stop.id === initialStopId);
  const [followStatus, setFollowStatus] = useState<FollowStatus>("idle");
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const selectedStop = followStatus === "idle"
    ? initialStop ?? itinerary.stops.at(-1)!
    : itinerary.stops[Math.min(activeStopIndex, itinerary.stops.length - 1)];
  const [snap, setSnap] = useState<SheetSnap>("medium");
  const mapRef = useRef<KakaoMapHandle>(null);
  const screenRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const dragStartRef = useRef<{ pointerY: number; topPercent: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<MapCoordinates | null>(null);
  const activeStopIndexRef = useRef(0);
  const followStatusRef = useRef<FollowStatus>("idle");
  const cameraFollowingRef = useRef(true);
  const reroutedRef = useRef(false);
  const offRouteCountRef = useRef(0);
  const rerouteTimerRef = useRef<number | null>(null);
  const voiceEnabledRef = useRef(false);
  const vibrationEnabledRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const updateFollowStatus = (status: FollowStatus) => {
    followStatusRef.current = status;
    setFollowStatus(status);
  };

  const announce = (message: string, vibrationPattern: number | number[] = 80) => {
    if (voiceEnabledRef.current && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = locale === "en" ? "en-US" : "ko-KR";
      window.speechSynthesis.speak(utterance);
    }
    if (vibrationEnabledRef.current && "vibrate" in navigator) {
      navigator.vibrate(vibrationPattern);
    }
  };

  const clearTracking = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (rerouteTimerRef.current !== null) {
      window.clearTimeout(rerouteTimerRef.current);
      rerouteTimerRef.current = null;
    }
  };

  const finishFollowing = () => {
    clearTracking();
    cameraFollowingRef.current = false;
    updateFollowStatus("completed");
    setDistanceToNext(null);
    announce(t("map.arrivedAll"), [100, 80, 180]);
  };

  const handlePosition = ({ coords }: GeolocationPosition) => {
    const coordinates = { latitude: coords.latitude, longitude: coords.longitude };
    lastPositionRef.current = coordinates;
    const previousIndex = activeStopIndexRef.current;
    const nextIndex = findNextStopIndex(itinerary.stops, previousIndex, coordinates);

    mapRef.current?.updateCurrentPosition(coordinates, cameraFollowingRef.current);

    if (nextIndex > previousIndex) {
      const arrivedStop = itinerary.stops[Math.min(nextIndex - 1, itinerary.stops.length - 1)];
      announce(t("map.arrived", { name: arrivedStop.name }), [90, 60, 90]);
      activeStopIndexRef.current = nextIndex;
      setActiveStopIndex(nextIndex);
      reroutedRef.current = false;
      offRouteCountRef.current = 0;
    }

    if (nextIndex >= itinerary.stops.length) {
      mapRef.current?.updateRouteProgress(nextIndex, coordinates);
      finishFollowing();
      return;
    }

    const target = itinerary.stops[nextIndex];
    setDistanceToNext(distanceBetweenMeters(coordinates, target.coordinates));

    if (nextIndex > 0 && !reroutedRef.current && coords.accuracy <= 100) {
      const segmentDistance = distanceToSegmentMeters(
        coordinates,
        itinerary.stops[nextIndex - 1].coordinates,
        target.coordinates,
      );
      offRouteCountRef.current = segmentDistance >= OFF_ROUTE_THRESHOLD_METERS
        ? offRouteCountRef.current + 1
        : 0;

      if (offRouteCountRef.current >= OFF_ROUTE_CONFIRMATION_COUNT) {
        reroutedRef.current = true;
        offRouteCountRef.current = 0;
        updateFollowStatus("rerouting");
        announce(t("map.rerouteSpeech"), [180, 80, 180]);
        rerouteTimerRef.current = window.setTimeout(() => {
          updateFollowStatus(cameraFollowingRef.current ? "following" : "paused");
          rerouteTimerRef.current = null;
        }, 1_400);
      }
    }

    mapRef.current?.updateRouteProgress(nextIndex, coordinates, reroutedRef.current);
    if (followStatusRef.current === "locating") {
      updateFollowStatus("following");
      announce(t("map.followStart", { name: target.name }));
    }
  };

  const startFollowing = () => {
    clearTracking();
    setSnap("collapsed");
    setActiveStopIndex(0);
    setDistanceToNext(null);
    activeStopIndexRef.current = 0;
    cameraFollowingRef.current = true;
    reroutedRef.current = false;
    offRouteCountRef.current = 0;
    updateFollowStatus("locating");

    if (!navigator.geolocation) {
      mapRef.current?.focusDeparture();
      updateFollowStatus("location-unavailable");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      () => {
        if (!lastPositionRef.current) {
          clearTracking();
          mapRef.current?.focusDeparture();
          updateFollowStatus("location-unavailable");
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
    );
  };

  const stopFollowing = () => {
    clearTracking();
    lastPositionRef.current = null;
    cameraFollowingRef.current = false;
    reroutedRef.current = false;
    activeStopIndexRef.current = 0;
    setActiveStopIndex(0);
    setDistanceToNext(null);
    mapRef.current?.updateRouteProgress(0);
    updateFollowStatus("idle");
  };

  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (rerouteTimerRef.current !== null) window.clearTimeout(rerouteTimerRef.current);
    void wakeLockRef.current?.release();
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    const shouldKeepAwake = ["following", "paused", "rerouting"].includes(followStatus);
    const requestWakeLock = async () => {
      const wakeLock = (navigator as WakeLockNavigator).wakeLock;
      if (!shouldKeepAwake || !wakeLock || document.visibilityState !== "visible") return;
      try {
        wakeLockRef.current = await wakeLock.request("screen");
      } catch {
        wakeLockRef.current = null;
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        void requestWakeLock();
      }
    };

    if (shouldKeepAwake) {
      void requestWakeLock();
      document.addEventListener("visibilitychange", handleVisibility);
    } else if (wakeLockRef.current) {
      void wakeLockRef.current.release();
      wakeLockRef.current = null;
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (!shouldKeepAwake && wakeLockRef.current) {
        void wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [followStatus]);

  const followMessage = {
    idle: null,
    locating: t("map.status.locating"),
    following: t("map.status.following"),
    paused: t("map.status.paused"),
    rerouting: t("map.status.rerouting"),
    completed: t("map.status.completed"),
    "location-unavailable": t("map.status.unavailable", { name: itinerary.stops[0].name }),
  }[followStatus];
  const nextStop = activeStopIndex < itinerary.stops.length
    ? itinerary.stops[activeStopIndex]
    : null;

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
        <KakaoMap
          ref={mapRef}
          appKey={appKey}
          stops={itinerary.stops}
          onManualInteraction={() => {
            if (
              cameraFollowingRef.current
              && ["following", "rerouting"].includes(followStatusRef.current)
            ) {
              cameraFollowingRef.current = false;
              updateFollowStatus("paused");
            }
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/45 to-transparent" />
      <Link
        href={`/detail/${workId}`}
        aria-label={t("map.backDetail")}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-2.5 z-20 flex size-11 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Image src="/back-icon.svg" alt="" width={24} height={24} priority />
      </Link>
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-3 z-20">
        <LanguageSwitcher />
      </div>

      <SelectedPlaceCard stop={selectedStop} isHidden={snap === "expanded"} />

      <div
        aria-live="polite"
        data-testid="route-follow-status"
        data-follow-status={followStatus}
        className={`absolute top-[max(4.25rem,calc(env(safe-area-inset-top)+3.25rem))] left-1/2 z-20 w-[calc(100%-40px)] max-w-[353px] -translate-x-1/2 rounded-2xl bg-black/80 px-4 py-3 text-[12px] leading-4 shadow-lg backdrop-blur-md transition-opacity ${
          followMessage ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="font-medium text-[#b9c0ca]">{followMessage ?? ""}</p>
        {nextStop && followStatus !== "idle" && followStatus !== "location-unavailable" ? (
          <div className="mt-1 flex items-end justify-between gap-3">
            <strong className="min-w-0 truncate text-[17px] leading-6 text-white">
              {t("map.next", { name: nextStop.name })}
            </strong>
            <span data-testid="distance-to-next" className="shrink-0 text-[17px] font-bold text-[#70a7ff]">
              {distanceToNext === null ? "--" : formatDistance(distanceToNext)}
            </span>
          </div>
        ) : null}
        {["following", "paused", "rerouting"].includes(followStatus) ? (
          <div className="mt-3 flex gap-2 border-t border-white/10 pt-2">
            <button
              type="button"
              aria-pressed={voiceEnabled}
              onClick={() => {
                const enabled = !voiceEnabled;
                voiceEnabledRef.current = enabled;
                setVoiceEnabled(enabled);
                if (enabled && "speechSynthesis" in window) {
                  const utterance = new SpeechSynthesisUtterance(t("map.voiceEnabledSpeech"));
                  utterance.lang = locale === "en" ? "en-US" : "ko-KR";
                  window.speechSynthesis.speak(utterance);
                }
              }}
              className={`min-h-9 flex-1 rounded-lg border text-[12px] font-semibold ${
                voiceEnabled ? "border-[#70a7ff] bg-[#0b68ff]/30 text-white" : "border-white/15 text-[#b9c0ca]"
              }`}
            >
              {t("map.voice", { state: voiceEnabled ? t("map.on") : t("map.off") })}
            </button>
            <button
              type="button"
              aria-pressed={vibrationEnabled}
              onClick={() => {
                const enabled = !vibrationEnabled;
                vibrationEnabledRef.current = enabled;
                setVibrationEnabled(enabled);
                if (enabled && "vibrate" in navigator) navigator.vibrate(80);
              }}
              className={`min-h-9 flex-1 rounded-lg border text-[12px] font-semibold ${
                vibrationEnabled ? "border-[#70a7ff] bg-[#0b68ff]/30 text-white" : "border-white/15 text-[#b9c0ca]"
              }`}
            >
              {t("map.vibration", { state: vibrationEnabled ? t("map.on") : t("map.off") })}
            </button>
          </div>
        ) : null}
      </div>

      {["following", "paused", "rerouting"].includes(followStatus) ? (
        <button
          type="button"
          aria-label={t("map.backToLocation")}
          onClick={() => {
            cameraFollowingRef.current = true;
            if (lastPositionRef.current) {
              mapRef.current?.focusCurrentPosition(lastPositionRef.current);
            }
            updateFollowStatus("following");
          }}
          className={`absolute right-5 z-20 flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            followStatus === "paused" ? "bg-[#0b68ff] text-white" : "bg-white text-[#20242a]"
          }`}
          style={{ bottom: `calc(${100 - SNAP_TOP[snap]}% + 16px)` }}
        >
          <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-current" />
          {t("map.myLocation")}
        </button>
      ) : null}

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
            aria-label={snap === "expanded" ? t("map.collapsePanel") : t("map.expandPanel")}
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
          <ol
            className="relative ml-[10px] flex flex-col gap-2 pl-[29px]"
            data-testid="itinerary-stop-list"
          >
            <span
              data-testid="itinerary-timeline-line"
              aria-hidden="true"
              className="absolute top-[-12px] bottom-6 left-0 w-0.5 bg-[#838383]"
            />
            {itinerary.stops.map((stop, index) => (
              <li
                key={stop.id}
                data-active={activeStopIndex === index && followStatus !== "idle"}
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
                <article className={`relative flex h-12 flex-col justify-center gap-[3px] rounded border px-3 transition-colors ${
                  stop.kind === "filming-location" ? "pr-12" : ""
                } ${
                  activeStopIndex === index && followStatus !== "idle"
                    ? "border-[#5f9bff] bg-[#17345f]"
                    : "border-transparent bg-[#393939]"
                }`}>
                  <h2 className="truncate text-[16px] leading-[19px] font-semibold">{stop.name}</h2>
                  <p className="truncate text-[10px] leading-3 font-normal text-[#888888]">{stop.description}</p>
                  {stop.kind === "filming-location" ? (
                    <Link
                      href={`/camera/${encodeURIComponent(workId)}?plan=${encodeURIComponent(planId)}&stop=${encodeURIComponent(stop.id)}`}
                      aria-label={t("map.visitPhoto", { name: stop.name })}
                      className="absolute top-1/2 right-1.5 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
                    >
                      <Image
                        src="/camera-icon.svg"
                        alt=""
                        width={24}
                        height={24}
                        data-testid="camera-icon"
                        aria-hidden="true"
                      />
                    </Link>
                  ) : null}
                </article>
                {stop.distanceToNext ? (
                  <p
                    data-testid={`itinerary-distance-${index}`}
                    aria-label={t("map.distanceNext", { name: stop.name, distance: stop.distanceToNext })}
                    className="mt-3 text-[12px] leading-[14px] font-medium text-[#888888]"
                  >
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
            disabled={followStatus === "locating"}
            onClick={() => {
              if (["following", "paused", "rerouting"].includes(followStatus)) {
                stopFollowing();
                return;
              }
              startFollowing();
            }}
            className="h-[51px] w-full rounded-xl bg-[#0b68ff] text-[16px] leading-[19px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-70"
          >
            {followStatus === "locating"
              ? t("map.locatingButton")
              : ["following", "paused", "rerouting"].includes(followStatus)
                ? t("map.stopFollowing")
                : followStatus === "completed"
                  ? t("map.followAgain")
                  : t("map.follow")}
          </button>
        </div>
      </section>
    </main>
  );
}

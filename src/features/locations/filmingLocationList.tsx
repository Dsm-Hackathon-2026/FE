"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isUnrecognizedAddressError, useRecommendRoute } from "@/api/routes";
import {
  createRecommendedItinerary,
  hasRoutePlan,
  readReusableRoutePlan,
  saveRoutePlan,
} from "@/features/itineraries/route-plan";
import {
  findRouteDepartureFromCurrentLocation,
  getAddressCandidates,
} from "@/features/map/kakao-map";
import { hasVisitRecordForStop } from "@/features/visits/visit-record";
import { useI18n } from "@/i18n/provider";

type FilmingLocation = {
  id: string;
  name: string;
  address: string;
  imageSrc: string;
  imageAlt: string;
  latitude: number;
  longitude: number;
};

type FilmingLocationListProps = {
  workId: string;
  workTitle: string;
  locations: readonly FilmingLocation[];
  appKey?: string;
};

export type GenerationStage = "locating" | "recommending" | "mapping";

const GENERATION_TARGET: Record<GenerationStage, number> = {
  locating: 28,
  recommending: 72,
  mapping: 94,
};

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function FilmingLocationList({
  workId,
  workTitle,
  locations,
  appKey,
}: FilmingLocationListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const recommendation = useRecommendRoute();
  const [pendingLocationId, setPendingLocationId] = useState<string | null>(null);
  const [generationStage, setGenerationStage] = useState<GenerationStage>("locating");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedLocationIds, setGeneratedLocationIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [visitedLocationIds, setVisitedLocationIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const pendingLocation = locations.find((location) => location.id === pendingLocationId);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const contentId = Number(workId);
      setGeneratedLocationIds(new Set(
        locations
          .filter((location) => hasRoutePlan(contentId, location.id))
          .map((location) => location.id),
      ));
      setVisitedLocationIds(new Set(
        locations
          .filter((location) => hasVisitRecordForStop(
            workId,
            `destination-${location.id}`,
          ))
          .map((location) => location.id),
      ));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [locations, workId]);

  useEffect(() => {
    if (!pendingLocationId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [pendingLocationId]);

  useEffect(() => {
    if (!pendingLocationId) return;
    const target = GENERATION_TARGET[generationStage];
    const interval = window.setInterval(() => {
      setGenerationProgress((current) => {
        if (current >= target) return current;
        return Math.min(target, current + Math.max(1, Math.ceil((target - current) * 0.12)));
      });
    }, 120);
    return () => window.clearInterval(interval);
  }, [generationStage, pendingLocationId]);

  const createRoute = async (location: FilmingLocation) => {
    if (!appKey) {
      setErrorMessage(t("route.mapConfigError"));
      return;
    }

    setPendingLocationId(location.id);
    setGenerationStage("locating");
    setGenerationProgress(0);
    setErrorMessage(null);

    try {
      const destinationCoordinates = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      const departure = await findRouteDepartureFromCurrentLocation(
        appKey,
        destinationCoordinates,
      );
      if (!departure) {
        setErrorMessage(t("route.noDeparture"));
        return;
      }

      const cachedItinerary = readReusableRoutePlan(
        Number(workId),
        location.id,
        departure,
      );
      if (cachedItinerary) {
        router.push(
          `/map/${encodeURIComponent(workId)}?plan=${encodeURIComponent(location.id)}`,
        );
        return;
      }

      const [startAddresses, destAddresses] = await Promise.all([
        getAddressCandidates(appKey, departure.coordinates, departure.address),
        getAddressCandidates(
          appKey,
          destinationCoordinates,
          location.address,
        ),
      ]);
      const resolvedDeparture = {
        ...departure,
        address: startAddresses[0] ?? departure.address,
      };
      setGenerationStage("recommending");
      const route = await recommendation.mutateAsync({
        startAddresses,
        destAddresses,
        startTime: getCurrentTime(),
      });
      setGenerationStage("mapping");
      const itinerary = await createRecommendedItinerary({
        appKey,
        contentId: Number(workId),
        departure: resolvedDeparture,
        destination: {
          id: location.id,
          spotId: Number(location.id),
          name: location.name,
          address: location.address,
          imageSrc: location.imageSrc,
          imageAlt: location.imageAlt,
          coordinates: destinationCoordinates,
        },
        recommendation: route,
      });

      setGenerationProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      saveRoutePlan(Number(workId), location.id, itinerary);
      setGeneratedLocationIds((current) => new Set(current).add(location.id));
      router.push(
        `/map/${encodeURIComponent(workId)}?plan=${encodeURIComponent(location.id)}`,
      );
    } catch (error) {
      setErrorMessage(
        isUnrecognizedAddressError(error)
          ? t("route.addressError")
          : t("route.createError"),
      );
    } finally {
      setPendingLocationId(null);
    }
  };

  return (
    <section className="mt-11" aria-labelledby="filming-locations-title">
      <h2
        id="filming-locations-title"
        className="text-[22px] leading-8 font-bold tracking-[-0.025em] text-white"
      >
        {t("detail.scenePlaces", { title: workTitle })}
      </h2>

      <ol className="mt-6 flex flex-col gap-8" data-testid="filming-location-list">
        {locations.map((location) => {
          const isGenerated = generatedLocationIds.has(location.id);
          const isVisited = visitedLocationIds.has(location.id);
          const status = isVisited ? t("route.visited") : isGenerated ? t("route.generated") : null;
          return (
            <li key={location.id}>
              <button
                type="button"
                aria-label={isVisited
                  ? t("route.viewVisited", { name: location.name })
                  : isGenerated
                    ? t("route.viewSaved", { name: location.name })
                    : t("route.create", { name: location.name })}
                disabled={pendingLocationId !== null}
                onClick={() => createRoute(location)}
                className="grid w-full grid-cols-[124px_minmax(0,1fr)] items-center gap-3.5 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-60 sm:grid-cols-[144px_minmax(0,1fr)] sm:gap-5"
              >
                <div className="relative h-[84px] overflow-hidden rounded-[3px]">
                  <Image
                    src={location.imageSrc}
                    alt={location.imageAlt}
                    fill
                    sizes="(min-width: 640px) 144px, 124px"
                    className="object-cover"
                  />
                </div>

                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg leading-6 font-semibold tracking-[-0.02em] text-white">
                      {location.name}
                    </h3>
                    <address className="mt-1.5 truncate text-[13px] leading-5 font-normal not-italic text-[#a6a6a6]">
                      {location.address}
                    </address>
                  </div>
                  {status ? (
                  <span
                    data-testid={isVisited
                      ? `visit-completed-${location.id}`
                      : `route-generated-${location.id}`}
                    className="whitespace-nowrap text-[13px] leading-5 font-semibold text-[#8b8b8b]"
                  >
                    {status}
                  </span>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
      {errorMessage ? (
        <p role="alert" className="mt-6 text-sm text-[#ff8f8f]">{errorMessage}</p>
      ) : null}
      {pendingLocation ? (
        <RouteGenerationOverlay
          destinationName={pendingLocation.name}
          progress={generationProgress}
          stage={generationStage}
        />
      ) : null}
    </section>
  );
}

export function RouteGenerationOverlay({
  destinationName,
  progress,
  stage,
}: {
  destinationName: string;
  progress: number;
  stage: GenerationStage;
}) {
  const { t } = useI18n();
  const generationMessage = {
    locating: t("route.stage.locating"),
    recommending: t("route.stage.recommending"),
    mapping: t("route.stage.mapping"),
  }[stage];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-generation-title"
      aria-describedby="route-generation-status"
      data-testid="route-generation-overlay"
      className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-black/85 px-7 backdrop-blur-[6px]"
    >
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div
          data-testid="route-generation-icon"
          className="relative size-[176px]"
          aria-hidden="true"
        >
          <Image
            src="/landing-icon.svg"
            alt=""
            fill
            sizes="176px"
            className="opacity-[0.16]"
          />
          <div
            data-testid="route-generation-icon-fill"
            className="absolute inset-x-0 bottom-0 overflow-hidden transition-[height] duration-500 ease-out motion-reduce:transition-none"
            style={{ height: `${progress}%` }}
          >
            <Image
              src="/landing-icon.svg"
              alt=""
              width={176}
              height={176}
              className="absolute bottom-0 left-0 max-w-none"
            />
            <span className="absolute inset-x-5 top-0 h-px bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
          </div>
        </div>

        <div
          role="progressbar"
          aria-label={t("route.progressLabel")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          data-testid="route-generation-progress"
          className="mt-5 text-[34px] leading-10 font-light tracking-[-0.04em] text-white tabular-nums"
        >
          {progress}
          <span className="ml-0.5 text-lg text-[#888]">%</span>
        </div>
        <h2
          id="route-generation-title"
          className="mt-5 text-[22px] leading-8 font-semibold tracking-[-0.025em] text-white"
        >
          {t("route.creatingTitle", { destination: destinationName }).split("\n").map((line, index) => <span key={line}>{index > 0 ? <br /> : null}{line}</span>)}
        </h2>
        <p
          id="route-generation-status"
          role="status"
          aria-live="polite"
          className="mt-3 min-h-10 text-sm leading-5 text-[#a9a9a9]"
        >
          {generationMessage}
        </p>
      </div>
    </div>
  );
}

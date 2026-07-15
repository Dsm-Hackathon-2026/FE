"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isUnrecognizedAddressError, useRecommendPilgrimageRoute } from "@/api/routes";
import {
  createPilgrimageItinerary,
  hasRoutePlan,
  readReusableRoutePlan,
  saveRoutePlan,
} from "@/features/itineraries/route-plan";
import type { RegionalCourse } from "@/features/locations/regional-course";
import {
  type GenerationStage,
  RouteGenerationOverlay,
} from "@/features/locations/filmingLocationList";
import {
  findRouteDepartureFromCurrentLocation,
  getAddressCandidates,
} from "@/features/map/kakao-map";
import { useI18n } from "@/i18n/provider";

type RegionalCourseListProps = {
  appKey?: string;
  courses: readonly RegionalCourse[];
  workId: string;
};

const GENERATION_TARGET: Record<GenerationStage, number> = {
  locating: 28,
  recommending: 72,
  mapping: 94,
};

function currentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function RegionalCourseList({ appKey, courses, workId }: RegionalCourseListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const recommendation = useRecommendPilgrimageRoute();
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [generationStage, setGenerationStage] = useState<GenerationStage>("locating");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedCourseIds, setGeneratedCourseIds] = useState<ReadonlySet<string>>(new Set());
  const pendingCourse = courses.find((course) => course.id === pendingCourseId);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setGeneratedCourseIds(new Set(
        courses.filter((course) => hasRoutePlan(Number(workId), course.id)).map((course) => course.id),
      ));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [courses, workId]);

  useEffect(() => {
    if (!pendingCourseId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [pendingCourseId]);

  useEffect(() => {
    if (!pendingCourseId) return;
    const target = GENERATION_TARGET[generationStage];
    const interval = window.setInterval(() => {
      setGenerationProgress((current) => current >= target
        ? current
        : Math.min(target, current + Math.max(1, Math.ceil((target - current) * 0.12))));
    }, 120);
    return () => window.clearInterval(interval);
  }, [generationStage, pendingCourseId]);

  if (courses.length === 0) return null;

  const createCourse = async (course: RegionalCourse) => {
    if (!appKey) {
      setErrorMessage(t("route.mapConfigError"));
      return;
    }

    const representativeSpot = course.spots[0];
    if (!representativeSpot) return;
    setPendingCourseId(course.id);
    setGenerationStage("locating");
    setGenerationProgress(0);
    setErrorMessage(null);

    try {
      const departure = await findRouteDepartureFromCurrentLocation(appKey, {
        latitude: representativeSpot.latitude,
        longitude: representativeSpot.longitude,
      });
      if (!departure) {
        setErrorMessage(t("route.noDeparture"));
        return;
      }

      const cachedItinerary = readReusableRoutePlan(Number(workId), course.id, departure);
      if (cachedItinerary) {
        router.push(`/map/${encodeURIComponent(workId)}?plan=${encodeURIComponent(course.id)}`);
        return;
      }

      const startAddresses = await getAddressCandidates(
        appKey,
        departure.coordinates,
        departure.address,
      );
      const resolvedDeparture = {
        ...departure,
        address: startAddresses[0] ?? departure.address,
      };
      setGenerationStage("recommending");
      const route = await recommendation.mutateAsync({
        startAddress: resolvedDeparture.address,
        startTime: currentTime(),
        spotIds: course.spots.map((spot) => spot.spotId),
      });
      setGenerationStage("mapping");
      const itinerary = await createPilgrimageItinerary({
        appKey,
        contentId: Number(workId),
        courseId: course.id,
        departure: resolvedDeparture,
        destinations: course.spots.map((spot) => ({
          id: String(spot.spotId),
          spotId: spot.spotId,
          name: spot.name,
          address: spot.address,
          imageSrc: spot.imageUrl,
          imageAlt: t("detail.imageAlt", { name: spot.name }),
          coordinates: { latitude: spot.latitude, longitude: spot.longitude },
        })),
        recommendation: route,
      });

      setGenerationProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      saveRoutePlan(Number(workId), course.id, itinerary);
      setGeneratedCourseIds((current) => new Set(current).add(course.id));
      router.push(`/map/${encodeURIComponent(workId)}?plan=${encodeURIComponent(course.id)}`);
    } catch (error) {
      setErrorMessage(isUnrecognizedAddressError(error)
        ? t("course.addressError")
        : t("course.createError"));
    } finally {
      setPendingCourseId(null);
    }
  };

  return (
    <section className="mt-11" aria-labelledby="regional-courses-title">
      <h2
        id="regional-courses-title"
        className="text-[22px] leading-8 font-bold tracking-[-0.025em] text-white"
      >
        {t("course.title")}
      </h2>
      <ol className="mt-6 flex flex-col gap-8" data-testid="regional-course-list">
        {courses.map((course) => {
          const isGenerated = generatedCourseIds.has(course.id);
          const isPending = pendingCourseId === course.id;
          return (
            <li key={course.id} className="border-b border-[#262626] pb-6">
              <button
                type="button"
                aria-busy={isPending}
                aria-label={t("course.accessible", { region: course.region, action: isGenerated ? t("course.view") : t("course.create"), count: course.spots.length })}
                disabled={pendingCourseId !== null}
                onClick={() => createCourse(course)}
                className="grid w-full grid-cols-[124px_minmax(0,1fr)] items-center gap-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-60 sm:grid-cols-[144px_minmax(0,1fr)] sm:gap-5"
              >
                <CourseMosaic course={course} />
                <span className="min-w-0">
                  <span className="block truncate text-lg leading-6 font-semibold tracking-[-0.02em] text-white">
                    {t("course.name", { region: course.region })}
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-5 text-[#a6a6a6]">
                    {t("course.summary", { count: course.spots.length })}
                  </span>
                  <span className="mt-2 block text-sm leading-5 font-semibold text-white">
                    {isPending ? t("course.creating", { region: course.region }) : isGenerated ? t("course.viewButton") : t("course.createButton")}
                    {!isPending ? <span aria-hidden="true"> →</span> : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {errorMessage ? <p role="alert" className="mt-5 text-sm text-[#ff8f8f]">{errorMessage}</p> : null}
      {pendingCourse ? (
        <RouteGenerationOverlay
          destinationName={t("course.name", { region: pendingCourse.region })}
          progress={generationProgress}
          stage={generationStage}
        />
      ) : null}
    </section>
  );
}

function CourseMosaic({ course }: { course: RegionalCourse }) {
  const [first, second, third] = course.spots;
  if (!first || !second || !third) return null;

  return (
    <span className="grid h-[84px] grid-cols-[2fr_1fr] gap-0.5 overflow-hidden rounded-[3px] bg-black sm:h-24">
      <span className="relative">
        <Image src={first.imageUrl} alt="" fill sizes="96px" className="object-cover" />
      </span>
      <span className="grid grid-rows-2 gap-0.5">
        {[second, third].map((spot) => (
          <span key={spot.spotId} className="relative">
            <Image src={spot.imageUrl} alt="" fill sizes="48px" className="object-cover" />
          </span>
        ))}
      </span>
    </span>
  );
}

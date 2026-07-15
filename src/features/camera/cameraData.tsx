"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { ItineraryStop } from "@/features/itineraries/itinerary";
import { readRoutePlan } from "@/features/itineraries/route-plan";
import { CameraScreen } from "@/features/camera/cameraScreen";
import { useI18n } from "@/i18n/provider";

type CameraDataProps = {
  contentId: number;
  planId?: string;
  stopId?: string;
};

export function CameraData({ contentId, planId, stopId }: CameraDataProps) {
  const { t } = useI18n();
  const [stop, setStop] = useState<ItineraryStop | null>();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const itinerary = planId ? readRoutePlan(contentId, planId) : null;
      setStop(itinerary?.stops.find((item) => item.id === stopId) ?? null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [contentId, planId, stopId]);

  if (stop === undefined) {
    return <CameraState role="status">{t("camera.loading")}</CameraState>;
  }

  if (!stop || !planId || !stopId || stop.kind !== "filming-location") {
    return (
      <CameraState role="alert">
        {t("camera.missing")}
        <Link
          href={`/detail/${contentId}`}
          className="mt-4 min-h-11 text-sm underline underline-offset-4"
        >
          {t("camera.backDetail")}
        </Link>
      </CameraState>
    );
  }

  const spotId = stop.spotId ?? Number(stop.id.replace(/^destination-/, ""));
  if (!Number.isSafeInteger(spotId) || spotId <= 0) {
    return (
      <CameraState role="alert">
        {t("camera.invalidSpot")}
        <Link
          href={`/detail/${contentId}`}
          className="mt-4 min-h-11 text-sm underline underline-offset-4"
        >
          {t("camera.backDetail")}
        </Link>
      </CameraState>
    );
  }

  return (
    <CameraScreen
      planId={planId}
      spotId={spotId}
      stop={stop}
      workId={String(contentId)}
    />
  );
}

function CameraState({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "status" | "alert";
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-black px-6 text-center text-white">
      <div role={role} className="flex flex-col items-center text-sm text-[#aeaeae]">
        {children}
      </div>
    </main>
  );
}

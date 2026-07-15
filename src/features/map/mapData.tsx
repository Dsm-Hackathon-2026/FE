"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Itinerary } from "@/features/itineraries/itinerary";
import { readRoutePlan } from "@/features/itineraries/route-plan";
import { MapScreen } from "@/features/map/mapScreen";
import { useI18n } from "@/i18n/provider";

type MapDataProps = {
  appKey?: string;
  contentId: number;
  planId?: string;
};

export function MapData({ appKey, contentId, planId }: MapDataProps) {
  const { t } = useI18n();
  const [itinerary, setItinerary] = useState<Itinerary | null>();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItinerary(planId ? readRoutePlan(contentId, planId) : null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [contentId, planId]);

  if (itinerary === undefined) {
    return <MapState role="status">{t("map.loading")}</MapState>;
  }

  if (!itinerary || !planId) {
    return (
      <main className="grid min-h-dvh place-items-center bg-black px-6 text-center text-white">
        <div>
          <p role="alert" className="text-sm text-[#aeaeae]">
            {t("map.missing")}
          </p>
          <Link
            href={`/detail/${contentId}`}
            className="mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            {t("map.chooseAgain")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <MapScreen
      appKey={appKey}
      itinerary={itinerary}
      initialStopId={itinerary.stops.findLast((stop) => stop.kind === "filming-location")?.id}
      planId={planId}
      workId={String(contentId)}
    />
  );
}

function MapState({ children, role }: { children: string; role: "status" | "alert" }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-black px-6 text-white">
      <p role={role} className="text-sm text-[#aeaeae]">{children}</p>
    </main>
  );
}

import { notFound } from "next/navigation";

import { GOBLIN_GANGNEUNG_ITINERARY } from "@/features/itineraries/itinerary";
import { MapScreen } from "@/features/map/mapScreen";

type MapPageProps = {
  params: Promise<{ workId: string }>;
  searchParams: Promise<{ location?: string | string[] }>;
};

export default async function MapPage({ params, searchParams }: MapPageProps) {
  const [{ workId }, query] = await Promise.all([params, searchParams]);

  if (workId !== "goblin") notFound();

  const initialStopId = typeof query.location === "string" ? query.location : undefined;

  return (
    <MapScreen
      appKey={process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}
      itinerary={GOBLIN_GANGNEUNG_ITINERARY}
      initialStopId={initialStopId}
      workId={workId}
    />
  );
}

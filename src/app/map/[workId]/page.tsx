import { notFound } from "next/navigation";

import { MapData } from "@/features/map/mapData";

type MapPageProps = {
  params: Promise<{ workId: string }>;
  searchParams: Promise<{ plan?: string | string[] }>;
};

export default async function MapPage({ params, searchParams }: MapPageProps) {
  const [{ workId }, query] = await Promise.all([params, searchParams]);
  const contentId = Number(workId);

  if (!Number.isSafeInteger(contentId) || contentId <= 0) notFound();

  const planId = typeof query.plan === "string" ? query.plan : undefined;

  return (
    <MapData
      appKey={process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}
      contentId={contentId}
      planId={planId}
    />
  );
}

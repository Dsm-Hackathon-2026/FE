import { notFound } from "next/navigation";

import { WorkDetailScreen } from "@/features/detail/workDetailScreen";

type WorkDetailPageProps = {
  params: Promise<{ workId: string }>;
};

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { workId } = await params;
  const contentId = Number(workId);

  if (!Number.isSafeInteger(contentId) || contentId <= 0) notFound();

  return (
    <WorkDetailScreen
      appKey={process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}
      contentId={contentId}
    />
  );
}

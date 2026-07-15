import { notFound } from "next/navigation";

import { CameraData } from "@/features/camera/cameraData";

type CameraPageProps = {
  params: Promise<{ workId: string }>;
  searchParams: Promise<{ plan?: string | string[]; stop?: string | string[] }>;
};

export default async function CameraPage({ params, searchParams }: CameraPageProps) {
  const [{ workId }, query] = await Promise.all([params, searchParams]);
  const contentId = Number(workId);
  if (!Number.isSafeInteger(contentId) || contentId <= 0) notFound();

  const planId = typeof query.plan === "string" ? query.plan : undefined;
  const stopId = typeof query.stop === "string" ? query.stop : undefined;

  return <CameraData contentId={contentId} planId={planId} stopId={stopId} />;
}

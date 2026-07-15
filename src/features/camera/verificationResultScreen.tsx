import Image from "next/image";
import Link from "next/link";

import type { VerificationResultResponse } from "@/api/verifications/type";

type VerificationResultScreenProps = {
  mapHref: string;
  result: VerificationResultResponse;
};

export function VerificationResultScreen({
  mapHref,
  result,
}: VerificationResultScreenProps) {
  return (
    <main
      data-testid="verification-result-screen"
      className="min-h-dvh bg-[#050505] bg-[radial-gradient(circle_at_50%_0%,#29272a_0%,#171517_26%,#050505_66%)] text-white"
    >
      <div className="mx-auto w-full max-w-3xl px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
        <Link
          href={mapHref}
          aria-label="지도 일정으로 돌아가기"
          className="flex size-12 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Image src="/back-icon.svg" alt="" width={32} height={32} priority />
        </Link>

        <h1 className="sr-only">{result.spotName} 방문 인증 결과</h1>
        <div className="mt-8 flex flex-col gap-8 sm:mt-10 sm:gap-10">
          <VerificationImage
            alt={`${result.spotName} 작품 속 명장면`}
            label={`${result.spotName} 드라마 명장면`}
            priority
            src={result.sceneImageUrl}
            testId="scene-image"
          />
          <VerificationImage
            alt={`${result.spotName}에서 내가 찍은 인증 사진`}
            label={`${result.spotName} 내가 찍은 명장면`}
            src={result.verificationImageUrl}
            testId="verification-image"
          />
        </div>
      </div>
    </main>
  );
}

function VerificationImage({
  alt,
  label,
  priority = false,
  src,
  testId,
}: {
  alt: string;
  label: string;
  priority?: boolean;
  src: string;
  testId: string;
}) {
  return (
    <section aria-label={label}>
      <h2 className="text-[20px] leading-7 font-bold tracking-[-0.025em] sm:text-[22px]">
        {label}
      </h2>
      <div className="relative mt-3 aspect-[1.35/1] overflow-hidden rounded-xl bg-[#171717]">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 768px) 704px, calc(100vw - 40px)"
          data-testid={testId}
          className="object-cover"
        />
      </div>
    </section>
  );
}

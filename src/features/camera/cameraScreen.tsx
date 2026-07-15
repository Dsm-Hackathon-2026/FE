"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { ItineraryStop } from "@/features/itineraries/itinerary";
import { saveVisitRecord } from "@/features/visits/visit-record";

type CameraScreenProps = {
  planId: string;
  stop: ItineraryStop;
  workId: string;
};

type CameraStatus =
  | "requesting"
  | "ready"
  | "captured"
  | "saved"
  | "unsupported"
  | "denied"
  | "error";

type FacingMode = "environment" | "user";

const CAMERA_STATUS_MESSAGE: Partial<Record<CameraStatus, string>> = {
  requesting: "카메라를 준비하고 있어요",
  unsupported: "이 브라우저에서는 카메라를 사용할 수 없습니다.",
  denied: "촬영하려면 브라우저의 카메라 권한을 허용해 주세요.",
  error: "카메라를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

export function CameraScreen({ planId, stop, workId }: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("requesting");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [restartSequence, setRestartSequence] = useState(0);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const mapHref = `/map/${encodeURIComponent(workId)}?plan=${encodeURIComponent(planId)}`;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      stopCamera();
      setStatus("requesting");
      setSaveError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setStatus(
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "denied"
            : "error",
        );
      }
    };

    void startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [facingMode, restartSequence]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
      setStatus("error");
      return;
    }

    const maximumEdge = 1_280;
    const scale = Math.min(1, maximumEdge / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      setStatus("error");
      return;
    }

    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.82));
    stopCamera();
    setStatus("captured");
  };

  const retakePhoto = () => {
    setPhotoDataUrl(null);
    setRestartSequence((sequence) => sequence + 1);
  };

  const recordVisit = () => {
    if (!photoDataUrl) return;

    try {
      saveVisitRecord({
        workId,
        planId,
        stopId: stop.id,
        stopName: stop.name,
        capturedAt: new Date().toISOString(),
        photoDataUrl,
      });
      setSaveError(null);
      setStatus("saved");
    } catch {
      setSaveError("사진을 저장할 공간이 부족합니다. 다시 촬영해 주세요.");
    }
  };

  return (
    <main
      data-testid="camera-screen"
      className="mx-auto flex h-dvh min-h-[640px] w-full max-w-3xl flex-col overflow-hidden bg-black px-0 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white"
    >
      <section
        aria-label={`${stop.name} 방문 촬영 화면`}
        className="relative min-h-0 flex-1 overflow-hidden rounded-[44px] bg-[#171717]"
      >
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          data-testid="camera-preview"
          className={`size-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
        />
        {photoDataUrl ? (
          <Image
            src={photoDataUrl}
            alt={`${stop.name}에서 촬영한 방문 사진`}
            fill
            unoptimized
            data-testid="captured-photo"
            className="object-cover"
          />
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />
        <Link
          href={mapHref}
          aria-label="지도 일정으로 돌아가기"
          className="absolute top-5 left-4 z-20 flex size-12 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Image src="/back-icon.svg" alt="" width={32} height={32} priority />
        </Link>

        {CAMERA_STATUS_MESSAGE[status] ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/45 px-8 text-center backdrop-blur-[2px]">
            <div>
              <p role={status === "requesting" ? "status" : "alert"} className="text-sm leading-6 text-white">
                {CAMERA_STATUS_MESSAGE[status]}
              </p>
              {["denied", "error"].includes(status) ? (
                <button
                  type="button"
                  onClick={() => setRestartSequence((sequence) => sequence + 1)}
                  className="mt-4 min-h-11 rounded-full border border-white/40 px-5 text-sm font-semibold"
                >
                  다시 시도
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="relative mx-5 mt-4 h-[76px] shrink-0 rounded-[22px] border border-white/25 bg-[linear-gradient(135deg,#211b1d_0%,#161515_52%,#242022_100%)] px-5">
        {status === "ready" ? (
          <>
            <button
              type="button"
              aria-label="사진 촬영"
              onClick={capturePhoto}
              className="absolute top-0 left-1/2 z-20 flex size-[70px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-black shadow-[0_8px_0_rgba(0,0,0,0.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <span className="size-[58px] rounded-full border-2 border-[#56464b] bg-white" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="전면 후면 카메라 전환"
              onClick={() => setFacingMode((mode) => mode === "environment" ? "user" : "environment")}
              className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-black bg-[#393939] text-[#9b9b9b] shadow-[0_0_0_1px_rgba(255,255,255,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <FlipCameraIcon />
            </button>
          </>
        ) : status === "captured" ? (
          <div className="flex h-full items-center gap-3">
            <button
              type="button"
              onClick={retakePhoto}
              className="min-h-12 flex-1 rounded-xl border border-white/25 text-sm font-semibold text-white"
            >
              다시 촬영
            </button>
            <button
              type="button"
              onClick={recordVisit}
              className="min-h-12 flex-[1.3] rounded-xl bg-white text-sm font-bold text-black"
            >
              방문 기록 저장
            </button>
          </div>
        ) : status === "saved" ? (
          <div className="flex h-full items-center gap-4">
            <div className="min-w-0 flex-1">
              <strong className="block text-[16px]">방문 기록을 저장했어요</strong>
              <p className="mt-1 truncate text-[12px] text-[#9d999a]">{stop.name}</p>
            </div>
            <Link
              href={mapHref}
              className="flex min-h-12 shrink-0 items-center rounded-xl bg-white px-5 text-sm font-bold text-black"
            >
              지도 보기
            </Link>
          </div>
        ) : (
          <p className="grid h-full place-items-center text-center text-[13px] leading-5 text-[#8f8b8c]">
            카메라가 준비되면 촬영 버튼이 표시됩니다.
          </p>
        )}
        {saveError ? (
          <p role="alert" className="absolute inset-x-4 bottom-2 text-center text-[11px] text-[#ff9a9a]">
            {saveError}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function FlipCameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M20.8 9.2A8.5 8.5 0 0 0 6.2 11M6.2 11V6.8M6.2 11h4.2M7.2 18.8A8.5 8.5 0 0 0 21.8 17M21.8 17v4.2M21.8 17h-4.2" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

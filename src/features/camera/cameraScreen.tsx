"use client";

import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { LanguageSwitcher } from "@/components/languageSwitcher";
import { spotKeys } from "@/api/spots";
import { useVerifyVisit } from "@/api/verifications";
import type { VerificationResultResponse } from "@/api/verifications/type";
import { VerificationResultScreen } from "@/features/camera/verificationResultScreen";
import type { ItineraryStop } from "@/features/itineraries/itinerary";
import { getCurrentCoordinates } from "@/features/map/kakao-map";
import { saveVisitRecord } from "@/features/visits/visit-record";
import { useI18n, type Translate } from "@/i18n/provider";

type CameraScreenProps = {
  planId: string;
  spotId: number;
  stop: ItineraryStop;
  workId: string;
};

type CameraStatus =
  | "requesting"
  | "ready"
  | "captured"
  | "verifying"
  | "unsupported"
  | "denied"
  | "error";

type FacingMode = "environment" | "user";

export function CameraScreen({ planId, spotId, stop, workId }: CameraScreenProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const verification = useVerifyVisit();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("requesting");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [restartSequence, setRestartSequence] = useState(0);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResultResponse | null>(null);
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

  const verifyPhoto = async () => {
    if (!photoDataUrl) return;

    try {
      setStatus("verifying");
      setSaveError(null);
      const [coordinates, image] = await Promise.all([
        getCurrentCoordinates(),
        photoDataUrlToFile(photoDataUrl),
      ]);
      const result = await verification.mutateAsync({
        spotId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        image,
      });

      if (result.status === "FAIL") {
        setStatus("captured");
        setSaveError(t("camera.tooFar"));
        return;
      }

      try {
        saveVisitRecord({
          workId,
          planId,
          stopId: stop.id,
          stopName: stop.name,
          capturedAt: result.verifiedAt,
          photoDataUrl,
        });
      } catch {
        // 서버 인증은 완료되었으므로 브라우저 보조 기록 실패가 결과를 막지 않는다.
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: spotKeys.list(Number(workId)) }),
        queryClient.invalidateQueries({
          queryKey: spotKeys.detail(Number(workId), spotId),
        }),
      ]);
      setVerificationResult(result);
    } catch (error) {
      setStatus("captured");
      setSaveError(verificationErrorMessage(error, t));
    }
  };

  if (verificationResult) {
    return <VerificationResultScreen mapHref={mapHref} result={verificationResult} />;
  }

  return (
    <main
      data-testid="camera-screen"
      className="mx-auto flex h-dvh min-h-[640px] w-full max-w-3xl flex-col overflow-hidden bg-black px-0 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white"
    >
      <section
        aria-label={t("camera.screen", { name: stop.name })}
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
            alt={t("camera.photoAlt", { name: stop.name })}
            fill
            unoptimized
            data-testid="captured-photo"
            className="object-cover"
          />
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />
        <Link
          href={mapHref}
          aria-label={t("camera.backMap")}
          className="absolute top-5 left-4 z-20 flex size-12 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Image src="/back-icon.svg" alt="" width={32} height={32} priority />
        </Link>

        <div className="absolute top-7 right-5 z-20"><LanguageSwitcher /></div>

        {cameraStatusMessage(status, t) ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/45 px-8 text-center backdrop-blur-[2px]">
            <div>
              <p
                role={["requesting", "verifying"].includes(status) ? "status" : "alert"}
                className="text-sm leading-6 text-white"
              >
                {cameraStatusMessage(status, t)}
              </p>
              {["denied", "error"].includes(status) ? (
                <button
                  type="button"
                  onClick={() => setRestartSequence((sequence) => sequence + 1)}
                  className="mt-4 min-h-11 rounded-full border border-white/40 px-5 text-sm font-semibold"
                >
                  {t("common.retry")}
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
              aria-label={t("camera.capture")}
              onClick={capturePhoto}
              className="absolute top-0 left-1/2 z-20 flex size-[70px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-black shadow-[0_8px_0_rgba(0,0,0,0.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <span className="size-[58px] rounded-full border-2 border-[#56464b] bg-white" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={t("camera.flip")}
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
              {t("camera.retake")}
            </button>
            <button
              type="button"
              onClick={() => void verifyPhoto()}
              className="min-h-12 flex-[1.3] rounded-xl bg-white text-sm font-bold text-black"
            >
              {t("camera.verify")}
            </button>
          </div>
        ) : (
          <p className="grid h-full place-items-center text-center text-[13px] leading-5 text-[#8f8b8c]">
            {t("camera.readyHint")}
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

async function photoDataUrlToFile(photoDataUrl: string) {
  const response = await fetch(photoDataUrl);
  if (!response.ok) throw new Error("촬영한 사진을 준비하지 못했습니다.");
  const blob = await response.blob();
  return new File([blob], `visit-${Date.now()}.jpg`, {
    type: blob.type || "image/jpeg",
  });
}

function verificationErrorMessage(error: unknown, t: Translate) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (code === 1) return t("camera.locationPermission");
    if (code === 2 || code === 3) return t("camera.locationError");
  }
  return t("camera.verifyError");
}

function cameraStatusMessage(status: CameraStatus, t: Translate) {
  const messages: Partial<Record<CameraStatus, string>> = {
    requesting: t("camera.requesting"),
    verifying: t("camera.verifying"),
    unsupported: t("camera.unsupported"),
    denied: t("camera.denied"),
    error: t("camera.error"),
  };
  return messages[status];
}

function FlipCameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M20.8 9.2A8.5 8.5 0 0 0 6.2 11M6.2 11V6.8M6.2 11h4.2M7.2 18.8A8.5 8.5 0 0 0 21.8 17M21.8 17v4.2M21.8 17h-4.2" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

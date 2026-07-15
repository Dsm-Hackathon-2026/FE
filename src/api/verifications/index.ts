import { useMutation } from "@tanstack/react-query";

import {
  apiRequest,
  buildQuery,
  invalidResponse,
  isRecord,
  readNumber,
  readString,
} from "@/api/client";

import type {
  VerificationResultResponse,
  VerificationStatus,
  VerifyVisitRequest,
} from "./type";

function parseStatus(value: string): VerificationStatus {
  if (value !== "SUCCESS" && value !== "FAIL") throw invalidResponse("status");
  return value;
}

export async function verifyVisit({
  spotId,
  latitude,
  longitude,
  image,
}: VerifyVisitRequest): Promise<VerificationResultResponse> {
  const formData = new FormData();
  formData.set("image", image);
  const value = await apiRequest(
    `/verifications${buildQuery({ spotId, latitude, longitude })}`,
    { method: "POST", body: formData },
  );
  if (!isRecord(value)) throw invalidResponse();
  return {
    verificationId: readNumber(value, "verificationId"),
    spotId: readNumber(value, "spotId"),
    spotName: readString(value, "spotName"),
    contentTitle: readString(value, "contentTitle"),
    sceneImageUrl: readString(value, "sceneImageUrl"),
    verificationImageUrl: readString(value, "verificationImageUrl"),
    status: parseStatus(readString(value, "status")),
    verifiedAt: readString(value, "verifiedAt"),
  };
}

export function useVerifyVisit() {
  return useMutation({ mutationFn: verifyVisit });
}

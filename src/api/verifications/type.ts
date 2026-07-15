export type VerificationStatus = "SUCCESS" | "FAIL";

export interface VerifyVisitRequest {
  spotId: number;
  latitude: number;
  longitude: number;
  image: File;
}

export interface VerificationResultResponse {
  verificationId: number;
  spotId: number;
  spotName: string;
  contentTitle: string;
  sceneImageUrl: string;
  verificationImageUrl: string;
  status: VerificationStatus;
  verifiedAt: string;
}

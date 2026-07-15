export interface SpotListItemResponse {
  spotId: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl: string;
  verified: boolean;
}

export interface SpotListResponse {
  content: SpotListItemResponse[];
  totalElements: number;
}

export interface SpotDetailResponse {
  spotId: number;
  contentId: number;
  contentTitle: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl: string;
  verificationImageUrl: string | null;
}

export type ItineraryStopKind =
  | "station"
  | "restaurant"
  | "cafe"
  | "attraction"
  | "filming-location";

export type ItineraryStop = {
  id: string;
  order: number;
  name: string;
  description: string;
  address: string;
  imageSrc?: string;
  imageAlt?: string;
  kind: ItineraryStopKind;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distanceToNext?: string;
};

export type Itinerary = {
  id: string;
  title: string;
  stops: readonly ItineraryStop[];
};

// 백엔드 일정 API가 연결되기 전 화면과 지도 어댑터를 검증하기 위한 fixture다.
export const GOBLIN_GANGNEUNG_ITINERARY: Itinerary = {
  id: "goblin-gangneung-day-1",
  title: "도깨비 강릉 성지순례",
  stops: [
    {
      id: "gangneung-station",
      order: 0,
      name: "강릉역",
      description: "여행 시작",
      address: "강원특별자치도 강릉시 용지로 176",
      kind: "station",
      coordinates: { latitude: 37.7641, longitude: 128.8996 },
    },
    {
      id: "gangneung-sashimi",
      order: 1,
      name: "강릉 활어 횟집",
      description: "로컬 맛집",
      address: "강원특별자치도 강릉시 창해로 451",
      kind: "restaurant",
      coordinates: { latitude: 37.7953, longitude: 128.9182 },
      distanceToNext: "88m",
    },
    {
      id: "dessert-cafe",
      order: 2,
      name: "디저트 카페",
      description: "로컬 맛집",
      address: "강원특별자치도 강릉시 해안로 517",
      kind: "cafe",
      coordinates: { latitude: 37.8054, longitude: 128.9087 },
      distanceToNext: "328m",
    },
    {
      id: "ojukheon",
      order: 3,
      name: "오죽헌",
      description: "관광 장소",
      address: "강원특별자치도 강릉시 율곡로3139번길 24",
      kind: "attraction",
      coordinates: { latitude: 37.7793, longitude: 128.878 },
      distanceToNext: "328m",
    },
    {
      id: "yeongjin-beach-1",
      order: 4,
      name: "강릉 영진 해변",
      description: "드라마 명장면 장소",
      address: "강원특별자치도 강릉시 주문진읍 해안로 1609",
      imageSrc: "/gangneung-yeongjin-beach.png",
      imageAlt: "바다를 향해 이어진 강릉 영진 해변 방파제",
      kind: "filming-location",
      coordinates: { latitude: 37.8691, longitude: 128.8486 },
    },
  ],
};

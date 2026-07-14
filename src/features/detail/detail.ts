export type FilmingLocation = {
  id: string;
  name: string;
  address: string;
  imageSrc: string;
  imageAlt: string;
};

export type WorkDetail = {
  id: string;
  title: string;
  description: string;
  posterSrc: string;
  metadata: readonly string[];
  filmingLocations: readonly FilmingLocation[];
};

const GOBLIN_LOCATIONS = [
  {
    id: "yeongjin-beach-1",
    name: "강릉 영진 해변",
    address: "강원특별자치도 강릉시 주문진읍 해안로 1609",
    imageSrc: "/gangneung-yeongjin-beach.png",
    imageAlt: "바다를 향해 이어진 강릉 영진 해변 방파제",
  },
  {
    id: "yeongjin-beach-2",
    name: "강릉 영진 해변",
    address: "강원특별자치도 강릉시 주문진읍 해안로 1609",
    imageSrc: "/gangneung-yeongjin-beach.png",
    imageAlt: "푸른 바다와 강릉 영진 해변 방파제",
  },
  {
    id: "yeongjin-beach-3",
    name: "강릉 영진 해변",
    address: "강원특별자치도 강릉시 주문진읍 해안로 1609",
    imageSrc: "/gangneung-yeongjin-beach.png",
    imageAlt: "강릉 영진 해변의 잔잔한 수평선과 방파제",
  },
] as const satisfies readonly FilmingLocation[];

export const GOBLIN_DETAIL: WorkDetail = {
  id: "goblin",
  title: "도깨비",
  description:
    "불멸의 삶을 끝내기 위해 인간 신부가 필요한 도깨비(공유). 그의 앞에 ‘내가 도깨비 신부’라고 주장하는, 죽었어야 할 운명의 소녀 지은탁(김고은)이 나타나며 벌어지는 신비로운 낭만 설화. 기묘한 동거를 시작한 저승사자(이동욱)와의 브로맨스도 볼 수 있는 작품입니다.",
  posterSrc: "/famous-drama-1.png",
  metadata: ["2016", "드라마", "한국"],
  filmingLocations: GOBLIN_LOCATIONS,
};

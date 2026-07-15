import type { SpotListItemResponse } from "@/api/spots/type";

export type RegionalCourse = {
  id: string;
  region: string;
  spots: readonly SpotListItemResponse[];
};

const REGION_ALIASES = new Map([
  ["서울특별시", "서울"], ["부산광역시", "부산"], ["대구광역시", "대구"],
  ["인천광역시", "인천"], ["광주광역시", "광주"], ["대전광역시", "대전"],
  ["울산광역시", "울산"], ["세종특별자치시", "세종"],
  ["강원특별자치도", "강원"], ["경기도", "경기"], ["충청북도", "충북"],
  ["충청남도", "충남"], ["전북특별자치도", "전북"], ["전라북도", "전북"],
  ["전라남도", "전남"], ["경상북도", "경북"], ["경상남도", "경남"],
  ["제주특별자치도", "제주"],
]);

const REGION_SLUGS = new Map([
  ["서울", "seoul"], ["부산", "busan"], ["제주", "jeju"], ["강원", "gangwon"],
  ["경기", "gyeonggi"], ["인천", "incheon"],
]);

const DEMO_SPOT_IDS = new Map<string, readonly number[]>([["1:서울", [24, 25, 26]]]);

export function regionFromAddress(address: string) {
  const firstToken = address.trim().split(/\s+/)[0];
  if (!firstToken) return null;
  return REGION_ALIASES.get(firstToken)
    ?? firstToken.replace(/(특별자치도|특별자치시|광역시|특별시|도)$/, "");
}

function selectCourseSpots(
  contentId: number,
  region: string,
  spots: readonly SpotListItemResponse[],
) {
  const preferredIds = DEMO_SPOT_IDS.get(`${contentId}:${region}`);
  if (!preferredIds) return spots.slice(0, 3);

  const spotsById = new Map(spots.map((spot) => [spot.spotId, spot]));
  const preferred = preferredIds.flatMap((spotId) => {
    const spot = spotsById.get(spotId);
    return spot ? [spot] : [];
  });
  return preferred.length >= 3 ? preferred : spots.slice(0, 3);
}

export function buildRegionalCourses(
  contentId: number,
  spots: readonly SpotListItemResponse[],
): RegionalCourse[] {
  const grouped = new Map<string, SpotListItemResponse[]>();
  for (const spot of spots) {
    const region = regionFromAddress(spot.address);
    if (!region) continue;
    const group = grouped.get(region) ?? [];
    group.push(spot);
    grouped.set(region, group);
  }

  return [...grouped.entries()].flatMap(([region, regionalSpots]) => {
    if (regionalSpots.length < 3) return [];
    const slug = REGION_SLUGS.get(region) ?? encodeURIComponent(region);
    return [{
      id: `region-${slug}`,
      region,
      spots: selectCourseSpots(contentId, region, regionalSpots),
    }];
  });
}

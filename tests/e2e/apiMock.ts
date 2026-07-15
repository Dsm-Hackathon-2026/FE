import type { Page, Route } from "@playwright/test";

const description =
  "불멸의 삶을 끝내기 위해 인간 신부가 필요한 도깨비. 그의 앞에 도깨비 신부라고 주장하는 소녀가 나타나며 벌어지는 이야기이며 저승사자와의 기묘한 동거도 시작됩니다. 서로 다른 운명을 지닌 인물들이 만나 오랜 시간 이어진 비밀과 인연을 하나씩 마주합니다.";

const spots = [
  [1, "강릉역", "강원특별자치도 강릉시 용지로 176", 37.7641, 128.8996],
  [2, "강릉 활어 횟집", "강원특별자치도 강릉시 창해로 451", 37.7953, 128.9182],
  [3, "디저트 카페", "강원특별자치도 강릉시 해안로 517", 37.8054, 128.9087],
  [4, "오죽헌", "강원특별자치도 강릉시 율곡로3139번길 24", 37.7793, 128.878],
  [5, "강릉 영진 해변", "강원특별자치도 강릉시 주문진읍 해안로 1609", 37.8691, 128.8486],
] as const;

function content(index: number, contentType = "DRAMA") {
  const isOdd = index % 2 === 1;
  return {
    contentId: index,
    title: isOdd ? "도깨비" : "이 사랑 통역되나요?",
    contentType,
    thumbnailUrl: isOdd ? "/famous-drama-1.png" : "/famous-drama-2.png",
  };
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

export async function mockBackendApi(page: Page) {
  await page.route("**/backend-api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/backend-api/, "");
    const type = path.split("/")[2] ?? "DRAMA";

    if (/^\/contents\/[^/]+\/popular$/.test(path)) {
      return json(route, Array.from({ length: 10 }, (_, index) => ({
        ...content(index + 1, type),
        viewCount: 128 - index,
      })));
    }

    if (/^\/contents\/[^/]+\/(recommended|most-visited)$/.test(path)) {
      const contents = Array.from({ length: 8 }, (_, index) => content(index + 1, type));
      return json(route, { content: contents, limit: 8, totalElements: 8, last: true });
    }

    if (path === "/contents/search") {
      const keyword = url.searchParams.get("keyword");
      const contents = keyword === "도깨비"
        ? [1, 3, 5, 7].map((id) => content(id))
        : [];
      return json(route, { content: contents, page: 0, size: 10, totalElements: contents.length, last: true });
    }

    if (path === "/contents/1") {
      return json(route, {
        ...content(1),
        description,
        releaseYear: 2016,
        country: "한국",
      });
    }

    if (path === "/spots/1") {
      const content = spots.map(([spotId, name, address, latitude, longitude]) => ({
        spotId,
        name,
        address,
        latitude,
        longitude,
        imageUrl: "/gangneung-yeongjin-beach.png",
        verified: spotId === 5,
      }));
      return json(route, { content, totalElements: content.length });
    }

    if (path === "/verifications" && route.request().method() === "POST") {
      return json(route, {
        verificationId: 101,
        spotId: Number(url.searchParams.get("spotId")),
        spotName: "강릉 영진 해변",
        contentTitle: "도깨비",
        sceneImageUrl: "/gangneung-yeongjin-beach.png",
        verificationImageUrl: "/monthly-destination.png",
        status: "SUCCESS",
        verifiedAt: "2026-07-15T10:30:00Z",
      });
    }

    if (path === "/routes/recommended" && route.request().method() === "POST") {
      return json(route, {
        status: 200,
        meta: { start_place: "강릉역", destination: "강릉 영진 해변" },
        course_concept: "강릉역에서 시작하는 명장면 여행",
        timeline: [
          {
            time: "13:00 ~ 13:30",
            place: "강릉역",
            activity: "추천 일정 출발",
            address: "강원 강릉시 용지로 176",
            latitude: 37.7641,
            longitude: 128.8996,
          },
          {
            time: "15:30 ~ 16:30",
            place: "풍년건어물",
            activity: "지역 건어물 가게 방문",
            address: "강원특별자치도 강릉시 주문진읍 해안로 1753-1",
            latitude: 37.8841,
            longitude: 128.8291,
          },
          {
            time: "16:30 ~ 17:30",
            place: "다경횟집",
            activity: "지역 맛집에서 식사",
            address: "강원특별자치도 강릉시 주문진읍 해안로 1759",
            latitude: 37.8843,
            longitude: 128.8293,
          },
          {
            time: "17:30 ~ 18:30",
            place: "오드커피",
            activity: "로컬 카페에서 휴식",
            address: "강원특별자치도 강릉시 주문진읍 해안로 1597",
            latitude: 37.8685,
            longitude: 128.8492,
          },
          {
            time: "18:30 ~ 19:00",
            place: "강릉 영진 해변",
            activity: "최종 목적지 도착 및 명장면 장소 방문",
            address: "강원 강릉시 주문진읍 해안로 1609",
            latitude: 37.8691,
            longitude: 128.8486,
          },
        ],
      });
    }

    return json(route, { status: 404, message: "테스트 API 응답이 없습니다." }, 404);
  });
}

export async function failFirstRecommendedRouteForUnrecognizedAddress(page: Page) {
  let shouldFail = true;

  await page.route("**/backend-api/routes/recommended", async (route) => {
    if (!shouldFail || route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    shouldFail = false;
    await json(route, {
      status: 400,
      message: "출발지 주소 또는 도착지 주소를 인식할 수 없습니다. 정확한 주소를 입력해 주세요.",
    }, 400);
  });
}

export async function seedRecommendedRoutePlan(page: Page) {
  const plan = {
    version: 2,
    contentId: 1,
    destinationId: "5",
    itinerary: {
      id: "recommended-1-5",
      title: "강릉 명장면 AI 추천 일정",
      stops: [
        ["departure", "강릉역", "여행 시작", "강원특별자치도 강릉시 용지로 176", "station", 37.7641, 128.8996],
        ["recommendation-1", "풍년건어물", "지역 건어물 가게 방문", "강원특별자치도 강릉시 주문진읍 해안로 1753-1", "attraction", 37.8841, 128.8291],
        ["recommendation-2", "다경횟집", "지역 맛집에서 식사", "강원특별자치도 강릉시 주문진읍 해안로 1759", "restaurant", 37.8843, 128.8293],
        ["recommendation-3", "오드커피", "로컬 카페에서 휴식", "강원특별자치도 강릉시 주문진읍 해안로 1597", "cafe", 37.8685, 128.8492],
        ["destination-5", "강릉 영진 해변", "여정의 마지막 명장면 장소", "강원특별자치도 강릉시 주문진읍 해안로 1609", "filming-location", 37.8691, 128.8486],
      ].map(([id, name, description, address, kind, latitude, longitude], order) => ({
        id,
        order,
        name,
        description,
        address,
        kind,
        coordinates: { latitude, longitude },
        ...(id === "destination-5"
          ? {
              imageSrc: "/gangneung-yeongjin-beach.png",
              imageAlt: "강릉 영진 해변 전경",
            }
          : {}),
      })),
    },
  };

  await page.addInitScript((routePlan) => {
    sessionStorage.setItem("seongdeok:route-plan:1:5", JSON.stringify(routePlan));
  }, plan);
}

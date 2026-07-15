import { expect, test } from "@playwright/test";

import { failFirstRecommendedRouteForUnrecognizedAddress, mockBackendApi } from "./apiMock";

test.beforeEach(async ({ page }) => {
  await mockBackendApi(page);
});

test("애플리케이션 셸과 제품 메타데이터를 제공한다", async ({ page, request }) => {
  const runtimeErrors: string[] = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("성덕순례");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/landing-icon.svg",
  );
  const iconResponse = await request.get("/landing-icon.svg");
  expect(iconResponse.ok()).toBe(true);
  expect(await iconResponse.text()).toContain(
    '<rect width="200" height="200" rx="36" fill="#000000"/>',
  );
  await expect(page.getByRole("heading", { level: 1, name: "성덕순례" })).toBeVisible();
  await expect(page.getByTestId("home-screen")).toBeVisible();
  await expect(page.getByTestId("home-screen")).toHaveCSS(
    "background-image",
    /screen-glow\.svg/,
  );
  const landingIntro = page.getByTestId("landing-intro");
  await expect(landingIntro).toBeVisible();
  await expect(landingIntro).toHaveCSS("animation-name", "landing-intro-exit");
  await expect(landingIntro).toHaveCSS("animation-duration", "0.52s");
  await expect(landingIntro).toHaveCSS("animation-delay", "1.5s");
  const landingBrand = page.getByTestId("landing-brand");
  await expect(landingBrand).toHaveCSS("animation-name", "landing-brand-in");
  await expect(landingBrand).toHaveCSS("animation-duration", "0.46s");
  await expect(landingBrand).toHaveCSS("animation-delay", "0.08s");
  const landingFeature = page.getByTestId("landing-feature");
  await expect(landingFeature).toHaveCSS("animation-name", "landing-feature-in");
  await expect(landingFeature).toHaveCSS("animation-duration", "0.52s");
  await expect(landingFeature).toHaveCSS("animation-delay", "0.18s");
  const landingIcon = page.getByRole("img", { name: "성덕순례" });
  await expect(landingIcon).toBeVisible();
  await expect(landingIcon).toHaveCSS("width", "200px");
  await expect(landingIcon).toHaveCSS("height", "200px");
  await expect(landingIntro).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(page.locator("body")).toHaveCSS(
    "font-family",
    '"Pretendard Variable", Pretendard, sans-serif',
  );
  await expect(page.getByText("나의 최애 드라마를")).toBeVisible();
  await expect(page.getByText("직접 만나는 순간.")).toBeVisible();
  const promotionBanner = page.getByRole("img", {
    name: "이달의 여행지, 강릉 연진 해변",
  });
  await expect(promotionBanner).toBeVisible();

  const iconBox = await page.getByTestId("landing-brand-frame").boundingBox();
  const viewport = page.viewportSize();

  if (!iconBox || !viewport) {
    throw new Error("랜딩 아이콘 또는 브라우저 뷰포트의 크기를 확인할 수 없습니다.");
  }

  expect(iconBox.x + iconBox.width / 2).toBeCloseTo(viewport.width / 2, 0);
  expect(iconBox.y + iconBox.height / 2).toBeCloseTo(viewport.height / 2, 0);

  await page.setViewportSize({ width: 390, height: 844 });

  const mobileIconBox = await page.getByTestId("landing-brand-frame").boundingBox();

  if (!mobileIconBox) {
    throw new Error("모바일 뷰포트에서 랜딩 아이콘의 크기를 확인할 수 없습니다.");
  }

  expect(mobileIconBox.x + mobileIconBox.width / 2).toBeCloseTo(390 / 2, 0);
  expect(mobileIconBox.y + mobileIconBox.height / 2).toBeCloseTo(844 / 2, 0);

  await expect(promotionBanner).toHaveCSS("width", "268px");
  await expect(promotionBanner).toHaveCSS("height", "84px");

  await expect(landingIntro).toBeHidden({ timeout: 3_000 });
  const headerLogo = page.getByTestId("header-logo");
  await expect(headerLogo).toBeVisible();
  await expect(headerLogo).toHaveCSS("width", "93px");
  await expect(headerLogo).toHaveCSS("height", "32px");
  const searchLink = page.getByRole("link", { name: "검색" });
  await expect(searchLink).toBeVisible();
  await expect(searchLink).toHaveCSS("width", "44px");
  await expect(searchLink).toHaveCSS("height", "44px");
  const searchIcon = page.getByTestId("search-icon");
  await expect(searchIcon).toHaveCSS("width", "24px");
  await expect(searchIcon).toHaveCSS("height", "24px");
  const filterGroup = page.getByRole("group", { name: "작품 유형 필터" });
  await expect(filterGroup).toBeVisible();
  const dramaFilter = page.getByRole("button", { name: "드라마" });
  const movieFilter = page.getByRole("button", { name: "영화" });
  await expect(dramaFilter).toHaveAttribute("aria-pressed", "true");
  await expect(movieFilter).toHaveAttribute("aria-pressed", "false");
  await expect(dramaFilter).toHaveCSS(
    "font-family",
    '"Pretendard Variable", Pretendard, sans-serif',
  );
  await expect(dramaFilter).toHaveCSS("font-size", "16px");
  await expect(movieFilter).toHaveCSS("color", "rgb(174, 174, 174)");
  const filterIndicator = page.getByTestId("filter-indicator");
  await expect(filterIndicator).toHaveCSS("width", "72px");

  const activeFilterLabelBox = await dramaFilter.locator("[data-filter-label]").boundingBox();
  const filterIndicatorBox = await filterIndicator.boundingBox();

  if (!activeFilterLabelBox || !filterIndicatorBox) {
    throw new Error("선택된 필터 글자와 밑줄의 간격을 확인할 수 없습니다.");
  }

  expect(filterIndicatorBox.y - (activeFilterLabelBox.y + activeFilterLabelBox.height)).toBe(7);

  const headerBox = await page.locator("header").boundingBox();
  const filterBox = await filterGroup.boundingBox();

  if (!headerBox || !filterBox) {
    throw new Error("헤더 또는 작품 유형 필터의 위치를 확인할 수 없습니다.");
  }

  expect(filterBox.y - (headerBox.y + headerBox.height)).toBe(20);

  await movieFilter.click();
  await expect(movieFilter).toHaveAttribute("aria-pressed", "true");
  await expect(dramaFilter).toHaveAttribute("aria-pressed", "false");
  await dramaFilter.click();
  const famousTitle = page.getByRole("heading", {
    level: 2,
    name: "명장면이 있는 인기 드라마",
  });
  await expect(famousTitle).toBeVisible();
  await expect(famousTitle).toHaveCSS("font-size", "20px");
  await expect(famousTitle).toHaveCSS(
    "font-family",
    '"Pretendard Variable", Pretendard, sans-serif',
  );
  const famousList = page.getByTestId("famous-list");
  const famousTitleBox = await famousTitle.boundingBox();
  const famousListBox = await famousList.boundingBox();

  if (!famousTitleBox || !famousListBox) {
    throw new Error("인기 드라마 제목 또는 목록의 간격을 확인할 수 없습니다.");
  }

  expect(famousTitleBox.y - (filterBox.y + filterBox.height)).toBe(28);
  expect(famousListBox.y - (famousTitleBox.y + famousTitleBox.height)).toBe(20);
  await expect(famousList.getByRole("listitem")).toHaveCount(10);
  const firstPoster = page.getByRole("img", { name: "1위 도깨비 포스터" });
  const secondPoster = page.getByRole("img", { name: "2위 이 사랑 통역되나요? 포스터" });
  await expect(firstPoster).toHaveCSS("width", "126px");
  await expect(firstPoster).toHaveCSS("height", "168px");
  await expect(secondPoster).toHaveCSS(
    "width",
    "105px",
  );
  await expect(secondPoster).toHaveCSS(
    "height",
    "168px",
  );
  await expect(page.getByTestId("famous-rank-1")).toHaveCSS(
    "font-family",
    '"Pretendard Variable", Pretendard, sans-serif',
  );
  await expect(page.getByTestId("famous-rank-1")).toHaveCSS("font-size", "120px");
  await page.evaluate(() => document.fonts.ready);
  const firstRankBox = await page.getByTestId("famous-rank-1").boundingBox();

  if (!firstRankBox) {
    throw new Error("첫 번째 인기 드라마 순위 숫자의 크기를 확인할 수 없습니다.");
  }

  expect(firstRankBox.width).toBeCloseTo(32, 0);
  expect(firstRankBox.height).toBeCloseTo(86, 0);
  for (let rank = 1; rank <= 10; rank += 1) {
    await expect(famousList.getByRole("listitem").nth(rank - 1)).toHaveCSS(
      "column-gap",
      "20px",
    );
  }
  const famousScrollMetrics = await famousList.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(famousScrollMetrics.scrollWidth).toBeGreaterThan(famousScrollMetrics.clientWidth);

  await famousList.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect.poll(() => famousList.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

  const recommendedTitle = page.getByRole("heading", { level: 2, name: "추천 드라마" });
  const recommendedList = page.getByTestId("recommended-dramas-list");
  const popularSceneTitle = page.getByRole("heading", {
    level: 2,
    name: "지금 가장 많이 가는 명장면 드라마",
  });
  const popularSceneList = page.getByTestId("popular-scene-dramas-list");
  await expect(recommendedTitle).toHaveCSS("font-size", "20px");
  await expect(recommendedTitle).toHaveCSS("font-weight", "700");
  await expect(recommendedTitle).toHaveCSS(
    "font-family",
    '"Pretendard Variable", Pretendard, sans-serif',
  );
  await expect(recommendedList.getByRole("listitem")).toHaveCount(8);
  await expect(popularSceneList.getByRole("listitem")).toHaveCount(8);
  const recommendedPosters = recommendedList.getByRole("img");
  await expect(recommendedPosters.first()).toHaveCSS("width", "98px");
  await expect(recommendedPosters.first()).toHaveCSS("height", "130px");

  const recommendedTitleBox = await recommendedTitle.boundingBox();
  const recommendedListBox = await recommendedList.boundingBox();
  const firstRecommendedPosterBox = await recommendedPosters.nth(0).boundingBox();
  const secondRecommendedPosterBox = await recommendedPosters.nth(1).boundingBox();
  const popularSceneTitleBox = await popularSceneTitle.boundingBox();

  if (
    !recommendedTitleBox ||
    !recommendedListBox ||
    !firstRecommendedPosterBox ||
    !secondRecommendedPosterBox ||
    !popularSceneTitleBox
  ) {
    throw new Error("드라마 포스터 캐러셀의 간격을 확인할 수 없습니다.");
  }

  expect(recommendedListBox.y - (recommendedTitleBox.y + recommendedTitleBox.height)).toBe(20);
  expect(
    secondRecommendedPosterBox.x -
      (firstRecommendedPosterBox.x + firstRecommendedPosterBox.width),
  ).toBe(12);
  expect(firstRecommendedPosterBox.x).toBe(24);
  expect(
    popularSceneTitleBox.y - (recommendedListBox.y + recommendedListBox.height),
  ).toBe(28);
  expect(runtimeErrors).toEqual([]);

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  await expect(manifestResponse.json()).resolves.toMatchObject({
    name: "성덕순례",
    short_name: "성덕순례",
    lang: "ko",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{
      src: "/landing-icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any",
    }],
  });
});

test("모션 감소 설정에서는 랜딩 전환을 즉시 완료한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByTestId("home-screen")).toBeVisible();
  await expect(page.getByTestId("landing-intro")).toBeHidden({ timeout: 1_000 });
});

test("랜딩 인트로는 최초 접근 이후 홈으로 돌아올 때 다시 표시하지 않는다", async ({
  page,
}) => {
  await page.goto("/");

  const landingIntro = page.getByTestId("landing-intro");
  await expect(landingIntro).toBeVisible();
  await expect(landingIntro).toBeHidden({ timeout: 3_000 });

  await page.getByRole("link", { name: "검색" }).click();
  await expect(page).toHaveURL("/search");
  await page.getByRole("link", { name: "뒤로가기" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("home-screen")).toBeVisible();
  await expect(page.getByTestId("landing-intro")).toHaveCount(0);
});

test("홈 포스터에서 작품 상세와 명장면 장소를 확인한다", async ({ page }) => {
  const runtimeErrors: string[] = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByTestId("famous-poster-1").click();
  await expect(page).toHaveURL("/detail/1");

  const detailScreen = page.getByTestId("work-detail-screen");
  const backLink = page.getByRole("link", { name: "홈으로 돌아가기" });
  const poster = page.getByRole("img", { name: "도깨비 포스터" });
  const description = page.getByTestId("work-description");
  const descriptionToggle = page.getByRole("button", { name: "더보기" });
  const locations = page.getByTestId("filming-location-list");

  await expect(detailScreen).toBeVisible();
  await expect(detailScreen).toHaveCSS("background-image", /detail-screen-glow\.svg/);
  await expect(detailScreen).toHaveCSS("background-size", "100% 612px");
  await expect(backLink).toHaveCSS("width", "44px");
  await expect(backLink).toHaveCSS("height", "44px");
  await expect(page.getByRole("heading", { level: 1, name: "도깨비" })).toBeVisible();
  await expect(poster).toHaveCSS("width", "136px");
  await expect(poster).toHaveCSS("height", "178px");
  await expect(page.getByRole("list", { name: "작품 정보" }).getByRole("listitem"))
    .toHaveText(["2016", "드라마", "한국"]);
  await expect(descriptionToggle).toHaveAttribute("aria-expanded", "false");
  await expect(description).toHaveCSS("-webkit-line-clamp", "3");

  await descriptionToggle.click();
  await expect(page.getByRole("button", { name: "접기" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(description).toContainText("저승사자");

  await expect(
    page.getByRole("heading", { level: 2, name: "도깨비의 명장면 장소" }),
  ).toBeVisible();
  await expect(locations.getByRole("listitem")).toHaveCount(5);
  await expect(locations.getByRole("heading", { level: 3, name: "강릉 영진 해변" }))
    .toHaveCount(1);
  await expect(locations.getByText("강원특별자치도 강릉시 주문진읍 해안로 1609"))
    .toHaveCount(1);

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(0);
  expect(runtimeErrors).toEqual([]);

  await backLink.click();
  await expect(page).toHaveURL("/");
});

test("상세 장소에서 지도 일정으로 이동하고 패널을 조작한다", async ({ page, context, baseURL }) => {
  const runtimeErrors: string[] = [];
  let recommendationRequestCount = 0;
  const recommendationBodies: Array<{
    startAddress: string;
    destAddress: string;
    startTime: string;
  }> = [];

  await failFirstRecommendedRouteForUnrecognizedAddress(page);

  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("request", (request) => {
    if (
      request.url().includes("/backend-api/routes/recommended")
      && request.method() === "POST"
    ) {
      recommendationRequestCount += 1;
      recommendationBodies.push(request.postDataJSON());
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const Geocoder = function Geocoder() {
      return {
        coord2Address(
          _longitude: number,
          latitude: number,
          callback: (
            results: Array<{
              road_address: { address_name: string };
              address: { address_name: string };
            }>,
            status: string,
          ) => void,
        ) {
        const address = latitude >= 37.869
          ? "강원특별자치도 강릉시 주문진읍 해안로 1609"
          : "강원특별자치도 강릉시 주문진읍 해안로 1590";
        callback([{
          road_address: { address_name: address },
          address: { address_name: address },
        }], "OK");
        },
      };
    };

    Object.defineProperty(window, "kakao", {
      configurable: true,
      writable: true,
      value: {
        maps: {
          load(callback: () => void) { callback(); },
          LatLng: function LatLng() {},
          services: {
            Status: { OK: "OK" },
            SortBy: { DISTANCE: "DISTANCE" },
            Geocoder,
          },
        },
      },
    });
  });
  await context.grantPermissions(["geolocation"], {
    origin: new URL(baseURL ?? "http://localhost:3100").origin,
  });
  await context.setGeolocation({ latitude: 37.868, longitude: 128.848 });
  await page.goto("/detail/1");
  expect(await page.evaluate(() => {
    if (!document.getElementById("kakao-map-sdk")) {
      const sdkMarker = document.createElement("script");
      sdkMarker.id = "kakao-map-sdk";
      document.head.append(sdkMarker);
    }
    return Boolean(window.kakao?.maps.services);
  })).toBe(true);

  const recommendationRequestPromise = page.waitForRequest(
    (request) =>
      request.url().includes("/backend-api/routes/recommended")
      && request.method() === "POST",
  );
  await page.getByRole("button", { name: "강릉 영진 해변 추천 일정 만들기" }).click();
  const generationOverlay = page.getByTestId("route-generation-overlay");
  await expect(generationOverlay).toBeVisible();
  await expect(generationOverlay).toHaveCSS("position", "fixed");
  await expect(
    generationOverlay.getByRole("heading", { name: /성덕순례길을 만들고 있어요/ }),
  ).toBeVisible();
  await expect(page.getByTestId("route-generation-icon").locator("img")).toHaveCount(2);
  const generationProgress = page.getByTestId("route-generation-progress");
  await expect(generationProgress).toHaveAttribute("aria-valuemax", "100");
  await expect(generationOverlay.getByRole("status")).toContainText(
    /(목적지까지 빠른 출발지|이동 순서와 들를 곳|지도 위에 차례대로)/,
  );
  const overlayBox = await generationOverlay.boundingBox();
  expect(overlayBox).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
  const recommendationRequest = await recommendationRequestPromise;
  await expect(generationProgress).not.toHaveAttribute("aria-valuenow", "0");
  const recommendationBody = recommendationRequest.postDataJSON() as {
    startAddress: string;
    destAddress: string;
    startTime: string;
  };

  expect(recommendationBody.startAddress).not.toBe("");
  expect(recommendationBody.destAddress).toBe(
    "강원특별자치도 강릉시 주문진읍 해안로 1609",
  );
  expect(recommendationBody.startTime).toMatch(/^\d{2}:\d{2}$/);
  await expect(page).toHaveURL(/\/map\/1\?plan=5/, { timeout: 20_000 });
  await expect(page.getByTestId("map-screen")).toBeVisible();
  const mapSurface = page.locator('[data-testid="kakao-map"], [data-testid="map-preview"]');
  await expect(mapSurface).toBeVisible();

  const kakaoMap = page.getByTestId("kakao-map");
  if (await kakaoMap.count()) {
    await expect(kakaoMap).toHaveAttribute("data-map-ready", "true");
    const beforeTouchDrag = await kakaoMap.screenshot();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 196, y: 250, id: 1, radiusX: 2, radiusY: 2, force: 1 }],
    });
    for (let step = 1; step <= 8; step += 1) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{
          x: 196 + (80 * step) / 8,
          y: 250 + (80 * step) / 8,
          id: 1,
          radiusX: 2,
          radiusY: 2,
          force: 1,
        }],
      });
    }
    await page.waitForTimeout(50);
    const duringTouchDrag = await kakaoMap.screenshot();
    expect(duringTouchDrag.equals(beforeTouchDrag)).toBe(false);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(300);
    const afterTouchDrag = await kakaoMap.screenshot();
    expect(afterTouchDrag.equals(beforeTouchDrag)).toBe(false);
  }
  await expect(page.getByTestId("itinerary-stop-list").getByRole("listitem")).toHaveCount(5);
  await expect(
    page.getByTestId("itinerary-stop-list").getByRole("heading", { level: 2 }),
  ).toHaveText(["현재 위치", "풍년건어물", "다경횟집", "오드커피", "강릉 영진 해변"]);
  await expect(page.getByRole("heading", { name: "풍년건어물" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "다경횟집" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "오드커피" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "오죽헌" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "강릉 영진 해변" }).first()).toBeVisible();
  await expect(page.locator(".map-pin")).toHaveCount(5);
  const routeButton = page.getByRole("button", { name: "루트 따라가기" });
  await expect(routeButton).toBeVisible();

  const sheet = page.getByTestId("itinerary-sheet");
  const placeCard = page.getByTestId("selected-place-card");
  await expect(sheet).toHaveAttribute("data-snap", "medium");
  const mediumHandle = page.getByRole("button", { name: "일정 패널 펼치기" });
  const mediumHandleBox = await mediumHandle.boundingBox();
  if (!mediumHandleBox) throw new Error("중간 위치의 일정 패널 핸들을 확인할 수 없습니다.");
  const mediumHandleX = mediumHandleBox.x + mediumHandleBox.width / 2;
  const mediumHandleY = mediumHandleBox.y + mediumHandleBox.height / 2;
  await page.mouse.move(mediumHandleX, mediumHandleY);
  await page.mouse.down();
  await page.mouse.move(mediumHandleX, mediumHandleY + 80, { steps: 6 });

  const draggingSheetBox = await sheet.boundingBox();
  const draggingPlaceCardBox = await placeCard.boundingBox();
  if (!draggingSheetBox || !draggingPlaceCardBox) {
    throw new Error("드래그 중 패널과 장소 카드의 위치를 확인할 수 없습니다.");
  }
  expect(draggingSheetBox.y - (draggingPlaceCardBox.y + draggingPlaceCardBox.height))
    .toBeCloseTo(16, 0);
  await page.mouse.up();
  await expect(sheet).toHaveAttribute("data-snap", "medium");

  const resetHandleBox = await mediumHandle.boundingBox();
  if (!resetHandleBox) throw new Error("복귀한 일정 패널 핸들의 위치를 확인할 수 없습니다.");
  const resetHandleX = resetHandleBox.x + resetHandleBox.width / 2;
  const resetHandleY = resetHandleBox.y + resetHandleBox.height / 2;
  await page.mouse.move(resetHandleX, resetHandleY);
  await page.mouse.down();
  await page.mouse.move(resetHandleX, -100, { steps: 8 });

  const fullyDraggedSheetBox = await sheet.boundingBox();
  if (!fullyDraggedSheetBox) throw new Error("완전히 펼친 패널의 위치를 확인할 수 없습니다.");
  expect(fullyDraggedSheetBox.y).toBeCloseTo(84.4, 0);
  await expect(placeCard).toHaveCSS("opacity", "0");
  await page.mouse.up();
  await expect(sheet).toHaveAttribute("data-snap", "expanded");
  await expect(placeCard).toHaveCSS("opacity", "0");
  const sheetHandle = page.getByRole("button", { name: "일정 패널 접기" });
  await expect(sheetHandle).toBeVisible();

  const handleBox = await sheetHandle.boundingBox();
  if (!handleBox) throw new Error("일정 패널 드래그 핸들의 위치를 확인할 수 없습니다.");
  const handleCenterX = handleBox.x + handleBox.width / 2;
  const handleCenterY = handleBox.y + handleBox.height / 2;
  await page.mouse.move(handleCenterX, handleCenterY);
  await page.mouse.down();
  await page.mouse.move(handleCenterX, 720, { steps: 8 });
  await page.mouse.up();
  await expect(sheet).toHaveAttribute("data-snap", "collapsed");
  await expect(page.getByRole("button", { name: "일정 패널 펼치기" })).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(0);
  expect(runtimeErrors).toEqual([]);

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.getByTestId("map-screen")).toHaveCSS("width", "768px");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBe(0);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await routeButton.click();
  await expect(page.getByTestId("route-follow-status")).toContainText("현재 위치를 따라 안내 중");
  await expect(page.getByTestId("route-follow-status")).toContainText("다음 · 풍년건어물");
  await expect(sheet).toHaveAttribute("data-snap", "collapsed");
  await expect(page.getByRole("button", { name: "따라가기 종료" })).toBeVisible();
  if (await kakaoMap.count()) {
    await expect(page.getByTestId("current-location-marker")).toBeAttached();
  }
  expect(recommendationRequestCount).toBe(2);
  expect(recommendationBodies[1]).toBeDefined();
  expect(recommendationBodies[1].startAddress).not.toBe("");
  expect(recommendationBodies[1].destAddress).not.toBe("");
  expect(
    recommendationBodies[0].startAddress !== recommendationBodies[1].startAddress
      || recommendationBodies[0].destAddress !== recommendationBodies[1].destAddress,
  ).toBe(true);
  expect(context.pages()).toHaveLength(1);

  await page.getByRole("link", { name: "작품 상세로 돌아가기" }).click();
  await expect(page).toHaveURL("/detail/1");
  const generatedStatus = page.getByTestId("route-generated-5");
  await expect(generatedStatus).toHaveText("루트 생성");
  const generatedRouteButton = page.getByRole("button", {
    name: "강릉 영진 해변 저장된 추천 일정 보기",
  });
  const [generatedStatusBox, generatedRouteButtonBox] = await Promise.all([
    generatedStatus.boundingBox(),
    generatedRouteButton.boundingBox(),
  ]);
  if (!generatedStatusBox || !generatedRouteButtonBox) {
    throw new Error("생성된 루트 상태의 오른쪽 정렬을 확인할 수 없습니다.");
  }
  expect(
    generatedRouteButtonBox.x + generatedRouteButtonBox.width
      - (generatedStatusBox.x + generatedStatusBox.width),
  ).toBeCloseTo(0, 0);

  const requestCountBeforeReuse = recommendationRequestCount;
  await generatedRouteButton.click();
  await expect(page).toHaveURL(/\/map\/1\?plan=5/, { timeout: 20_000 });
  expect(recommendationRequestCount).toBe(requestCountBeforeReuse);
});

test("홈에서 검색 페이지로 이동하고 다시 돌아온다", async ({ page }) => {
  const runtimeErrors: string[] = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("link", { name: "검색" }).click();
  await expect(page).toHaveURL("/search");

  const searchScreen = page.getByTestId("search-screen");
  const backLink = page.getByRole("link", { name: "뒤로가기" });
  const homeLink = page.getByRole("link", { name: "홈으로 이동" });

  await expect(searchScreen).toBeVisible();
  await expect(searchScreen).toHaveCSS("background-image", /screen-glow\.svg/);
  await expect(searchScreen.locator(":scope > *")).toHaveCount(2);
  await expect(backLink).toHaveCSS("width", "44px");
  await expect(backLink).toHaveCSS("height", "44px");
  await expect(page.getByTestId("back-icon")).toHaveCSS("width", "24px");
  await expect(page.getByTestId("back-icon")).toHaveCSS("height", "24px");
  await expect(homeLink).toBeVisible();
  await expect(page.getByTestId("search-header-logo")).toHaveCSS("width", "93px");
  await expect(page.getByTestId("search-header-logo")).toHaveCSS("height", "32px");
  const searchInput = page.getByRole("searchbox", { name: "작품 검색" });
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveAttribute("placeholder", "원하는 작품을 검색해주세요 ...");
  await expect(searchInput).toHaveCSS("font-size", "16px");
  await expect(searchInput).toHaveCSS("height", "52px");
  await expect(page.getByTestId("search-input-icon")).toHaveCSS("width", "24px");
  await expect(page.getByTestId("search-input-icon")).toHaveCSS("height", "24px");

  const searchHeaderBox = await searchScreen.locator("header").boundingBox();
  const searchInputBox = await searchInput.boundingBox();

  if (!searchHeaderBox || !searchInputBox) {
    throw new Error("검색 헤더와 검색 입력창의 간격을 확인할 수 없습니다.");
  }

  expect(searchInputBox.y - (searchHeaderBox.y + searchHeaderBox.height)).toBe(44);

  const recentSearchesTitle = page.getByRole("heading", { level: 2, name: "최근 검색어" });
  const recentSearches = page.getByTestId("recent-searches");
  const firstRecentSearch = recentSearches.getByText("나루토");

  await expect(recentSearchesTitle).toHaveCSS("font-size", "20px");
  await expect(firstRecentSearch).toHaveCSS("font-size", "16px");
  await expect(recentSearches.getByRole("listitem")).toHaveCount(2);

  const recentSearchesBox = await recentSearches.boundingBox();
  const recentSearchesTitleBox = await recentSearchesTitle.boundingBox();
  const firstRecentSearchBox = await firstRecentSearch.boundingBox();

  if (!recentSearchesBox || !recentSearchesTitleBox || !firstRecentSearchBox) {
    throw new Error("최근 검색어 영역의 간격을 확인할 수 없습니다.");
  }

  expect(recentSearchesBox.y - (searchInputBox.y + searchInputBox.height)).toBe(36);
  expect(firstRecentSearchBox.y - (recentSearchesTitleBox.y + recentSearchesTitleBox.height)).toBe(
    24,
  );

  const removeNarutoButton = recentSearches.getByRole("button", {
    name: "나루토 최근 검색어 삭제",
  });
  await expect(removeNarutoButton).toHaveCSS("width", "44px");
  await expect(removeNarutoButton).toHaveCSS("height", "44px");
  await removeNarutoButton.click();
  await expect(recentSearches.getByText("나루토")).toBeHidden();
  await expect(recentSearches.getByRole("listitem")).toHaveCount(1);

  await searchInput.fill("도깨비");
  await expect(searchInput).toHaveValue("도깨비");
  await expect(recentSearchesTitle).toBeHidden();

  const searchResultsTitle = page.getByRole("heading", {
    level: 2,
    name: "검색어와 관련된 작품",
  });
  const searchResultsList = page.getByTestId("search-results-list");
  const searchResultPosters = searchResultsList.getByRole("img");
  const clearSearchButton = page.getByRole("button", { name: "검색어 지우기" });

  await expect(searchResultsTitle).toBeVisible();
  await expect(searchResultsTitle).toHaveCSS("font-size", "20px");
  await expect(searchResultsList).toHaveAttribute("aria-label", "도깨비 관련 작품 목록");
  await expect(searchResultsList.getByRole("listitem")).toHaveCount(4);
  await expect(searchResultPosters.first()).toHaveCSS("width", "107px");
  await expect(searchResultPosters.first()).toHaveCSS("height", "141px");
  await expect(clearSearchButton).toHaveCSS("width", "44px");
  await expect(clearSearchButton).toHaveCSS("height", "44px");
  await expect(page.getByTestId("search-clear-icon")).toHaveCSS("width", "24px");
  await expect(page.getByTestId("search-clear-icon")).toHaveCSS("height", "24px");

  const searchResultsTitleBox = await searchResultsTitle.boundingBox();
  const searchResultsListBox = await searchResultsList.boundingBox();
  const firstSearchResultBox = await searchResultPosters.nth(0).boundingBox();
  const secondSearchResultBox = await searchResultPosters.nth(1).boundingBox();

  if (
    !searchResultsTitleBox ||
    !searchResultsListBox ||
    !firstSearchResultBox ||
    !secondSearchResultBox
  ) {
    throw new Error("검색 결과 영역의 간격을 확인할 수 없습니다.");
  }

  expect(searchResultsTitleBox.y - (searchInputBox.y + searchInputBox.height)).toBe(36);
  expect(searchResultsListBox.y - (searchResultsTitleBox.y + searchResultsTitleBox.height)).toBe(
    24,
  );
  expect(secondSearchResultBox.x - (firstSearchResultBox.x + firstSearchResultBox.width)).toBe(12);

  const searchResultsScrollMetrics = await searchResultsList.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(searchResultsScrollMetrics.scrollWidth).toBeGreaterThan(
    searchResultsScrollMetrics.clientWidth,
  );

  await clearSearchButton.click();
  await expect(searchInput).toHaveValue("");
  await expect(searchInput).toBeFocused();
  await expect(searchResultsTitle).toBeHidden();
  await expect(page.getByRole("heading", { level: 2, name: "최근 검색어" })).toBeVisible();

  await searchInput.fill("나루토");
  await expect(searchResultsTitle).toBeVisible();
  await expect(searchResultsList).toBeHidden();

  const emptySearchResults = page.getByTestId("empty-search-results");
  await expect(emptySearchResults).toHaveText("해당하는 작품이 없습니다.");
  await expect(emptySearchResults).toHaveCSS("font-size", "16px");
  await expect(emptySearchResults).toHaveCSS("color", "rgb(119, 119, 119)");

  const emptySearchResultsBox = await emptySearchResults.boundingBox();

  if (!emptySearchResultsBox) {
    throw new Error("검색 결과 없음 안내의 위치를 확인할 수 없습니다.");
  }

  expect(emptySearchResultsBox.x + emptySearchResultsBox.width / 2).toBeCloseTo(390 / 2, 0);
  expect(emptySearchResultsBox.y + emptySearchResultsBox.height / 2).toBeCloseTo(844 / 2, 0);

  await backLink.click();
  await expect(page).toHaveURL("/");

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/search");
  await expect(page.getByTestId("search-screen").locator(":scope > *")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1280);
  expect(runtimeErrors).toEqual([]);
});

test("짧은 작품 설명에는 더보기 버튼을 표시하지 않는다", async ({ page }) => {
  await page.route("**/backend-api/contents/1", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        contentId: 1,
        title: "도깨비",
        contentType: "DRAMA",
        thumbnailUrl: "/famous-drama-1.png",
        description: "도깨비와 도깨비 신부의 이야기입니다.",
        releaseYear: 2016,
        country: "한국",
      }),
    }),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/detail/1");

  await expect(page.getByTestId("work-description")).toBeVisible();
  await expect(page.getByRole("button", { name: "더보기" })).toHaveCount(0);
});

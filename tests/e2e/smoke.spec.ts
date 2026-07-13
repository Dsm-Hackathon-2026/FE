import { expect, test } from "@playwright/test";

test("애플리케이션 셸과 제품 메타데이터를 제공한다", async ({ page, request }) => {
  const runtimeErrors: string[] = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("성덕순례");
  await expect(page.getByRole("heading", { level: 1, name: "성덕순례" })).toBeVisible();
  await expect(page.getByTestId("home-screen")).toBeVisible();
  const landingIntro = page.getByTestId("landing-intro");
  await expect(landingIntro).toBeVisible();
  await expect(landingIntro).toHaveCSS("animation-name", "landing-slide-out");
  await expect(landingIntro).toHaveCSS("animation-duration", "0.7s");
  await expect(landingIntro).toHaveCSS("animation-delay", "1.8s");
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

  const iconBox = await landingIcon.boundingBox();
  const viewport = page.viewportSize();

  if (!iconBox || !viewport) {
    throw new Error("랜딩 아이콘 또는 브라우저 뷰포트의 크기를 확인할 수 없습니다.");
  }

  expect(iconBox.x + iconBox.width / 2).toBeCloseTo(viewport.width / 2, 0);
  expect(iconBox.y + iconBox.height / 2).toBeCloseTo(viewport.height / 2, 0);

  await page.setViewportSize({ width: 390, height: 844 });

  const mobileIconBox = await landingIcon.boundingBox();

  if (!mobileIconBox) {
    throw new Error("모바일 뷰포트에서 랜딩 아이콘의 크기를 확인할 수 없습니다.");
  }

  expect(mobileIconBox.x + mobileIconBox.width / 2).toBeCloseTo(390 / 2, 0);
  expect(mobileIconBox.y + mobileIconBox.height / 2).toBeCloseTo(844 / 2, 0);

  await expect(promotionBanner).toHaveCSS("width", "268px");
  await expect(promotionBanner).toHaveCSS("height", "84px");

  await expect
    .poll(async () => (await landingIntro.boundingBox())?.x ?? -390, { timeout: 4_000 })
    .toBeLessThan(-10);
  await expect(landingIntro).toBeHidden({ timeout: 4_000 });
  const headerLogo = page.getByTestId("header-logo");
  await expect(headerLogo).toBeVisible();
  await expect(headerLogo).toHaveCSS("width", "93px");
  await expect(headerLogo).toHaveCSS("height", "32px");
  const searchButton = page.getByRole("button", { name: "검색" });
  await expect(searchButton).toBeVisible();
  await expect(searchButton).toHaveCSS("width", "44px");
  await expect(searchButton).toHaveCSS("height", "44px");
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
  const secondPoster = page.getByRole("img", { name: "2위 사랑의 불시착 포스터" });
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
  const firstRankBox = await page.getByTestId("famous-rank-1").boundingBox();

  if (!firstRankBox) {
    throw new Error("첫 번째 인기 드라마 순위 숫자의 크기를 확인할 수 없습니다.");
  }

  expect(firstRankBox.width).toBeCloseTo(32, 0);
  expect(firstRankBox.height).toBeCloseTo(86, 0);
  const firstPosterBox = await firstPoster.boundingBox();
  const secondRankBox = await page.getByTestId("famous-rank-2").boundingBox();
  const secondPosterBox = await secondPoster.boundingBox();

  if (!firstPosterBox || !secondRankBox || !secondPosterBox) {
    throw new Error("순위 숫자와 포스터 사이의 간격을 확인할 수 없습니다.");
  }

  expect(firstPosterBox.x - (firstRankBox.x + firstRankBox.width)).toBeCloseTo(20, 0);
  expect(secondPosterBox.x - (secondRankBox.x + secondRankBox.width)).toBeCloseTo(20, 0);
  for (let rank = 1; rank <= 10; rank += 1) {
    const rankBox = await page.getByTestId(`famous-rank-${rank}`).boundingBox();
    const posterBox = await page.getByTestId(`famous-poster-${rank}`).boundingBox();

    if (!rankBox || !posterBox) {
      throw new Error(`${rank}위 숫자와 포스터 사이의 간격을 확인할 수 없습니다.`);
    }

    expect(posterBox.x - (rankBox.x + rankBox.width)).toBeCloseTo(20, 0);
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
  });
});

test("모션 감소 설정에서는 랜딩 전환을 즉시 완료한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByTestId("home-screen")).toBeVisible();
  await expect(page.getByTestId("landing-intro")).toBeHidden({ timeout: 1_000 });
});

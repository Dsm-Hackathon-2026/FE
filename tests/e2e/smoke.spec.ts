import { expect, test } from "@playwright/test";

test("애플리케이션 셸과 제품 메타데이터를 제공한다", async ({ page, request }) => {
  const runtimeErrors: string[] = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("성덕순례");
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

test("홈 포스터에서 작품 상세와 명장면 장소를 확인한다", async ({ page }) => {
  const runtimeErrors: string[] = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByTestId("famous-poster-1").click();
  await expect(page).toHaveURL("/detail/goblin");

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
  await expect(locations.getByRole("listitem")).toHaveCount(3);
  await expect(locations.getByRole("heading", { level: 3, name: "강릉 영진 해변" }))
    .toHaveCount(3);
  await expect(locations.getByText("강원특별자치도 강릉시 주문진읍 해안로 1609"))
    .toHaveCount(3);

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(0);
  expect(runtimeErrors).toEqual([]);

  await backLink.click();
  await expect(page).toHaveURL("/");
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

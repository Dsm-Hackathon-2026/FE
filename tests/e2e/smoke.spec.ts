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
  await expect(page.getByRole("heading", { level: 2, name: /어떤 작품 속으로/ })).toBeVisible();
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

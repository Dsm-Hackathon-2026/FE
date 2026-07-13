import { expect, test } from "@playwright/test";

test("애플리케이션 셸과 제품 메타데이터를 제공한다", async ({ page, request }) => {
  const runtimeErrors: string[] = [];

  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("성덕순례");
  await expect(page.getByRole("heading", { level: 1, name: "성덕순례" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  await expect(manifestResponse.json()).resolves.toMatchObject({
    name: "성덕순례",
    short_name: "성덕순례",
    lang: "ko",
  });
});

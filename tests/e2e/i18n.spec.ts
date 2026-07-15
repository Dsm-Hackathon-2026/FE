import { expect, test } from "@playwright/test";

import { mockBackendApi } from "./apiMock";

test.beforeEach(async ({ page }) => {
  await mockBackendApi(page);
});

test("영어를 선택하면 화면과 접근성 문구가 바뀌고 선택이 유지된다", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/");
  await expect(page.getByTestId("landing-intro")).toBeHidden({ timeout: 3_000 });

  await page.getByRole("button", { name: "English" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("group", { name: "Filter by content type" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Drama" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Popular Drama with iconic scenes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Search" })).toBeVisible();

  await page.getByRole("link", { name: "Search" }).click();
  await expect(page.getByPlaceholder("Search for a title...")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent searches" })).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByPlaceholder("Search for a title...")).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

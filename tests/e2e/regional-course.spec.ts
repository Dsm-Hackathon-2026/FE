import { expect, test } from "@playwright/test";

import { mockBackendApi } from "./apiMock";

test.beforeEach(async ({ page }) => {
  await mockBackendApi(page);
});

test("지역 명장면 코스를 만들고 여러 촬영지를 지도에 표시한다", async ({
  page,
  context,
  baseURL,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const Geocoder = function Geocoder() {
      return {
        coord2Address(
          _longitude: number,
          _latitude: number,
          callback: (
            results: Array<{
              road_address: { address_name: string };
              address: { address_name: string };
            }>,
            status: string,
          ) => void,
        ) {
          callback([{
            road_address: { address_name: "강원특별자치도 강릉시 용지로 176" },
            address: { address_name: "강원특별자치도 강릉시 용지로 176" },
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
  await context.setGeolocation({ latitude: 37.7641, longitude: 128.8996 });

  await page.goto("/detail/1");
  await page.evaluate(() => {
    const sdkMarker = document.createElement("script");
    sdkMarker.id = "kakao-map-sdk";
    document.head.append(sdkMarker);
  });

  await expect(page.getByRole("heading", { level: 2, name: "지역별 명장면 코스" }))
    .toBeVisible();
  const courseButton = page.getByRole("button", {
    name: "강원 명장면 코스 만들기, 촬영지 3곳과 맛집 및 카페 포함",
  });
  await expect(courseButton).toBeVisible();
  await expect(courseButton.getByText("촬영지 3곳 · 맛집 · 카페")).toBeVisible();

  const requestPromise = page.waitForRequest(
    (request) => request.url().includes("/backend-api/routes/pilgrimage")
      && request.method() === "POST",
  );
  await courseButton.click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toMatchObject({ spotIds: [1, 2, 3] });

  await expect(page).toHaveURL(/\/map\/1\?plan=region-gangwon/, { timeout: 20_000 });
  const stopList = page.getByTestId("itinerary-stop-list");
  await expect(stopList.getByRole("heading", { name: "강릉역" })).toBeVisible();
  await expect(stopList.getByRole("heading", { name: "강릉 활어 횟집" })).toBeVisible();
  await expect(stopList.getByRole("heading", { name: "디저트 카페" })).toBeVisible();
  await expect(stopList.getByRole("heading", { name: "다경횟집" })).toBeVisible();
  await expect(stopList.getByRole("heading", { name: "오드커피" })).toBeVisible();
  await expect(page.getByRole("link", { name: "강릉 활어 횟집 방문 촬영" }))
    .toHaveAttribute("href", "/camera/1?plan=region-gangwon&stop=destination-2");
  expect(runtimeErrors).toEqual([]);
});

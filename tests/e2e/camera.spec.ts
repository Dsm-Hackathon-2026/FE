import { expect, test } from "@playwright/test";

import { mockBackendApi, seedRecommendedRoutePlan } from "./apiMock";

test.beforeEach(async ({ page }) => {
  await mockBackendApi(page);
  await seedRecommendedRoutePlan(page);
});

test("명장면 카드에서 카메라를 열어 촬영하고 방문 기록을 저장한다", async ({ page }) => {
  await page.addInitScript(() => {
    const cameraCalls: MediaStreamConstraints[] = [];
    Object.assign(window, { __cameraCalls: cameraCalls });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia(constraints: MediaStreamConstraints) {
          cameraCalls.push(constraints);
          return { getTracks: () => [{ stop() {} }] };
        },
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
      configurable: true,
      get() { return null; },
      set() {},
    });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: async () => {},
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      configurable: true,
      get: () => 1_920,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      configurable: true,
      get: () => 1_080,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => ({ translate() {}, scale() {}, drawImage() {} }),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      configurable: true,
      value: () => "data:image/jpeg;base64,c2Vvbm dkZW9r".replace(" ", ""),
    });
  });

  await page.goto("/map/1?plan=5");
  const cameraLink = page.getByRole("link", { name: "강릉 영진 해변 방문 촬영" });
  await expect(cameraLink).toBeVisible();
  await cameraLink.click();

  await expect(page).toHaveURL("/camera/1?plan=5&stop=destination-5");
  await expect(page.getByTestId("camera-screen")).toBeVisible();
  await expect(page.getByRole("button", { name: "사진 촬영" })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => (
    window as unknown as { __cameraCalls: MediaStreamConstraints[] }
  ).__cameraCalls.at(-1)?.video)).toMatchObject({ facingMode: { ideal: "environment" } });

  await page.getByRole("button", { name: "전면 후면 카메라 전환" }).click();
  await expect.poll(async () => page.evaluate(() => (
    window as unknown as { __cameraCalls: MediaStreamConstraints[] }
  ).__cameraCalls.at(-1)?.video)).toMatchObject({ facingMode: { ideal: "user" } });

  await page.getByRole("button", { name: "사진 촬영" }).click();
  await expect(page.getByTestId("captured-photo")).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 촬영" })).toBeVisible();
  await page.getByRole("button", { name: "방문 기록 저장" }).click();
  await expect(page.getByText("방문 기록을 저장했어요")).toBeVisible();

  const savedRecord = await page.evaluate(() => {
    const key = Object.keys(sessionStorage).find((item) => item.includes("seongdeok:visit-record"));
    return key ? JSON.parse(sessionStorage.getItem(key) ?? "null") : null;
  });
  expect(savedRecord).toMatchObject({
    version: 1,
    workId: "1",
    planId: "5",
    stopId: "destination-5",
    stopName: "강릉 영진 해변",
  });
  expect(savedRecord.photoDataUrl).toMatch(/^data:image\/jpeg;base64,/);

  await page.getByRole("link", { name: "지도 보기" }).click();
  await expect(page).toHaveURL("/map/1?plan=5");
  await page.getByRole("link", { name: "작품 상세로 돌아가기" }).click();
  await expect(page).toHaveURL("/detail/1");
  const visitStatus = page.getByTestId("visit-completed-5");
  await expect(visitStatus).toHaveText("방문완료");
  await expect(page.getByTestId("route-generated-5")).toHaveCount(0);
  const completedLocationButton = page.getByRole("button", {
    name: "강릉 영진 해변 방문 완료, 저장된 추천 일정 보기",
  });
  await expect(completedLocationButton).toBeVisible();
  const [visitStatusBox, completedLocationButtonBox] = await Promise.all([
    visitStatus.boundingBox(),
    completedLocationButton.boundingBox(),
  ]);
  if (!visitStatusBox || !completedLocationButtonBox) {
    throw new Error("방문 완료 상태의 오른쪽 정렬을 확인할 수 없습니다.");
  }
  expect(
    completedLocationButtonBox.x + completedLocationButtonBox.width
      - (visitStatusBox.x + visitStatusBox.width),
  ).toBeCloseTo(0, 0);
});

test("카메라 권한이 거부되면 안내와 재시도 동작을 제공한다", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia() {
          throw new DOMException("Permission denied", "NotAllowedError");
        },
      },
    });
  });

  await page.goto("/camera/1?plan=5&stop=destination-5");
  await expect(page.getByText("촬영하려면 브라우저의 카메라 권한을 허용해 주세요."))
    .toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  await expect(page.getByRole("link", { name: "지도 일정으로 돌아가기" })).toHaveAttribute(
    "href",
    "/map/1?plan=5",
  );
});

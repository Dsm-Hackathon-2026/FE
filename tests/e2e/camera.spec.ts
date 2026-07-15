import { expect, test, type Page } from "@playwright/test";

import { mockBackendApi, seedRecommendedRoutePlan } from "./apiMock";

test.beforeEach(async ({ page, context, baseURL }) => {
  await mockBackendApi(page);
  await seedRecommendedRoutePlan(page);
  await context.grantPermissions(["geolocation"], {
    origin: new URL(baseURL ?? "http://localhost:3100").origin,
  });
  await context.setGeolocation({ latitude: 37.8691, longitude: 128.8486, accuracy: 10 });
});

async function installCameraMock(page: Page) {
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
}

test("명장면 카드에서 촬영한 사진을 인증하고 두 사진을 확인한 뒤 지도로 돌아간다", async ({ page }) => {
  await installCameraMock(page);
  await page.setViewportSize({ width: 393, height: 852 });

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
  const verificationRequest = page.waitForRequest((request) => (
    new URL(request.url()).pathname === "/backend-api/verifications"
    && request.method() === "POST"
  ));
  await page.getByRole("button", { name: "인증하기" }).click();

  const request = await verificationRequest;
  const requestUrl = new URL(request.url());
  expect(requestUrl.searchParams.get("spotId")).toBe("5");
  expect(requestUrl.searchParams.get("latitude")).toBe("37.8691");
  expect(requestUrl.searchParams.get("longitude")).toBe("128.8486");
  expect(requestUrl.searchParams.has("userLatitude")).toBe(false);
  expect(request.headers()["content-type"]).toContain("multipart/form-data");

  await expect(page.getByTestId("verification-result-screen")).toBeVisible();
  await expect(page.getByRole("heading", { name: "강릉 영진 해변 드라마 명장면" }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: "강릉 영진 해변 내가 찍은 명장면" }))
    .toBeVisible();
  await expect(page.getByTestId("scene-image")).toBeVisible();
  await expect(page.getByTestId("verification-image")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    [...document.querySelectorAll<HTMLImageElement>("[data-testid$='-image']")]
      .every((image) => image.complete && image.naturalWidth > 0)
  ))).toBe(true);

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

  await page.getByRole("link", { name: "지도 일정으로 돌아가기" }).click();
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

test("촬영지에서 멀면 인증 실패를 안내하고 다시 촬영할 수 있다", async ({ page }) => {
  await installCameraMock(page);
  await page.route("**/backend-api/verifications**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        verificationId: 102,
        spotId: 5,
        spotName: "강릉 영진 해변",
        contentTitle: "도깨비",
        sceneImageUrl: "/gangneung-yeongjin-beach.png",
        verificationImageUrl: "/monthly-destination.png",
        status: "FAIL",
        verifiedAt: "2026-07-15T10:31:00Z",
      }),
    });
  });

  await page.goto("/camera/1?plan=5&stop=destination-5");
  await page.getByRole("button", { name: "사진 촬영" }).click();
  await page.getByRole("button", { name: "인증하기" }).click();

  await expect(page.getByText("촬영지 200m 이내에서 인증해 주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 촬영" })).toBeVisible();
  await expect(page.getByRole("button", { name: "인증하기" })).toBeVisible();
  await expect(page.getByTestId("verification-result-screen")).toHaveCount(0);
});

test("지역 코스에서는 선택한 촬영지 ID로 방문을 인증한다", async ({ page }) => {
  await installCameraMock(page);
  await page.addInitScript(() => {
    sessionStorage.setItem("seongdeok:route-plan:1:region-gangwon", JSON.stringify({
      version: 2,
      contentId: 1,
      destinationId: "region-gangwon",
      itinerary: {
        id: "pilgrimage-1-region-gangwon",
        title: "강원 명장면 코스",
        stops: [{
          id: "destination-2",
          order: 0,
          name: "강릉 활어 횟집",
          description: "두 번째 명장면 장소 방문",
          address: "강원특별자치도 강릉시 창해로 451",
          imageSrc: "/gangneung-yeongjin-beach.png",
          imageAlt: "강릉 활어 횟집 전경",
          spotId: 2,
          kind: "filming-location",
          coordinates: { latitude: 37.7953, longitude: 128.9182 },
        }],
      },
    }));
  });

  await page.goto("/camera/1?plan=region-gangwon&stop=destination-2");
  await page.getByRole("button", { name: "사진 촬영" }).click();
  const verificationRequest = page.waitForRequest((request) => (
    new URL(request.url()).pathname === "/backend-api/verifications"
    && request.method() === "POST"
  ));
  await page.getByRole("button", { name: "인증하기" }).click();

  const requestUrl = new URL((await verificationRequest).url());
  expect(requestUrl.searchParams.get("spotId")).toBe("2");
  await expect(page.getByTestId("verification-result-screen")).toBeVisible();
  await expect(page.getByRole("link", { name: "지도 일정으로 돌아가기" }))
    .toHaveAttribute("href", "/map/1?plan=region-gangwon");

  await page.goto("/detail/1");
  await expect(page.getByTestId("visit-completed-2")).toHaveText("방문완료");
});

test("위치 권한이 없으면 인증을 중단하고 권한 안내를 표시한다", async ({ page }) => {
  await installCameraMock(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) {
          error({ code: 1 } as GeolocationPositionError);
        },
      },
    });
  });

  await page.goto("/camera/1?plan=5&stop=destination-5");
  await page.getByRole("button", { name: "사진 촬영" }).click();
  await page.getByRole("button", { name: "인증하기" }).click();

  await expect(page.getByText("방문 인증을 위해 위치 권한을 허용해 주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 촬영" })).toBeVisible();
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

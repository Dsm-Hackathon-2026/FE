import { expect, test } from "@playwright/test";

import { mockBackendApi, seedRecommendedRoutePlan } from "./apiMock";

test.beforeEach(async ({ page }) => {
  await mockBackendApi(page);
});

test("하단 일정 패널의 Figma 좌표를 확인한다", async ({ page }) => {
  await seedRecommendedRoutePlan(page);
  await page.setViewportSize({ width: 393, height: 1120 });
  await page.goto("/map/1?plan=5");

  const sheet = page.getByTestId("itinerary-sheet");
  const firstCard = page.getByTestId("itinerary-stop-list").getByRole("article").first();
  const secondCard = page.getByTestId("itinerary-stop-list").getByRole("article").nth(1);
  const thirdCard = page.getByTestId("itinerary-stop-list").getByRole("article").nth(2);
  const secondDistance = page.getByTestId("itinerary-distance-1");
  const routeButton = page.getByRole("button", { name: "루트 따라가기" });
  const timelineLine = page.getByTestId("itinerary-timeline-line");
  const lastMarker = page.getByTestId("itinerary-marker-4");
  const cameraIcon = page.getByTestId("camera-icon");
  const sheetBox = await sheet.boundingBox();
  const firstCardBox = await firstCard.boundingBox();
  const secondCardBox = await secondCard.boundingBox();
  const thirdCardBox = await thirdCard.boundingBox();
  const secondDistanceBox = await secondDistance.boundingBox();
  const routeButtonBox = await routeButton.boundingBox();
  const timelineLineBox = await timelineLine.boundingBox();
  const lastMarkerBox = await lastMarker.boundingBox();
  const cameraIconBox = await cameraIcon.boundingBox();

  expect(sheetBox?.y).toBeCloseTo(518, 0);
  expect(firstCardBox).toMatchObject({ x: 59, width: 314, height: 48 });
  if (!secondCardBox || !thirdCardBox || !secondDistanceBox) {
    throw new Error("목적지 카드 사이 간격을 확인할 수 없습니다.");
  }
  expect(await page.getByTestId(/^itinerary-distance-/).count()).toBe(4);
  await expect(secondDistance).toHaveText(/^(?:\d+m|\d+(?:\.\d)?km)$/);
  expect(secondDistanceBox.y).toBeGreaterThan(secondCardBox.y + secondCardBox.height);
  expect(thirdCardBox.y).toBeGreaterThan(secondDistanceBox.y + secondDistanceBox.height);
  expect(routeButtonBox).toMatchObject({ x: 20, width: 353, height: 51 });
  expect(await cameraIcon.count()).toBe(1);
  expect(cameraIconBox).toMatchObject({ width: 24, height: 24 });
  const destinationCardBox = await page
    .getByTestId("itinerary-stop-list")
    .getByRole("article")
    .last()
    .boundingBox();
  if (!destinationCardBox || !cameraIconBox) {
    throw new Error("명장면 카드 또는 카메라 아이콘 위치를 확인할 수 없습니다.");
  }
  expect(destinationCardBox.x + destinationCardBox.width - cameraIconBox.x - cameraIconBox.width)
    .toBe(13);
  expect(cameraIconBox.y + cameraIconBox.height / 2)
    .toBeCloseTo(destinationCardBox.y + destinationCardBox.height / 2, 0);
  if (!timelineLineBox || !lastMarkerBox) {
    throw new Error("타임라인 선 또는 마지막 핀의 위치를 확인할 수 없습니다.");
  }
  expect(timelineLineBox.y + timelineLineBox.height)
    .toBeCloseTo(lastMarkerBox.y + lastMarkerBox.height / 2, 0);

  await page.setViewportSize({ width: 426, height: 373 });
  const shortFirstCardBox = await firstCard.boundingBox();
  const shortRouteButtonBox = await routeButton.boundingBox();
  if (!shortFirstCardBox || !shortRouteButtonBox) {
    throw new Error("낮은 기본 뷰에서 출발지 카드 또는 CTA 위치를 확인할 수 없습니다.");
  }
  expect(shortFirstCardBox.y + shortFirstCardBox.height)
    .toBeLessThanOrEqual(shortRouteButtonBox.y);
});

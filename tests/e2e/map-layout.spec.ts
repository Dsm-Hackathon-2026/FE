import { expect, test } from "@playwright/test";

test("하단 일정 패널의 Figma 좌표를 확인한다", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 1120 });
  await page.goto("/map/goblin?location=yeongjin-beach-1");

  const sheet = page.getByTestId("itinerary-sheet");
  const firstCard = page.getByTestId("itinerary-stop-list").getByRole("article").first();
  const routeButton = page.getByRole("button", { name: "루트 따라가기" });
  const timelineLine = page.getByTestId("itinerary-timeline-line");
  const lastMarker = page.getByTestId("itinerary-marker-4");
  const sheetBox = await sheet.boundingBox();
  const firstCardBox = await firstCard.boundingBox();
  const routeButtonBox = await routeButton.boundingBox();
  const timelineLineBox = await timelineLine.boundingBox();
  const lastMarkerBox = await lastMarker.boundingBox();

  expect(sheetBox?.y).toBeCloseTo(518, 0);
  expect(firstCardBox).toMatchObject({ x: 59, width: 314, height: 48 });
  expect(routeButtonBox).toMatchObject({ x: 20, width: 353, height: 51 });
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

import { expect, test } from "@playwright/test";

import { mockBackendApi, seedRecommendedRoutePlan } from "./apiMock";

test.beforeEach(async ({ page, context, baseURL }) => {
  await mockBackendApi(page);
  await seedRecommendedRoutePlan(page);
  await context.grantPermissions(["geolocation"], {
    origin: new URL(baseURL ?? "http://localhost:3100").origin,
  });
  await page.addInitScript(() => {
    const events = {
      spoken: [] as string[],
      vibrations: [] as (number | number[])[],
      wakeRequests: 0,
      wakeReleases: 0,
    };
    Object.assign(window, { __routeAssistEvents: events });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class {
        lang = "";
        constructor(public text: string) {}
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel() {},
        speak(utterance: { text: string }) {
          events.spoken.push(utterance.text);
        },
      },
    });
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: (pattern: number | number[]) => {
        events.vibrations.push(pattern);
        return true;
      },
    });
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: {
        async request() {
          events.wakeRequests += 1;
          return {
            async release() {
              events.wakeReleases += 1;
            },
          };
        },
      },
    });
  });
});

test("현재 위치를 따라 다음 장소를 전환하고 수동 지도 조작 후 복귀한다", async ({ page, context }) => {
  await context.setGeolocation({ latitude: 37.7641, longitude: 128.8996, accuracy: 10 });
  await page.goto("/map/1?plan=5");
  await page.getByRole("button", { name: "루트 따라가기" }).click();

  const guide = page.getByTestId("route-follow-status");
  await expect(guide).toHaveAttribute("data-follow-status", "following");
  await expect(guide).toContainText("다음 · 풍년건어물");
  await expect(page.locator('[data-active="true"]')).toContainText("풍년건어물");
  await expect.poll(async () => page.evaluate(() => (
    window as unknown as { __routeAssistEvents: { wakeRequests: number } }
  ).__routeAssistEvents.wakeRequests)).toBeGreaterThan(0);

  const mapSurface = page.locator('[data-testid="kakao-map"], [data-testid="map-preview"]').first();
  await mapSurface.dispatchEvent("pointerdown", { pointerType: "touch" });
  await expect(guide).toHaveAttribute("data-follow-status", "paused");
  await expect(guide).toContainText("화면 따라가기를 멈췄어요");
  await page.getByRole("button", { name: "내 위치로 돌아가기" }).click();
  await expect(guide).toHaveAttribute("data-follow-status", "following");

  await page.getByRole("button", { name: "음성 꺼짐" }).click();
  await page.getByRole("button", { name: "진동 꺼짐" }).click();
  await context.setGeolocation({ latitude: 37.8841, longitude: 128.8291, accuracy: 10 });

  await expect(guide).toContainText("다음 · 오드커피");
  const assistEvents = await page.evaluate(() => (
    window as unknown as {
      __routeAssistEvents: {
        spoken: string[];
        vibrations: (number | number[])[];
      };
    }
  ).__routeAssistEvents);
  expect(assistEvents.spoken).toContain("다경횟집에 도착했습니다.");
  expect(assistEvents.vibrations.length).toBeGreaterThan(1);
});

test("경로에서 연속으로 벗어나면 다음 장소까지 경로를 다시 표시한다", async ({ page, context }) => {
  await context.setGeolocation({ latitude: 37.7641, longitude: 128.8996, accuracy: 10 });
  await page.goto("/map/1?plan=5");
  await page.getByRole("button", { name: "루트 따라가기" }).click();

  const guide = page.getByTestId("route-follow-status");
  await expect(guide).toContainText("다음 · 풍년건어물");

  for (let step = 0; step < 3; step += 1) {
    await context.setGeolocation({
      latitude: 37.92 + step * 0.0001,
      longitude: 128.55 + step * 0.0001,
      accuracy: 10,
    });
    await page.waitForTimeout(120);
  }

  await expect(guide).toHaveAttribute("data-follow-status", "rerouting");
  await expect(guide).toContainText("경로를 벗어나");
  await expect(guide).toContainText("다음 · 풍년건어물");
});

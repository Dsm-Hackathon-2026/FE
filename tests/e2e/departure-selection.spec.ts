import { expect, test } from "@playwright/test";

import type { Itinerary } from "../../src/features/itineraries/itinerary";
import {
  DEPARTURE_REUSE_RADIUS_METERS,
  isRoutePlanReusable,
} from "../../src/features/itineraries/route-plan";
import {
  DIRECT_DEPARTURE_RADIUS_METERS,
  chooseRouteDeparture,
} from "../../src/features/map/kakao-map";

const storedItinerary: Itinerary = {
  id: "stored-route",
  title: "저장 일정",
  stops: [{
    id: "departure",
    order: 0,
    name: "강릉역",
    description: "여행 시작",
    address: "강원특별자치도 강릉시 용지로 176",
    kind: "station",
    coordinates: { latitude: 37.7641, longitude: 128.8996 },
  }],
};

test("가까운 촬영지는 현재 위치에서 바로 출발한다", () => {
  const current = { latitude: 37.5, longitude: 127 };
  const nearbyDestination = { latitude: 37.5, longitude: 127.01 };

  const departure = chooseRouteDeparture(current, nearbyDestination, [{
    name: "가까운역",
    address: "서울특별시 테스트로 1",
    coordinates: { latitude: 37.5, longitude: 127.001 },
  }]);

  expect(DIRECT_DEPARTURE_RADIUS_METERS).toBe(3_000);
  expect(departure).toEqual({
    name: "현재 위치",
    address: "현재 위치",
    coordinates: current,
    kind: "current-location",
  });
});

test("먼 촬영지는 단순 최단거리보다 목적지 방향을 반영해 출발지를 고른다", () => {
  const current = { latitude: 37.5, longitude: 127 };
  const destination = { latitude: 37.5, longitude: 127.3 };
  const nearestButOpposite = {
    name: "서쪽역",
    address: "서울특별시 서쪽로 1",
    coordinates: { latitude: 37.5, longitude: 126.989 },
  };
  const fartherButDirected = {
    name: "동쪽역",
    address: "서울특별시 동쪽로 1",
    coordinates: { latitude: 37.5, longitude: 127.023 },
  };

  const departure = chooseRouteDeparture(current, destination, [
    nearestButOpposite,
    fartherButDirected,
  ]);

  expect(departure).toEqual({ ...fartherButDirected, kind: "transit" });
});

test("먼 촬영지에서 교통시설 후보가 없으면 임의 출발지를 만들지 않는다", () => {
  const departure = chooseRouteDeparture(
    { latitude: 37.5, longitude: 127 },
    { latitude: 37.5, longitude: 127.3 },
    [],
  );

  expect(departure).toBeNull();
});

test("저장 일정은 같은 출발지에서만 재사용한다", () => {
  expect(DEPARTURE_REUSE_RADIUS_METERS).toBe(250);
  expect(isRoutePlanReusable(storedItinerary, {
    name: "강릉역",
    address: "강원특별자치도 강릉시 용지로 176",
    kind: "transit",
    coordinates: { latitude: 37.7642, longitude: 128.8997 },
  })).toBe(true);

  expect(isRoutePlanReusable(storedItinerary, {
    name: "다른 출발지",
    address: "강원특별자치도 강릉시 다른로 1",
    kind: "transit",
    coordinates: { latitude: 37.768, longitude: 128.8996 },
  })).toBe(false);

  expect(isRoutePlanReusable(storedItinerary, {
    name: "현재 위치",
    address: "강원특별자치도 강릉시 용지로 176",
    kind: "current-location",
    coordinates: { latitude: 37.7641, longitude: 128.8996 },
  })).toBe(false);
});

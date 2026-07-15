const VISIT_RECORD_VERSION = 1;
const VISIT_RECORD_PREFIX = "seongdeok:visit-record";

export type VisitRecord = {
  version: typeof VISIT_RECORD_VERSION;
  workId: string;
  planId: string;
  stopId: string;
  stopName: string;
  capturedAt: string;
  photoDataUrl: string;
};

function visitRecordKey(workId: string, planId: string, stopId: string) {
  return `${VISIT_RECORD_PREFIX}:${workId}:${planId}:${stopId}`;
}

function isVisitRecord(value: unknown): value is VisitRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.version === VISIT_RECORD_VERSION
    && typeof record.workId === "string"
    && typeof record.planId === "string"
    && typeof record.stopId === "string"
    && typeof record.stopName === "string"
    && typeof record.capturedAt === "string"
    && typeof record.photoDataUrl === "string";
}

export function saveVisitRecord(record: Omit<VisitRecord, "version">) {
  const storedRecord: VisitRecord = { version: VISIT_RECORD_VERSION, ...record };
  sessionStorage.setItem(
    visitRecordKey(record.workId, record.planId, record.stopId),
    JSON.stringify(storedRecord),
  );
}

export function readVisitRecord(workId: string, planId: string, stopId: string) {
  const serialized = sessionStorage.getItem(visitRecordKey(workId, planId, stopId));
  if (!serialized) return null;

  try {
    const record: unknown = JSON.parse(serialized);
    return isVisitRecord(record)
      && record.workId === workId
      && record.planId === planId
      && record.stopId === stopId
      ? record
      : null;
  } catch {
    return null;
  }
}

export function hasVisitRecord(workId: string, planId: string, stopId: string) {
  return readVisitRecord(workId, planId, stopId) !== null;
}

export function hasVisitRecordForStop(workId: string, stopId: string) {
  const keyPrefix = `${VISIT_RECORD_PREFIX}:${workId}:`;
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (!key?.startsWith(keyPrefix)) continue;
    const serialized = sessionStorage.getItem(key);
    if (!serialized) continue;
    try {
      const record: unknown = JSON.parse(serialized);
      if (isVisitRecord(record) && record.workId === workId && record.stopId === stopId) {
        return true;
      }
    } catch {
      // 손상된 보조 기록은 건너뛰고 다른 일정의 방문 기록을 계속 확인한다.
    }
  }
  return false;
}

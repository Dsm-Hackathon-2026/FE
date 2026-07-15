import type { ApiErrorBody, QueryPrimitive } from "./type";

const API_PREFIX = "/backend-api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function buildQuery(params: Record<string, QueryPrimitive>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function apiRequest(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorBody = isRecord(body) ? (body as ApiErrorBody) : undefined;
    throw new ApiError(
      errorBody?.message ?? `API 요청에 실패했습니다. (${response.status})`,
      response.status,
      errorBody,
    );
  }

  return body;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string") throw invalidResponse(key);
  return value;
}

export function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw invalidResponse(key);
  return value;
}

export function readBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "boolean") throw invalidResponse(key);
  return value;
}

export function readArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (!Array.isArray(value)) throw invalidResponse(key);
  return value;
}

export function invalidResponse(field?: string): Error {
  return new Error(
    field ? `API 응답의 ${field} 필드가 올바르지 않습니다.` : "API 응답 형식이 올바르지 않습니다.",
  );
}

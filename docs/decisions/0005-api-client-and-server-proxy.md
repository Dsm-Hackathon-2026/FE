# 0005. API client and server proxy

- 상태: 승인됨
- 날짜: 2026-07-14

## Context

백엔드 API는 별도 호스트에서 제공되며 브라우저에서 직접 호출하면 CORS와 HTTPS 혼합 콘텐츠 제약이 발생할 수 있다. 콘텐츠 탐색 화면은 캐시, 요청 중복 제거, 로딩 및 실패 상태 관리가 필요하다.

## Decision

- 서버 상태는 TanStack Query로 조회하고 변경한다.
- API 계약 타입은 기능별 `type.ts`, 요청 함수와 Query 옵션 및 훅은 같은 기능의 `index.ts`에 둔다.
- 외부 응답은 API 모듈 경계에서 런타임 검증한다.
- 브라우저는 `/backend-api` 동일 출처 경로를 호출하고 Next.js rewrite가 `API_BASE_URL`로 전달한다.
- QueryClient는 애플리케이션 레이아웃에서 한 번만 생성한다.

## Consequences

- UI는 백엔드 주소와 CORS 설정에 직접 의존하지 않는다.
- 배포 환경마다 서버 전용 `API_BASE_URL`을 설정해야 한다.
- API 스키마가 바뀌면 해당 도메인의 타입과 응답 파서를 함께 갱신해야 한다.

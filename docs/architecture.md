# Architecture

## Current stack

- Next.js 16 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS 4
- pnpm

## Delivery model

- 하나의 Next.js 코드베이스를 모바일 우선의 설치형 웹앱(PWA)으로 제공한다.
- Web App Manifest의 `standalone` 표시 모드를 앱 실행 경계로 사용한다.
- 별도 홍보 웹사이트나 iOS·Android 네이티브 프로젝트를 유지하지 않는다.
- 데스크톱 브라우저 지원은 동일한 반응형 웹앱의 호환 범위이며 별도 애플리케이션이 아니다.
- 서비스 워커가 필요한 오프라인 캐시, 푸시 알림, 백그라운드 동기화는 구체적인 제품 요구사항과 운영 정책이 정해질 때 별도 결정한다.

## Current structure

```text
src/
└── app/          # 라우트, 레이아웃, 메타데이터, 전역 스타일
```

기능이 늘어나면 아래 구조를 기본 방향으로 사용한다. 실제 필요가 생기기 전에는 빈 디렉터리를 만들지 않는다.

```text
src/
├── app/          # 라우팅과 화면 조합
├── features/     # 작품 탐색, 촬영지, 일정 등 기능별 UI와 로직
├── components/   # 여러 기능에서 재사용하는 표현 컴포넌트
└── lib/          # 프레임워크 독립적인 공통 코드와 외부 연동 경계
```

## Dependency rules

- `app`은 라우팅, 데이터 진입점, 화면 조합을 담당한다.
- 기능 고유 코드는 해당 `features/<feature>` 안에 둔다.
- `components`는 특정 기능의 상태나 데이터 계층에 의존하지 않는다.
- `lib`은 React 컴포넌트에 의존하지 않는다.
- 기능 사이의 내부 구현을 직접 import하지 않는다. 공유가 필요하면 명시적인 공개 모듈 또는 공통 계층을 만든다.
- 외부 입력은 시스템 경계에서 검증하고, 내부 코드가 추측한 데이터 형태에 의존하지 않게 한다.
- Server Component를 기본으로 하고 브라우저 API나 상호작용이 필요한 최소 경계에만 `"use client"`를 사용한다.

## Planned integration boundaries

- 프론트엔드는 백엔드 저장 구조에 직접 의존하지 않고 명시적인 HTTP API 계약을 사용한다.
- 백엔드 응답은 API 경계에서 검증한 뒤 도메인 타입으로 변환한다.
- 작품, 촬영지, 주변 장소, 일정 기능은 각각 독립적인 feature 경계를 갖는다.
- AI 일정 생성은 요청, 진행, 성공, 부분 결과, 실패, 재시도 상태를 명시적으로 모델링한다.
- 지도 SDK 객체와 지도 제공자 고유 타입은 지도 어댑터 내부에 격리한다.
- 브라우저에 노출 가능한 지도 JavaScript 키와 서버 전용 비밀 키를 구분한다.
- 로그인 도입 전에는 핵심 탐색 흐름이 인증 상태에 의존하지 않게 한다.

예상 기능 구조는 다음과 같으며 실제 화면 구현 시 필요한 부분부터 만든다.

```text
src/features/
├── works/        # 작품 탐색 및 상세
├── locations/    # 촬영지와 주변 장소
├── itineraries/  # AI 일정 생성 및 표시
└── map/          # 지도 제공자 어댑터와 지도 UI
```

## Architecture changes

새 데이터베이스, 인증 체계, 전역 상태 관리, UI 시스템처럼 여러 영역에 영향을 주는 결정은 구현과 함께 `docs/decisions/`에 기록한다.

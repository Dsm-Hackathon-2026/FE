# 성덕순례

드라마, 영화, 애니메이션의 촬영지와 배경 장소를 발견하고 AI로 성지순례 일정을 만드는 모바일 우선 설치형 웹앱(PWA)입니다. 별도 홍보 웹사이트나 네이티브 앱 없이 하나의 반응형 코드베이스로 제공합니다.

## 선정 기술 스택

- 프레임워크: Next.js 16 (App Router)
- UI 런타임: React 19
- 언어: TypeScript (strict mode)
- 스타일: Tailwind CSS 4
- 웹앱: Next.js Metadata API 기반 Web App Manifest
- 패키지 매니저: pnpm
- 품질 검사: ESLint, TypeScript
- 권장 런타임: Node.js 24 LTS

## 선택 기준

- 모바일 우선의 설치형 웹앱 하나를 반응형으로 개발합니다.
- 데스크톱 브라우저에서도 같은 웹앱을 제공하며 별도 웹 제품은 만들지 않습니다.
- App Router와 Server Components를 기본으로 사용해 불필요한 클라이언트 JavaScript를 줄입니다.
- 디자인 확정 전에는 UI 라이브러리와 상태 관리 라이브러리를 추가하지 않습니다.
- 현재 PWA 범위는 설치와 독립 실행에 필요한 매니페스트까지입니다. 오프라인 캐시, 푸시 알림, 설치 안내 UI는 요구사항 확정 후 추가합니다.

## 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 검사

```bash
pnpm check
pnpm test:e2e
pnpm verify
```

- `pnpm check`: ESLint와 TypeScript 정적 검사를 실행합니다.
- `pnpm test:e2e`: Chromium에서 애플리케이션 스모크 테스트를 실행합니다.
- `pnpm verify`: 정적 검사, 프로덕션 빌드, 브라우저 테스트를 실행하는 최종 완료 조건입니다.

최초 브라우저 테스트 실행 전에 Playwright 브라우저를 설치합니다.

```bash
pnpm exec playwright install chromium
```

## 에이전트 작업 환경

이 저장소는 코딩 에이전트가 요구사항을 발견하고 변경을 스스로 검증할 수 있도록 저장소 기반 하네스를 사용합니다.

- 작업 지침: `AGENTS.md`
- 제품 컨텍스트: `docs/product.md`
- 도메인 용어: `docs/domain.md`
- 아키텍처: `docs/architecture.md`
- 구현 규칙: `docs/conventions.md`
- 기술 결정: `docs/decisions/`
- 장기 작업 기록: `docs/tasks/`

## 디자인 확정 후 할 일

1. `src/app/layout.tsx`와 `src/app/manifest.ts`의 프로젝트명, 설명, 테마 색상을 실제 값으로 교체합니다.
2. `src/app/icon.svg`를 확정된 앱 아이콘 세트로 교체합니다.
3. 디자인 토큰과 공통 UI 컴포넌트를 정의한 뒤 화면 퍼블리싱을 시작합니다.
4. 필요할 때만 API 상태 관리, 폼, 인증, 테스트 도구를 선정합니다.

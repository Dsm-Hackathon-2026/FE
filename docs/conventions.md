# Engineering Conventions

## General

- 코드와 식별자는 영어로 작성한다.
- 사용자에게 보이는 문구와 프로젝트 문서는 기본적으로 한국어로 작성한다.
- 작은 함수와 명시적인 데이터 흐름을 선호한다.
- 새 추상화는 실제 중복이나 교체 가능한 경계가 확인될 때 도입한다.
- 오류를 삼키지 말고 호출자가 처리할 수 있는 형태로 전달하거나 관찰 가능한 방식으로 기록한다.

## TypeScript and React

- `any`, 불필요한 타입 단언, 검사 비활성화 주석을 피한다.
- 컴포넌트는 기본적으로 Server Component로 작성한다.
- React 컴포넌트 export 이름은 `PascalCase`를 사용하고, 컴포넌트 파일명은 `workSummary.tsx`처럼 `lowerCamelCase`를 사용한다.
- 아이콘 컴포넌트와 이미지·아이콘 자산의 파일명은 `close-icon.tsx`, `back-icon.svg`처럼 `kebab-case`를 사용한다.
- 데이터, 설정, 유틸리티 등 UI 컴포넌트를 보조하는 모듈은 `work-detail.ts`처럼 `kebab-case`를 사용한다.
- `page.tsx`, `layout.tsx`, `manifest.ts` 등 프레임워크가 예약한 파일명은 해당 프레임워크 규칙을 우선한다.
- 파생 가능한 상태를 별도 state로 저장하지 않는다.
- 접근 가능한 HTML 의미 구조와 키보드 사용을 기본 요구사항으로 취급한다.
- 사용자 입력과 외부 API 응답은 신뢰하지 않고 경계에서 검증한다.

## Typography

- 모든 사용자 표시 텍스트는 `Pretendard Variable`을 사용한다.
- 전역 스타일에서 제공하는 `font-sans` 토큰을 기본 경로로 사용하며, 컴포넌트마다 별도의 글꼴 이름을 임의로 선언하지 않는다.
- 운영체제 기본 글꼴과 `sans-serif`는 Pretendard를 불러오지 못했을 때의 fallback으로만 사용한다.
- 새로운 글꼴 패키지나 웹 폰트는 명시적인 제품 요구사항과 기술 결정 없이 추가하지 않는다.
- 로고와 아이콘 SVG는 글꼴 정책의 예외인 그래픽 자산이며, 일반 UI 문구를 SVG path로 대체하지 않는다.

## Dependencies

- 표준 API나 작은 로컬 구현으로 충분하면 의존성을 추가하지 않는다.
- 의존성을 추가할 때 목적, 유지보수 상태, 번들 및 보안 영향을 확인한다.
- 패키지 매니저는 pnpm만 사용하며 lockfile을 함께 갱신한다.

## Git commits

- 커밋 메시지는 Conventional Commits 형식인 `<type>(<scope>): <subject>`를 사용한다. 범위가 불필요하면 `<type>: <subject>`로 작성한다.
- 허용하는 기본 type은 `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `build`, `ci`, `perf`, `revert`다.
- `scope`는 `landing`, `works`, `locations`, `itineraries`, `map`, `docs`처럼 변경 영역을 짧은 영문 소문자로 표현한다.
- `subject`는 변경 결과를 명확하게 설명하고 마침표를 붙이지 않으며 72자 이내로 작성한다. 사용자 기능과 제품 문맥은 한국어로 작성할 수 있다.
- 하나의 커밋에는 하나의 논리적 변경만 포함하며, 관련 테스트와 문서는 구현과 같은 커밋에 포함한다.
- 호환성을 깨는 변경은 type 또는 scope 뒤에 `!`를 붙이고 본문의 `BREAKING CHANGE:` footer에 영향과 마이그레이션 방법을 기록한다.

예시:

```text
feat(landing): 인기 드라마 캐러셀 추가
fix(map): 지도 초기화 실패 시 재시도 처리
docs: Pretendard와 커밋 규칙 문서화
```

## Verification

- 문서만 변경한 경우에도 관련 링크와 명령이 실제 구조와 일치하는지 확인한다.
- 코드 변경은 최소한 `pnpm check`를 통과해야 한다.
- 완료를 보고하기 전에는 `pnpm verify`를 통과해야 한다.
- 사용자 동작을 바꾸는 기능에는 해당 동작을 재현하는 테스트를 추가한다. 테스트 기반이 아직 없다면 도입 필요성을 결과에 명시한다.

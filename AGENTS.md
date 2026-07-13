# Repository Guide

이 문서는 이 저장소에서 작업하는 코딩 에이전트의 기본 진입점이다.
제품 요구사항과 아키텍처 문서를 먼저 확인하고, 검증되지 않은 변경을 완료로 보고하지 않는다.

## Read first

- 제품 목표와 범위: `docs/product.md`
- 핵심 도메인 용어: `docs/domain.md`
- 아키텍처와 의존성 규칙: `docs/architecture.md`
- 구현 규칙: `docs/conventions.md`
- 기술 결정 기록: `docs/decisions/`
- 장기 작업 기록 방법: `docs/tasks/README.md`

## Commands

- 의존성 설치: `pnpm install --frozen-lockfile`
- 개발 서버: `pnpm dev`
- 빠른 정적 검사: `pnpm check`
- 브라우저 스모크 테스트: `pnpm test:e2e`
- 전체 검증: `pnpm verify`

## Required workflow

1. 요청과 관련된 코드, 문서, 기존 결정을 먼저 조사한다.
2. 요구사항이 불명확하면 되돌리기 어려운 결정을 임의로 확정하지 않는다.
3. 기존 구조와 변경을 보존하며, 요청을 만족하는 가장 작은 변경을 구현한다.
4. 동작 변경에는 가능한 한 자동화된 검증을 추가한다.
5. 완료 전 `pnpm verify`를 실행한다.
6. UI 변경은 실제 브라우저에서 핵심 상태, 반응형 레이아웃, 콘솔 오류를 확인한다.
7. 검증 실패를 숨기거나 검사를 비활성화하지 않는다.

## Definition of done

- 명시된 인수 조건을 모두 충족한다.
- `pnpm verify`가 통과한다.
- 새 환경 변수, 명령, 제약 또는 설계 결정이 문서화되어 있다.
- 남은 위험이나 검증하지 못한 항목을 결과에 명시한다.

## Safety boundaries

- 비밀 값과 실제 자격 증명을 저장소, 로그, 테스트 데이터에 기록하지 않는다.
- 파괴적 데이터 작업과 외부 배포는 명시적 승인 없이 실행하지 않는다.
- 생성 파일과 의존성 코드는 직접 수정하지 않는다.
- 품질 검사를 통과시키기 위해 TypeScript 또는 ESLint 규칙을 임의로 완화하지 않는다.

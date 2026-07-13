# 0001. Foundation stack

- 상태: 승인됨
- 날짜: 2026-07-13

## Context

웹과 모바일 화면을 하나의 코드베이스로 제공하면서, 제품 요구사항이 확정되기 전 불필요한 기술 선택을 최소화해야 한다.

## Decision

- Next.js App Router, React, TypeScript strict mode, Tailwind CSS를 사용한다.
- 패키지 매니저는 pnpm을 사용한다.
- Server Component를 기본 렌더링 모델로 사용한다.
- 상태 관리, UI, 폼, 인증 및 테스트 도구는 구체적인 요구사항에 따라 별도로 결정한다.

## Consequences

- 초기 의존성과 클라이언트 JavaScript를 작게 유지할 수 있다.
- 테스트와 데이터 계층은 제품 요구사항이 확정된 뒤 추가 결정이 필요하다.
- 새로운 기반 기술을 도입할 때 별도 결정 기록을 남겨야 한다.


# 0006. Vercel continuous deployment

- 상태: 승인됨
- 날짜: 2026-07-14

## Context

저장소는 Pull Request와 `main` push에서 전체 검증을 수행하지만, 검증된 변경을 프로덕션에 반영하는 자동 배포 경로가 없다. 프로덕션은 `seongdeok` Vercel 프로젝트에서 제공한다.

## Decision

- 기존 CI의 `verify` job이 성공한 `main` push만 Vercel 프로덕션에 배포한다.
- Pull Request와 다른 브랜치에서는 프로덕션 배포를 실행하지 않는다.
- Vercel CLI로 production 설정을 가져온 뒤 prebuilt artifact를 생성하고 배포한다.
- 동시 프로덕션 배포는 직렬화하며, 진행 중인 배포를 새 커밋이 취소하지 않는다.
- Vercel 프로젝트 식별자는 GitHub Actions Variables의 `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`로 관리한다.
- Vercel 인증 값은 GitHub Actions Secret의 `VERCEL_TOKEN`으로 관리한다.
- 백엔드 주소와 지도 키는 GitHub에 복제하지 않고 Vercel Production 환경 변수에서 가져온다.

## Consequences

- 검증을 통과하지 못한 변경은 프로덕션에 배포되지 않는다.
- GitHub Actions와 Vercel 프로젝트의 변수 및 Secret이 유지되어야 한다.
- 토큰을 교체하면 GitHub의 `VERCEL_TOKEN`도 함께 갱신해야 한다.

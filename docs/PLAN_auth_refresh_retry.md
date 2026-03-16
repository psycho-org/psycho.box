# 인증 401 처리 계획

작성일: 2026-03-16

## 배경

- 백엔드 API 문서상 인증 모델은 다음과 같다.
  - Access Token: `Authorization: Bearer <accessToken>`
  - Refresh Token: HTTP-only 쿠키
  - 토큰 갱신 API: `POST /api/v1/auth/refresh`
- 현재 프론트엔드는 로그인, 로그아웃, `auth/me` 복구 흐름은 갖고 있으나, 일반 보호 API 요청에서 `401 Unauthorized` 발생 시 자동 토큰 갱신과 재시도가 없다.

## 목표

- 보호된 `/api/real/**` 요청이 `401`을 반환하면 즉시 재로그인시키지 않는다.
- 먼저 `/api/real/auth/refresh`를 1회 호출한다.
- refresh 성공 시 원 요청을 1회 재시도한다.
- refresh도 실패하면 세션을 정리하고 `/login`으로 이동시킨다.

## 처리 원칙

### 1. 어떤 요청에 적용할지

자동 refresh 대상:

- 보호된 `/api/real/**` 요청

자동 refresh 제외:

- `/api/real/auth/login`
- `/api/real/auth/logout`
- `/api/real/auth/refresh`
- `/api/real/auth/me`
- 외부 URL 또는 비 API 요청

제외 이유:

- `login`: 로그인 실패 401은 정상 인증 실패다.
- `logout`: 로그아웃 중 401은 복구 대상이 아니다.
- `refresh`: 자기 자신을 다시 refresh 하면 루프가 생긴다.
- `me`: 현재 구현상 이미 refresh 기반으로 사용자 복구를 수행한다.

### 2. 실패 시 사용자 경험

- refresh 성공: 사용자는 별도 개입 없이 계속 작업한다.
- refresh 실패: 세션 만료로 간주한다.
- 실패 시 처리:
  - `/api/real/auth/logout` best-effort 호출
  - 브라우저에서 `/login`으로 이동

## 구현 항목

### A. Next.js API 라우트 추가

- `src/app/api/real/auth/refresh/route.ts`
- 내부적으로 `handleRefresh()`를 호출한다.

### B. 클라이언트 공통 요청부 보강

- `src/lib/client.ts`
- `apiRequest()`에 다음 로직 추가:
  1. 요청 실행
  2. 401이고 refresh 대상이면 refresh 시도
  3. refresh 성공 시 원 요청 재실행
  4. 재실패 또는 refresh 실패 시 세션 정리 및 로그인 이동

추가 고려사항:

- 동시에 여러 요청이 401이 나도 refresh는 한 번만 수행한다.
- refresh 완료 전 다른 요청은 같은 Promise를 기다린다.
- 원 요청 재시도는 최대 1회로 제한한다.

## 검증 시나리오

1. 로그인 직후 보호 API 호출이 정상 동작한다.
2. Access Token만 만료된 상태에서 보호 API 호출 시 자동 refresh 후 성공한다.
3. Refresh Token도 만료된 상태에서 보호 API 호출 시 `/login`으로 이동한다.
4. 로그인 페이지에서 잘못된 비밀번호로 인한 401은 자동 refresh 대상이 아니다.
5. `auth/me` 401은 기존 동작을 유지한다.

## 참고

- 백엔드 문서: `docs/API.md`
- 인증 서버 핸들러: `src/lib/server/http.ts`

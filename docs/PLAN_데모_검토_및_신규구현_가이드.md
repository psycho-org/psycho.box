# PLAN: 데모 검토 및 신규 구현 가이드

`front/psycho.box` 데모 프론트엔드의 의도적 구현 사항과, 신규 구현 시 중요하게 고려해야 할 부분을 정리합니다.

---

## 1. 의도적으로 구현된 부분

### 1.1 API 프록시 (Real vs Mock)

| 구분 | 경로 | 용도 |
|------|------|------|
| **Real** | `/api/real/*` | psycho.pizza 백엔드로 프록시. 서버에서 쿠키 기반 인증 처리 |
| **Mock** | `/api/mock/*` | 스프린트/프로젝트 등 미구현 API 대체. 메모리 기반 mock-store |

- 클라이언트는 `/api/real/...` 또는 `/api/mock/...`만 호출. 백엔드 URL 직접 노출 안 함.
- **인증**: Access Token, Refresh Token, User ID를 **쿠키**에 저장 (httpOnly, sameSite). CORS·크로스 도메인 이슈 회피.

### 1.2 인증 흐름 (서버 프록시)

- **로그인**: `POST /api/real/auth/login` → 서버가 psycho.pizza 호출 후 `psycho_access_token`, `psycho_refresh_token`, `psycho_user_id` 쿠키 설정
- **API 호출**: 서버 API Route가 쿠키에서 Access Token 읽어 `Authorization: Bearer` 헤더로 백엔드 전달
- **Refresh**: 별도 refresh 엔드포인트 (`/api/real/auth/refresh`) 존재. 클라이언트는 401 시 refresh 호출 후 재시도 패턴 적용 가능

### 1.3 워크스페이스 레지스트리 (Workspace Bookmark)

- **위치**: `src/lib/workspace-registry.ts`
- **저장소**: `localStorage` (`psycho_workspace_registry`)
- **역할**: 최근 방문 워크스페이스 목록 (최대 20개). 워크스페이스 전환 드롭다운에 사용
- **주의**: PLAN 문서의 "선택 워크스페이스 전역 상태"와 유사하나, 현재는 **북마크 목록** 용도. "현재 선택"은 URL `workspaceId`로 유지

### 1.4 워크스페이스 셸 (WorkspaceShell)

- **역할**: 사이드바 + 헤더 + 메인 영역 레이아웃
- **탭**: Overview, Tasks, Sprints, Projects
- **워크스페이스 전환**: 드롭다운 선택 시 `router.push(\`/workspace/${targetId}${currentSuffix}\`)` — 동일 서브경로 유지
- **경로**: `/workspace/[workspaceId]`, `/workspace/[workspaceId]/tasks` 등

### 1.5 Task N+1 워크어라운드 (enrichStatuses)

- **문제**: `TaskResponse.List`에 `status` 없음 → 목록 표시를 위해 각 task별 상세 API N번 호출
- **위치**: `src/app/workspace/[workspaceId]/tasks/page.tsx` — `enrichStatuses` 함수
- **백엔드 요청**: `docs/backend-request-2026-03-08.md` — TaskResponse.List에 status 추가 요청
- **신규 구현 시**: 백엔드에 status 포함되면 `enrichStatuses` 제거

### 1.6 Task API 경로 불일치

- **현재 프록시**: `/api/v1/${workspaceId}/tasks` (workspaces 세그먼트 없음)
- **psycho.pizza 실제**: `/api/v1/workspaces/{workspaceId}/tasks` (API.md 기준)
- **백엔드 요청**: `backend-request-2026-03-08.md`에서 workspaces 포함 경로로 변경 요청
- **조치**: 백엔드 실제 경로에 맞춰 프록시 수정 필요. 현재는 구버전 경로 사용 중일 수 있음

### 1.7 Task 삭제 — account 파라미터

- **현재**: `DELETE /api/real/workspaces/{workspaceId}/tasks/{taskId}/{userId}` — userId를 Path에 포함
- **psycho.pizza API**: `DELETE /workspaces/{id}/tasks/{id}?account={uuid}` — **Query** 파라미터
- **불일치**: 프론트는 Path, 백엔드는 Query. API 연동 시 수정 필요

### 1.8 디자인 시스템 (Tailwind v4 + @theme)

- **globals.css**: `@theme`로 커스텀 색상·브레이크포인트 정의
- **색상**: `bg`, `surface`, `surface-2`, `surface-3`, `line`, `text`, `text-soft`, `text-dim`, `accent`, `accent-soft`, `accent-dim`, `green`, `orange`, `red`, `blue`, `yellow`
- **브레이크포인트**: `--breakpoint-lg: 960px`
- **폰트**: DM Sans, Segoe UI

### 1.9 워크스페이스 진입 — "Open by Invite Key"

- **현재**: "Workspace Key" 입력으로 특정 workspaceId로 진입 시도
- **PLAN 문서**: "내 워크스페이스" 목록은 `GET /workspaces`로 조회. 현재 데모는 **워크스페이스 목록 API 미사용** — 북마크만 사용
- **차이**: PLAN의 "내 워크스페이스"는 API 기반 목록. 데모는 localStorage 북마크 + "Key로 열기"

---

## 2. 신규 구현 시 중요 사항

### 2.1 API 프록시 패턴 유지

- 클라이언트 → `/api/real/*` 또는 `/api/mock/*` 호출
- 서버 API Route에서 `proxyToBackend`로 psycho.pizza 호출
- **절대** 클라이언트에서 `BACKEND_API_URL` 직접 호출하지 말 것 (CORS, 쿠키 이슈)

### 2.2 인증 쿠키

- `psycho_access_token`, `psycho_refresh_token`, `psycho_user_id`
- `readCookie`(client.ts)로 `psycho_user_id`만 클라이언트에서 읽음 (account 파라미터 등)
- Access Token은 서버에서만 사용

### 2.3 workspaceId 전역 관리

- **현재**: URL `[workspaceId]`가 사실상 "선택된 워크스페이스"
- **PLAN**: WorkspaceProvider로 전역 상태화. URL과 동기화
- **권장**: 기존 workspace-registry(북마크) + 선택 workspaceId 전역 상태 분리 유지

### 2.4 403 처리

- 워크스페이스 접근 권한 없음(403) 시: workspaceId 초기화, `/access-denied` 리다이렉트
- `apiRequest`/`pagedApiRequest`에서 403 감지 시 공통 처리 훅 또는 인터셉터 도입 검토

### 2.5 Mock → Real 전환

- Sprints, Projects는 현재 **Mock** API 사용
- 백엔드 `GET /workspaces/{id}/sprints`, `GET /workspaces/{id}/projects` 구현 시 `/api/mock/...` → `/api/real/...`로 전환
- Mock 스키마(SprintPlaceholder, ProjectPlaceholder)와 Real API 응답 형식 정합성 확인

### 2.6 Task API 경로 정리

- 백엔드 실제 경로 확인 후 프록시 수정:
  - `GET/POST /api/v1/workspaces/{workspaceId}/tasks`
  - `GET /api/v1/workspaces/{workspaceId}/tasks/{taskId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/tasks/{taskId}?account={userId}`
  - `PATCH /api/v1/workspaces/{workspaceId}/tasks/{taskId}?account={userId}`

### 2.7 라우팅 구조 차이

| 데모 | PLAN |
|------|------|
| `/workspace` (단수) | `/workspaces` (복수) |
| `/workspace/[id]/tasks` | `/workspaces/[id]/tasks` |
| Overview, Tasks, Sprints, Projects | 스프린트 보드, 태스크, 멤버 관리 |

- PLAN 기준으로 확장 시 경로 정리 필요

### 2.8 의존성

- Next.js 16, React 19, Tailwind v4
- `BACKEND_API_URL`, `BACKEND_REFRESH_COOKIE_NAME` 환경 변수

---

## 3. 체크리스트 (신규 기능 구현 시)

- [ ] API 호출은 `/api/real/*` 또는 `/api/mock/*` 경로 사용
- [ ] 403 응답 시 `/access-denied` 리다이렉트 및 workspaceId 초기화
- [ ] Task 목록에 status 포함 여부 확인 후 enrichStatuses 제거 검토
- [ ] Task API 경로(workspaces 포함 여부, account 쿼리) 백엔드와 일치 확인
- [ ] globals.css @theme 색상·브레이크포인트 재사용
- [ ] WorkspaceShell 또는 PLAN 레이아웃에 맞는 새 Shell 컴포넌트 활용

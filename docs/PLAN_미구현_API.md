# PLAN: 미구현 백엔드 API

psycho.box 프론트엔드 개발에 필요하지만, 현재 psycho.pizza에 구현되지 않은 API 목록입니다.  
**개발 예정** API는 백엔드 팀에서 구현 계획이 확인된 항목입니다.

---

## 1. 필수 (없으면 화면 구현 불가)

### 1.1 워크스페이스 멤버 목록

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/workspaces/{workspaceId}/members` |
| **용도** | 멤버 관리 페이지 — 멤버 목록, 역할 표시 |
| **현재** | POST(추가), DELETE(제거)만 존재. 목록 조회 없음 |
| **응답 예시** | `[{ "accountId", "email", "name", "role", "joinedAt" }]` |

### 1.2 워크스페이스 프로젝트 목록

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/workspaces/{workspaceId}/projects` |
| **용도** | 사이드바 프로젝트 목록, 프로젝트 필터 |
| **현재** | `GET /projects/{projectId}` (단건)만 존재. 목록 조회 없음 |
| **상태** | **개발 예정** (project 모듈 하위 추가 목록) |
| **응답 예시** | `[{ "projectId", "name", "progress" }]` |

### 1.3 워크스페이스 스프린트 목록

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/workspaces/{workspaceId}/sprints` |
| **용도** | 스프린트 보드, 스프린트 선택, 로드맵 뷰 |
| **현재** | `GET /sprints/{sprintId}` (단건)만 존재. 목록 조회 없음 |
| **상태** | **개발 예정** (project 모듈 하위 추가 목록) |
| **응답 예시** | `[{ "sprintId", "name", "startDate", "endDate", "projectCount" }]` |

### 1.4 Analysis (AI 분석) — 조회 API

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/workspaces/{workspaceId}/analysis-requests` |
| **용도** | AI 분석 대시 — 분석 요청 목록 |
| **현재** | `POST /api/v1/{workspaceId}/analysis/request` (생성)만 존재 |
| **상태** | **개발 예정** |

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/workspaces/{workspaceId}/analysis-requests/{requestId}` |
| **용도** | 분석 요청 상세 조회 |
| **현재** | 없음 |
| **상태** | **개발 예정** |

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/workspaces/{workspaceId}/analysis-reports/{reportId}` (또는 동등 경로) |
| **용도** | AI 분석 리포트(요약·점수) 조회 |
| **현재** | 없음 |
| **상태** | **개발 예정** |

---

## 2. 권장 (없으면 클라이언트 부담 증가)

### 2.1 워크스페이스 목록 — 통계 포함

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/workspaces` 응답 확장 |
| **용도** | 내 워크스페이스 페이지 — 프로젝트 수, 태스크 수, 멤버 수 |
| **현재** | `id`, `title`, `role` 만 반환 |
| **필요 필드** | `projectCount`, `taskCount`, `memberCount` (또는 별도 통계 API) |

### 2.2 태스크 목록 — 필터 파라미터

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/workspaces/{workspaceId}/tasks` 쿼리 파라미터 확장 |
| **용도** | 내 태스크, 백로그, 완료됨 필터 |
| **현재** | `page`, `size` 만 지원 |
| **필요 파라미터** | `assigneeId`, `status`, `projectId`, `sprintId`, `backlog`(boolean) |

### 2.3 태스크 응답 — projectId, sprintId 포함

| 항목 | 내용 |
|------|------|
| **API** | Task List/Information 응답 확장 |
| **용도** | 로드맵 뷰, 백로그 판별, 프로젝트/스프린트 표시 |
| **현재** | `workspaceId` 만 포함. `projectId`, `sprintId` 없음 |
| **필요 필드** | `projectId`, `projectName`, `sprintId`, `sprintName` (선택) |

---

## 3. 선택 (프론트 대안 가능)

### 3.1 초대 대기 목록

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/workspaces/{workspaceId}/invitations` 또는 members 응답에 `pending` 포함 |
| **용도** | 멤버 관리 — "초대 대기중" 표시 |
| **현재** | 이메일 발송만. 초대 상태 저장/조회 없음 |
| **대안** | 초대 대기 UI 생략 또는 MailAuthToken 기반 별도 조회 |

### 3.2 태스크 태그

| 항목 | 내용 |
|------|------|
| **API** | Task에 `tags` 필드 추가 (또는 Tag 도메인) |
| **용도** | Feature/Design/Bug/Infra 등 타입 표시 |
| **현재** | 태그 없음 |
| **대안** | 프론트 전용 라벨 또는 API 확장 |

### 3.3 Task Status — IN_REVIEW

| 항목 | 내용 |
|------|------|
| **API** | Status enum에 `IN_REVIEW` 추가 |
| **용도** | Kanban "검토중" 컬럼 |
| **현재** | TODO, IN_PROGRESS, DONE, CANCELLED |
| **대안** | IN_PROGRESS에 "검토중" 의미 포함 또는 DONE 직전 단계로 매핑 |

### 3.4 워크스페이스 활동 상태

| 항목 | 내용 |
|------|------|
| **API** | 워크스페이스 목록/상세에 `lastActivityAt` |
| **용도** | "방금 활동", "2시간 전 활동" 표시 |
| **현재** | 없음 |
| **대안** | 해당 표시 생략 |

---

## 4. 우선순위 요약

| 우선순위 | API | 없을 때 영향 |
|----------|-----|--------------|
| **P0** | 멤버 목록, 프로젝트 목록, 스프린트 목록 | 멤버 관리, 사이드바, 스프린트 보드 구현 불가 |
| **P1** | 워크스페이스 통계, 태스크 필터, Task projectId/sprintId | 여러 API 호출로 우회 필요, 성능/복잡도 증가 |
| **P1** | Analysis 조회 (analysis-requests, analysis-reports) | AI 분석 대시·상세 구현 불가 |
| **P2** | 초대 대기, 태그, IN_REVIEW, 활동 상태 | UI 단순화 또는 생략으로 대체 가능 |

---

## 5. 개발 예정 API 요약

| API | 상태 |
|-----|------|
| `GET /workspaces/{id}/projects` | 개발 예정 |
| `GET /workspaces/{id}/sprints` | 개발 예정 |
| `GET /workspaces/{id}/analysis-requests` | 개발 예정 |
| `GET /workspaces/{id}/analysis-requests/{requestId}` | 개발 예정 |
| `GET /workspaces/{id}/analysis-reports/{reportId}` | 개발 예정 |

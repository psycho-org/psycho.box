# psycho.pizza API 문서

psycho.box(Next.js 프론트엔드)에서 참조하는 psycho.pizza 백엔드 API 문서입니다.

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| Base URL | `/api/v1` |
| 인증 | JWT Bearer Token (`Authorization: Bearer <accessToken>`) |
| Refresh Token | HTTP-only 쿠키 (자동 전송) |
| Content-Type | `application/json` |

### 공통 응답 형식 (ApiResponse)

```json
{
  "timestamp": "2025-03-14T12:00:00.000Z",
  "status": 200,
  "message": "success",
  "data": { ... }
}
```

### 페이지네이션 응답 (OffsetPagedApiResponse)

```json
{
  "timestamp": "...",
  "status": 200,
  "message": "success",
  "data": [ ... ],
  "pageInfo": {
    "currentPage": 1,
    "size": 10,
    "totalPages": 5,
    "totalElements": 50
  }
}
```

### 에러 응답 (ErrorResponse)

```json
{
  "timestamp": "...",
  "status": 400,
  "message": "에러 메시지",
  "error": "에러 상세",
  "code": "ERROR_CODE",
  "path": "/api/v1/...",
  "details": { "field": ["validation message"] }
}
```

### 인증 불필요 (Public) 경로

- `/api/v1/auth/**`
- `/api/v1/accounts/register`, `/api/v1/accounts/register/requests`, `/api/v1/accounts/register/confirmations`
- `/api/v1/mails/verify`

나머지 `/api/v1/**` 는 JWT 인증 필요.

---

## 2. Auth (인증)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/auth/login` | Public | 로그인 |
| POST | `/api/v1/auth/refresh` | Cookie | 토큰 갱신 |
| POST | `/api/v1/auth/logout` | Cookie | 로그아웃 |

### POST /api/v1/auth/login

**Request Body**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (data)**

```json
{
  "accessToken": "string",
  "user": {
    "id": "string (UUID)",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
}
```

- 성공 시 Refresh Token이 HTTP-only 쿠키로 설정됨.

### POST /api/v1/auth/refresh

- Request Body 없음. 쿠키의 Refresh Token 사용.
- Response: Login과 동일 (`accessToken`, `user`).

### POST /api/v1/auth/logout

- Request Body 없음. 쿠키의 Refresh Token으로 로그아웃 처리.
- Response (data): `{ "success": true }`

---

## 3. Account (계정)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/accounts/register` | Public | 회원가입 (확인 토큰 필요) |
| POST | `/api/v1/accounts/me/update/name` | JWT | 이름 변경 |
| POST | `/api/v1/accounts/me/password` | JWT | 비밀번호 변경 |
| POST | `/api/v1/accounts/me/withdraw` | JWT | 회원 탈퇴 |

### POST /api/v1/accounts/register

**Request Body**

```json
{
  "confirmationTokenId": "UUID (required)",
  "password": "string (required, 12-64자, 강한 비밀번호)",
  "givenName": "string (required)",
  "familyName": "string (required)"
}
```

**Response (data)**

```json
{
  "email": "string",
  "givenName": "string",
  "familyName": "string"
}
```

### POST /api/v1/accounts/me/update/name

**Request Body**

```json
{
  "givenName": "string (required)",
  "familyName": "string (required)"
}
```

**Response (data)**: `null` 또는 빈 객체

### POST /api/v1/accounts/me/password

**Request Body**

```json
{
  "confirmationTokenId": "UUID (required)",
  "currentPassword": "string (required)",
  "newPassword": "string (required, 12-64자)"
}
```

**Response (data)**: `null` 또는 빈 객체

### POST /api/v1/accounts/me/withdraw

**Request Body**

```json
{
  "confirmationTokenId": "UUID (required)",
  "password": "string (required)"
}
```

**Response (data)**: `null` 또는 빈 객체

---

## 4. Challenge (OTP / 확인)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/accounts/register/requests` | Public | 회원가입 OTP 요청 |
| POST | `/api/v1/accounts/register/confirmations` | Public | 회원가입 OTP 확인 |
| POST | `/api/v1/accounts/me/withdraw/requests` | JWT | 탈퇴 OTP 요청 |
| POST | `/api/v1/accounts/me/withdraw/confirmations` | JWT | 탈퇴 OTP 확인 |
| POST | `/api/v1/accounts/me/password/requests` | JWT | 비밀번호 변경 OTP 요청 |
| POST | `/api/v1/accounts/me/password/confirmations` | JWT | 비밀번호 변경 OTP 확인 |

### OTP 요청 (requests)

**Request Body**

```json
{
  "email": "string (required, email 형식)"
}
```

**Response (data)**

```json
{
  "challengeId": "UUID"
}
```

### OTP 확인 (confirmations)

**Request Body**

```json
{
  "challengeId": "UUID (required)",
  "otpCode": "string (required)"
}
```

**Response (data)**

```json
{
  "confirmationTokenId": "UUID",
  "verifiedEmail": "string"
}
```

- `confirmationTokenId`는 이후 register, password 변경, withdraw 시 사용.

---

## 5. Workspace (워크스페이스)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/workspaces` | JWT | 워크스페이스 목록 |
| POST | `/api/v1/workspaces` | JWT | 워크스페이스 생성 |
| GET | `/api/v1/workspaces/{workspaceId}` | JWT | 워크스페이스 상세 |
| POST | `/api/v1/workspaces/{workspaceId}/transfer-owner` | JWT | 소유권 이전 |
| DELETE | `/api/v1/workspaces/{workspaceId}` | JWT | 워크스페이스 삭제 |
| GET | `/api/v1/workspaces/{workspaceId}/members` | JWT | 멤버 목록 조회 |
| POST | `/api/v1/workspaces/{workspaceId}/members` | JWT | 멤버 추가 |
| DELETE | `/api/v1/workspaces/{workspaceId}/members` | JWT | 멤버 제거 |

### GET /api/v1/workspaces

**Response (data)**

```json
[
  {
    "id": "string (UUID)",
    "title": "string",
    "role": "OWNER | CREW"
  }
]
```

### POST /api/v1/workspaces

**Request Body**

```json
{
  "name": "string (required)",
  "description": "string"
}
```

**Response (data)**

```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string"
}
```

### GET /api/v1/workspaces/{workspaceId}

**Path Parameters**: `workspaceId` (UUID)

**Response (data)**: Create와 동일

### POST /api/v1/workspaces/{workspaceId}/transfer-owner

**Request Body**

```json
{
  "newOwnerAccountId": "UUID (required)"
}
```

**Response (data)**: 워크스페이스 상세

### DELETE /api/v1/workspaces/{workspaceId}

**Response (data)**

```json
{
  "id": "string (UUID)"
}
```

### GET /api/v1/workspaces/{workspaceId}/members

**Path Parameters**: `workspaceId` (UUID)

**Response (data)**: 멤버 목록 (워크스페이스 멤버만 조회 가능)

```json
[
  {
    "accountId": "string (UUID)",
    "email": "string",
    "name": "string",
    "role": "OWNER | CREW",
    "joinedAt": "string (ISO 8601)"
  }
]
```

### POST /api/v1/workspaces/{workspaceId}/members

**Request Body**

```json
{
  "accountId": "UUID (required)",
  "role": "CREW | OWNER (default: CREW)"
}
```

**Response (data)**

```json
{
  "accountId": "string (UUID)",
  "role": "string"
}
```

### DELETE /api/v1/workspaces/{workspaceId}/members

**Request Body**

```json
{
  "accountId": "UUID (required)"
}
```

**Response (data)**

```json
{
  "accountId": "string (UUID)",
  "role": "REMOVED"
}
```

---

## 6. Task (태스크)

모든 경로에 `workspaceId` (UUID) Path Parameter 필요.

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/workspaces/{workspaceId}/tasks` | JWT | 태스크 생성 |
| GET | `/api/v1/workspaces/{workspaceId}/tasks` | JWT | 태스크 목록 (페이지네이션) |
| GET | `/api/v1/workspaces/{workspaceId}/tasks/{id}` | JWT | 태스크 상세 |
| PATCH | `/api/v1/workspaces/{workspaceId}/tasks/{id}` | JWT | 태스크 수정 |
| DELETE | `/api/v1/workspaces/{workspaceId}/tasks/{id}` | JWT | 태스크 삭제 |

### POST /api/v1/workspaces/{workspaceId}/tasks

**Request Body**

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "assigneeId": "UUID (optional)",
  "dueDate": "ISO-8601 (optional)"
}
```

**Response (data)**: Task Information (아래 참조)

### GET /api/v1/workspaces/{workspaceId}/tasks

**Query Parameters**

| name | type | default | 설명 |
|------|------|---------|------|
| page | int | 1 | 페이지 번호 (1-based) |
| size | int | 10 | 페이지 크기 |

**Response (data)**: 페이지네이션. 각 항목:

```json
{
  "id": "UUID",
  "title": "string",
  "status": "TODO | IN_PROGRESS | DONE | CANCELLED",
  "assignee": { "id": "UUID", "name": "string", "email": "string" } | null,
  "dueDate": "ISO-8601 | null"
}
```

### GET /api/v1/workspaces/{workspaceId}/tasks/{id}

**Response (data)**

```json
{
  "id": "UUID",
  "title": "string",
  "description": "string",
  "status": "TODO | IN_PROGRESS | DONE | CANCELLED",
  "priority": "LOW | MEDIUM | HIGH | null",
  "assignee": { "id": "UUID", "name": "string", "email": "string" } | null,
  "workspaceId": "UUID",
  "dueDate": "ISO-8601 | null"
}
```

### PATCH /api/v1/workspaces/{workspaceId}/tasks/{id}

**Query Parameters**: `account` (UUID, required) — 실행자 계정 ID

**Request Body** (부분 수정, 필드 생략 시 변경 없음, null 시 clear)

```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "TODO | IN_PROGRESS | DONE | CANCELLED (optional)",
  "assigneeId": "UUID | null (optional)",
  "dueDate": "ISO-8601 | null (optional)",
  "priority": "LOW | MEDIUM | HIGH (optional)"
}
```

**Response (data)**: Task Information

### DELETE /api/v1/workspaces/{workspaceId}/tasks/{id}

**Query Parameters**: `account` (UUID, required)

**Response (data)**

```json
{
  "count": 1
}
```

---

## 7. Project (프로젝트)

모든 경로에 `workspaceId` (UUID) Path Parameter 필요.

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/workspaces/{workspaceId}/projects` | JWT | 프로젝트 생성 |
| GET | `/api/v1/workspaces/{workspaceId}/projects/{projectId}` | JWT | 프로젝트 상세 |
| PATCH | `/api/v1/workspaces/{workspaceId}/projects/{projectId}` | JWT | 프로젝트 수정 |
| DELETE | `/api/v1/workspaces/{workspaceId}/projects/{projectId}` | JWT | 프로젝트 삭제 |
| DELETE | `/api/v1/workspaces/{workspaceId}/projects/{projectId}/with-tasks` | JWT | 프로젝트 및 태스크 삭제 |
| POST | `/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks` | JWT | 프로젝트 내 태스크 생성 |
| GET | `/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks` | JWT | 프로젝트 내 태스크 목록 |
| PATCH | `/api/v1/workspaces/{workspaceId}/projects/{fromProjectId}/tasks/{taskId}/move` | JWT | 태스크를 다른 프로젝트로 이동 |

### POST /api/v1/workspaces/{workspaceId}/projects

**Request Body**

```json
{
  "name": "string (required)"
}
```

**Response (data)**

```json
{
  "workspaceId": "UUID",
  "projectId": "UUID",
  "name": "string",
  "progress": {
    "totalCount": 0,
    "completedCount": 0,
    "progress": 0.0
  }
}
```

### GET /api/v1/workspaces/{workspaceId}/projects/{projectId}

**Response (data)**: Create와 동일

### PATCH /api/v1/workspaces/{workspaceId}/projects/{projectId}

**Request Body**

```json
{
  "name": "string (optional)",
  "addTaskIds": ["UUID"] (optional, default: []),
  "removeTaskIds": ["UUID"] (optional, default: [])
}
```

**Response (data)**: `null` (성공 메시지만)

### DELETE /api/v1/workspaces/{workspaceId}/projects/{projectId}

**Query Parameters**: `account` (UUID, required)

**Response (data)**

```json
{
  "count": 1
}
```

### DELETE /api/v1/workspaces/{workspaceId}/projects/{projectId}/with-tasks

**Query Parameters**: `account` (UUID, required)

**Response (data)**

```json
{
  "projectCount": 1,
  "taskCount": 0
}
```

### POST /api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks

**Request Body**

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "assigneeId": "UUID (optional)",
  "dueDate": "ISO-8601 (optional)"
}
```

**Response (data)**: Task 정보

### GET /api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks

**Query Parameters**: `page`, `size` (페이지네이션, size default: 10)

**Response (data)**: 페이지네이션. 각 항목:

```json
{
  "id": "UUID",
  "title": "string",
  "status": "TODO | IN_PROGRESS | DONE | CANCELLED",
  "assignee": { "id": "UUID", "name": "string", "email": "string" } | null,
  "dueDate": "ISO-8601 | null"
}
```

### PATCH /api/v1/workspaces/{workspaceId}/projects/{fromProjectId}/tasks/{taskId}/move

**Path Parameters**: `fromProjectId`, `taskId`  
**Query Parameters**: `account` (UUID, required)

**Request Body**

```json
{
  "toProjectId": "UUID (required)"
}
```

**Response (data)**: `null` (성공 메시지만)

---

## 8. Sprint (스프린트)

모든 경로에 `workspaceId` (UUID) Path Parameter 필요.

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/workspaces/{workspaceId}/sprints` | JWT | 스프린트 생성 |
| GET | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}` | JWT | 스프린트 상세 |
| PATCH | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}` | JWT | 스프린트 수정 |
| DELETE | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}/{userId}` | JWT | 스프린트 삭제 |
| DELETE | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}/{userId}/with-tasks` | JWT | 스프린트 및 하위 삭제 |
| GET | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}/projects` | JWT | 스프린트 내 프로젝트 목록 |
| POST | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}/projects` | JWT | 스프린트 내 프로젝트 생성 |

### POST /api/v1/workspaces/{workspaceId}/sprints

**Request Body**

```json
{
  "name": "string (required)",
  "startDate": "ISO-8601 (required)",
  "endDate": "ISO-8601 (required)"
}
```

**Response (data)**

```json
{
  "workspaceId": "UUID",
  "sprintId": "UUID",
  "name": "string",
  "startDate": "ISO-8601",
  "endDate": "ISO-8601"
}
```

### GET /api/v1/workspaces/{workspaceId}/sprints/{sprintId}

**Response (data)**: Create와 동일

### PATCH /api/v1/workspaces/{workspaceId}/sprints/{sprintId}

**Request Body**

```json
{
  "name": "string (optional)",
  "startDate": "ISO-8601 (optional)",
  "endDate": "ISO-8601 (optional)",
  "addProjectIds": ["UUID"] (optional, default: []),
  "removeProjectIds": ["UUID"] (optional, default: [])
}
```

**Response (data)**: `null` (성공 메시지만)

### DELETE /api/v1/workspaces/{workspaceId}/sprints/{sprintId}/{userId}

**Path Parameters**: `sprintId`, `userId` (UUID)

**Response (data)**

```json
{
  "count": 1
}
```

### DELETE /api/v1/workspaces/{workspaceId}/sprints/{sprintId}/{userId}/with-tasks

**Response (data)**

```json
{
  "sprintCount": 1,
  "projectCount": 0,
  "taskCount": 0
}
```

### GET /api/v1/workspaces/{workspaceId}/sprints/{sprintId}/projects

**Response (data)**

```json
[
  {
    "projectId": "UUID",
    "name": "string",
    "progress": {
      "totalCount": 0,
      "completedCount": 0,
      "progress": 0.0
    }
  }
]
```

### POST /api/v1/workspaces/{workspaceId}/sprints/{sprintId}/projects

**Request Body**

```json
{
  "name": "string (required)"
}
```

**Response (data)**: 프로젝트 정보 (projectId, name, progress)

---

## 9. Analysis (AI 분석)

**주의**: 경로가 `/api/v1/workspaces/{workspaceId}/...` 가 아닌 `/api/v1/{workspaceId}/analysis` 입니다.

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/{workspaceId}/analysis/request` | JWT | 스프린트 분석 요청 생성 |

### POST /api/v1/{workspaceId}/analysis/request

**Path Parameters**: `workspaceId` (UUID)

**Request Body**

```json
{
  "target": {
    "sprintId": "UUID (required)"
  }
}
```

**Response (data)** — 201 Created

```json
{
  "analysisRequestId": "UUID",
  "status": "string",
  "createdAt": "ISO-8601"
}
```

---

## 10. Mail (메일)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/mails/verify` | Public | 메일 토큰 검증 (리다이렉트) |
| GET | `/api/v1/mails/templates` | JWT | 메일 템플릿 목록 |
| POST | `/api/v1/mails/send/workspaceinvite` | JWT | 워크스페이스 초대 메일 발송 |
| POST | `/api/v1/mails/send/general` | JWT | 일반 메일 발송 |
| POST | `/api/v1/mails/send/otp` | JWT | OTP 메일 발송 |
| POST | `/api/v1/mails/send` | JWT | 메일 타입별 발송 |

### GET /api/v1/mails/verify

**Query Parameters**: `token` (string)

- 토큰 검증 후 302 리다이렉트.

### GET /api/v1/mails/templates

**Response (data)**

```json
[
  {
    "mailType": "string",
    "title": "string",
    "description": "string",
    "actionType": "string | null",
    "tokenAuthEnabled": true,
    "tokenExpireHours": 24 | null,
    "variables": [
      {
        "name": "string",
        "required": true,
        "description": "string | null"
      }
    ]
  }
]
```

### POST /api/v1/mails/send/workspaceinvite

**Request Body**

```json
{
  "to": "string (required, email)",
  "workspaceName": "string (required)",
  "inviterName": "string (optional)",
  "inviteLink": "string (optional)",
  "workspaceId": "UUID (required)"
}
```

**Response (data)**

```json
{
  "status": "SUCCESS | FAILED"
}
```

### POST /api/v1/mails/send/general

**Request Body**

```json
{
  "to": "string (required)",
  "subject": "string (required)",
  "htmlContent": "string (required)",
  "from": "string (optional)"
}
```

**Response (data)**: `{ "status": "SUCCESS | FAILED" }`

### POST /api/v1/mails/send/otp

**Request Body**

```json
{
  "to": "string (required)",
  "otpCode": "string (required)",
  "otpPurpose": "string (optional)",
  "expiresInMinutes": 5
}
```

**Response (data)**: `{ "status": "SUCCESS | FAILED" }`

### POST /api/v1/mails/send

**Request Body**

```json
{
  "to": "string (required)",
  "mailType": "string (required, MessageType enum 값)",
  "params": { "key": "value" }
}
```

**Response (data)**: `{ "status": "SUCCESS | FAILED" }`

---

## 11. 타입 / Enum

### Task Status

| 값 | 설명 |
|----|------|
| TODO | 할 일 |
| IN_PROGRESS | 진행 중 |
| DONE | 완료 |
| CANCELLED | 취소 |

### Task Priority

| 값 | 설명 |
|----|------|
| LOW | 낮음 |
| MEDIUM | 중간 |
| HIGH | 높음 |

### Workspace Role

| 값 | 설명 |
|----|------|
| OWNER | 소유자 |
| CREW | 멤버 |

### MailSendStatus

| 값 | 설명 |
|----|------|
| SUCCESS | 발송 성공 |
| FAILED | 발송 실패 |

---

## 12. 주의사항

1. **account 쿼리 파라미터**: Task 삭제, Task 수정, Project 삭제, Project with-tasks 삭제, Task 이동 시 `account` (UUID) 쿼리 파라미터가 필요합니다. (TODO: 향후 `AuthenticationPrincipal`로 대체 예정)

2. **Analysis 경로**: Analysis API는 `/api/v1/{workspaceId}/analysis` 형태로, `workspaces` 세그먼트가 없습니다.

3. **Sprint 삭제**: `userId` Path Parameter가 필요합니다.

4. **날짜 형식**: `Instant` 타입은 ISO-8601 형식 (예: `2025-03-14T12:00:00.000Z`).

5. **Swagger UI**: 백엔드 실행 시 `/swagger-ui.html` 에서 API를 확인할 수 있습니다.

---

## 13. 개발 예정 API

아래 API는 백엔드 개발 예정이며, 현재 미구현 상태입니다.

### 13.1 Project (프로젝트 목록)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/workspaces/{workspaceId}/projects` | JWT | 워크스페이스 내 프로젝트 목록 조회 |

### 13.2 Sprint (스프린트 목록)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/workspaces/{workspaceId}/sprints` | JWT | 워크스페이스 내 스프린트 목록 조회 |

### 13.3 Analysis (AI 분석 — 조회 API)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/workspaces/{workspaceId}/analysis-requests` | JWT | 분석 요청 목록 조회 |
| GET | `/api/v1/workspaces/{workspaceId}/analysis-requests/{requestId}` | JWT | 분석 요청 상세 조회 |
| GET | `/api/v1/workspaces/{workspaceId}/analysis-reports/{reportId}` | JWT | 분석 리포트 조회 (또는 동등한 경로) |

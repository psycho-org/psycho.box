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
  "timestamp": "2026-03-16T00:00:00.000Z",
  "status": 200,
  "message": "success",
  "data": {}
}
```

### 페이지네이션 응답 (OffsetPagedApiResponse)

```json
{
  "timestamp": "2026-03-16T00:00:00.000Z",
  "status": 200,
  "message": "success",
  "data": [],
  "pageInfo": {
    "currentPage": 0,
    "size": 10,
    "totalPages": 1,
    "totalElements": 0
  }
}
```

### 에러 응답 형식 (ErrorResponse)

```json
{
  "timestamp": "2026-03-16T00:00:00.000Z",
  "status": 400,
  "message": "Invalid request",
  "error": "Bad Request",
  "code": "INVALID_REQUEST",
  "path": "/api/v1/...",
  "details": null,
  "meta": null
}
```

### 인증 불필요 (Public) 경로

SecurityConfig 기준 공개 경로:

- `/api/v1/auth/**`
- `/api/v1/accounts/policies/password`
- `/api/v1/accounts/register`
- `/api/v1/accounts/register/requests`
- `/api/v1/accounts/register/confirmations`
- `/api/v1/mails/verify`
- `/mail/**`
- `/actuator/**`
- `/v3/api-docs/**`
- `/swagger-ui/**`, `/swagger-ui.html`

그 외 `/api/v1/**`는 JWT 인증 필요.

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
  "email": "string (required, email)",
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

### POST /api/v1/auth/refresh

- Request Body 없음 (Refresh 쿠키 사용)
- Response (data): login과 동일 (`accessToken`, `user`)

### POST /api/v1/auth/logout

- Request Body 없음 (Refresh 쿠키 사용)
- Response (data):

```json
{
  "success": true
}
```

---

## 3. Account (계정)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/accounts/policies/password` | Public | 비밀번호 정책 조회 |
| POST | `/api/v1/accounts/register` | Public | 회원가입 |
| POST | `/api/v1/accounts/me/update/name` | JWT | 이름 변경 |
| POST | `/api/v1/accounts/me/password` | JWT | 비밀번호 변경 |
| POST | `/api/v1/accounts/me/withdraw` | JWT | 회원 탈퇴 |

### GET /api/v1/accounts/policies/password

**Response (data)**

```json
{
  "regex": "string",
  "message": "string"
}
```

### POST /api/v1/accounts/register

**Request Body**

```json
{
  "confirmationTokenId": "UUID (required)",
  "password": "string (required, 12~64자, strong password)",
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

**Response (data)**: `null` (성공 객체 없음)

### POST /api/v1/accounts/me/password

**Request Body**

```json
{
  "confirmationTokenId": "UUID (required)",
  "currentPassword": "string (required)",
  "newPassword": "string (required, 12~64자, strong password)"
}
```

**Response (data)**: `null`

### POST /api/v1/accounts/me/withdraw

**Request Body**

```json
{
  "confirmationTokenId": "UUID (required)",
  "password": "string (required)"
}
```

**Response (data)**: `null`

---

## 4. Challenge (OTP / 확인 토큰)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/accounts/register/requests` | Public | 회원가입 OTP 요청 |
| POST | `/api/v1/accounts/register/confirmations` | Public | 회원가입 OTP 확인 |
| POST | `/api/v1/accounts/me/password/requests` | JWT | 비밀번호 변경 OTP 요청 |
| POST | `/api/v1/accounts/me/password/confirmations` | JWT | 비밀번호 변경 OTP 확인 |
| POST | `/api/v1/accounts/me/withdraw/requests` | JWT | 회원탈퇴 OTP 요청 |
| POST | `/api/v1/accounts/me/withdraw/confirmations` | JWT | 회원탈퇴 OTP 확인 |

### requests

- register: body 필요
- me/password, me/withdraw: body 없음 (JWT 사용자 이메일 사용)

```json
{
  "email": "string (required, register 요청에서만)"
}
```

**Response (data)**

```json
{
  "challengeId": "UUID",
  "expiresAt": "ISO-8601"
}
```

### confirmations

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

#### Cooldown (`CHALLENGE_OTP_COOLDOWN_ACTIVE`)

OTP 재요청 쿨다운 시(HTTP 429), `meta`에 아래 정보 포함:

```json
{
  "meta": {
    "availableAt": "ISO-8601",
    "retryAfterSeconds": 60
  }
}
```

---

## 5. Workspace (워크스페이스)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/workspaces` | JWT | 내 워크스페이스 목록 |
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
    "id": "UUID",
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
  "description": "string (required, empty 허용)"
}
```

**Response (data)**

```json
{
  "id": "UUID",
  "name": "string",
  "description": "string"
}
```

### POST /api/v1/workspaces/{workspaceId}/transfer-owner

**Request Body**

```json
{
  "newOwnerAccountId": "UUID (required)"
}
```

**Response (data)**: Workspace Detail

### DELETE /api/v1/workspaces/{workspaceId}

**Response (data)**

```json
{
  "id": "UUID"
}
```

### GET /api/v1/workspaces/{workspaceId}/members

**Response (data)**

```json
[
  {
    "membershipId": "UUID",
    "accountId": "UUID",
    "name": "string",
    "role": "OWNER | CREW",
    "joinedAt": "ISO-8601 | null"
  }
]
```

### POST /api/v1/workspaces/{workspaceId}/members

**Request Body**

```json
{
  "accountId": "UUID (required)",
  "role": "OWNER | CREW (optional, default: CREW)"
}
```

**Response (data)**

```json
{
  "accountId": "UUID",
  "role": "OWNER | CREW"
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
  "accountId": "UUID",
  "role": "REMOVED"
}
```

---

## 6. Task (태스크)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/workspaces/{workspaceId}/tasks` | JWT | 태스크 생성 |
| GET | `/api/v1/workspaces/{workspaceId}/tasks` | JWT | 태스크 목록 조회(페이지) |
| GET | `/api/v1/workspaces/{workspaceId}/tasks/{id}` | JWT | 태스크 상세 조회 |
| PATCH | `/api/v1/workspaces/{workspaceId}/tasks/{id}` | JWT | 태스크 수정 |
| DELETE | `/api/v1/workspaces/{workspaceId}/tasks/{id}` | JWT | 태스크 삭제 |

### GET /api/v1/workspaces/{workspaceId}/tasks

**Query**

- `page` (기본 0)
- `size` (기본 10)

### POST /api/v1/workspaces/{workspaceId}/tasks

**Request Body**

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "assigneeId": "UUID | null",
  "dueDate": "ISO-8601 | null"
}
```

### GET /api/v1/workspaces/{workspaceId}/tasks/{id} 응답 예시 (data)

```json
{
  "id": "UUID",
  "title": "string",
  "description": "string",
  "status": "TODO | IN_PROGRESS | DONE | CANCELLED",
  "priority": "LOW | MEDIUM | HIGH | null",
  "assignee": {
    "id": "UUID",
    "name": "string",
    "email": "string"
  },
  "workspaceId": "UUID",
  "dueDate": "ISO-8601 | null"
}
```

### PATCH /api/v1/workspaces/{workspaceId}/tasks/{id}

**Query Parameters**

- `account` (UUID, required)

**Request Body (Patch semantics)**

- 필드 생략: 변경 없음
- nullable 필드에 `null` 명시: 값 clear

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

### DELETE /api/v1/workspaces/{workspaceId}/tasks/{id}

**Query Parameters**

- `account` (UUID, required)

**Response (data)**

```json
{
  "count": 1
}
```

---

## 7. Project (프로젝트)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/workspaces/{workspaceId}/projects` | JWT | 프로젝트 생성 |
| GET | `/api/v1/workspaces/{workspaceId}/projects/{projectId}` | JWT | 프로젝트 상세 |
| PATCH | `/api/v1/workspaces/{workspaceId}/projects/{projectId}` | JWT | 프로젝트 수정 |
| DELETE | `/api/v1/workspaces/{workspaceId}/projects/{projectId}` | JWT | 프로젝트 삭제 |
| POST | `/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks` | JWT | 프로젝트 내 태스크 생성 |
| GET | `/api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks` | JWT | 프로젝트 내 태스크 목록 |
| PATCH | `/api/v1/workspaces/{workspaceId}/projects/{fromProjectId}/tasks/{taskId}/move` | JWT | 태스크 프로젝트 이동 |

### 공통 Query Parameters

- 아래 경로는 `account` (UUID, required) 필요:
  - `PATCH /projects/{projectId}`
  - `DELETE /projects/{projectId}`
  - `POST /projects/{projectId}/tasks`
  - `PATCH /projects/{fromProjectId}/tasks/{taskId}/move`

### POST /api/v1/workspaces/{workspaceId}/projects

```json
{
  "name": "string (required)"
}
```

### PATCH /api/v1/workspaces/{workspaceId}/projects/{projectId}

```json
{
  "name": "string (optional)",
  "addTaskIds": ["UUID"],
  "removeTaskIds": ["UUID"]
}
```

### DELETE /api/v1/workspaces/{workspaceId}/projects/{projectId}

**Response (data)**

```json
{
  "projectCount": 1,
  "taskCount": 0
}
```

### POST /api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "assigneeId": "UUID | null",
  "dueDate": "ISO-8601 | null"
}
```

### GET /api/v1/workspaces/{workspaceId}/projects/{projectId}/tasks

**Query**

- `page` (기본 0)
- `size` (기본 10)

**Task 응답 필드**

- `id`, `title`, `status`, `assignee`, `dueDate`, `isWithinSprintPeriod`

### PATCH /api/v1/workspaces/{workspaceId}/projects/{fromProjectId}/tasks/{taskId}/move

```json
{
  "toProjectId": "UUID (required)"
}
```

---

## 8. Sprint (스프린트)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/workspaces/{workspaceId}/sprints` | JWT | 스프린트 목록 조회(페이지) |
| POST | `/api/v1/workspaces/{workspaceId}/sprints` | JWT | 스프린트 생성 |
| GET | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}` | JWT | 스프린트 상세 |
| PATCH | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}` | JWT | 스프린트 수정 |
| DELETE | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}` | JWT | 스프린트 삭제 |
| GET | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}/projects` | JWT | 스프린트 내 프로젝트 목록 |
| POST | `/api/v1/workspaces/{workspaceId}/sprints/{sprintId}/projects` | JWT | 스프린트 내 프로젝트 생성 |

### GET /api/v1/workspaces/{workspaceId}/sprints

**Query**

- `page` (기본 0)
- `size` (기본 10)

### POST /api/v1/workspaces/{workspaceId}/sprints

```json
{
  "name": "string (required)",
  "goal": "string | null",
  "startDate": "ISO-8601 (required)",
  "endDate": "ISO-8601 (required)"
}
```

### PATCH /api/v1/workspaces/{workspaceId}/sprints/{sprintId}

**Query Parameters**

- `account` (UUID, required)

**Request Body**

```json
{
  "name": "string (optional)",
  "goal": "Patch<string> (optional)",
  "startDate": "ISO-8601 (optional)",
  "endDate": "ISO-8601 (optional)",
  "addProjectIds": ["UUID"],
  "removeProjectIds": ["UUID"]
}
```

### DELETE /api/v1/workspaces/{workspaceId}/sprints/{sprintId}

**Query Parameters**

- `account` (UUID, required)

**Response (data)**

```json
{
  "sprintCount": 1,
  "projectCount": 0,
  "taskCount": 0
}
```

---

## 9. Analysis (AI 분석)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/workspace/{workspaceId}/analysis-requests` | JWT | 스프린트 분석 요청 생성 |
| GET | `/api/v1/workspace/{workspaceId}/analysis-requests` | JWT | 특정 워크스페이스/스프린트의 분석 요청 목록 조회 |
| GET | `/api/v1/workspace/{workspaceId}/analysis-requests/{analysisRequestId}/report` | JWT | 분석 요청 리포트 조회 |

### POST /api/v1/workspace/{workspaceId}/analysis-requests

**Path Parameters**

- `workspaceId` (UUID, required)

```json
{
  "sprintId": "UUID (required)"
}
```

**Response (data, 201 Created)**

```json
{
  "analysisRequestId": "UUID",
  "status": "QUEUED | RUNNING | DONE | FAILED",
  "createdAt": "ISO-8601"
}
```

### GET /api/v1/workspace/{workspaceId}/analysis-requests

**Path Parameters**

- `workspaceId` (UUID, required)

**Query Parameters**

- `sprintId` (UUID, required)

**Response (data)**

```json
{
  "items": [
    {
      "analysisRequestId": "UUID",
      "status": "QUEUED | RUNNING | DONE | FAILED",
      "hasReport": true,
      "requestedAt": "ISO-8601"
    }
  ]
}
```

### GET /api/v1/workspace/{workspaceId}/analysis-requests/{analysisRequestId}/report

**Path Parameters**

- `workspaceId` (UUID, required)
- `analysisRequestId` (UUID, required)

**Response (data)**

```json
{
  "workspaceId": "UUID",
  "sprintId": "UUID",
  "analysisRequestId": "UUID",
  "status": "QUEUED | RUNNING | DONE | FAILED",
  "totalScore": 0,
  "result": "string | null",
  "createdAt": "ISO-8601 | null"
}
```

---

## 10. Mail (메일)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/mails/verify` | Public | 메일 토큰 검증 후 리다이렉트 |
| GET | `/api/v1/mails/templates` | JWT | 메일 템플릿 목록 |
| POST | `/api/v1/mails/send/workspaceinvite` | JWT | 워크스페이스 초대 메일 발송 |
| POST | `/api/v1/mails/send/general` | JWT | 일반 메일 발송 |
| POST | `/api/v1/mails/send/otp` | JWT | OTP 메일 발송 |
| POST | `/api/v1/mails/send` | JWT | mailType 기반 발송 |

### GET /api/v1/mails/verify

**Query Parameters**

- `token` (required)

성공/실패에 따라 설정된 URL로 `302 Found` 리다이렉트합니다.

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
    "tokenExpireHours": 24,
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

```json
{
  "to": "string (required)",
  "workspaceName": "string (required)",
  "inviterName": "string | null",
  "inviteLink": "string | null",
  "workspaceId": "UUID (required)"
}
```

### POST /api/v1/mails/send/general

```json
{
  "to": "string (required)",
  "subject": "string (required)",
  "htmlContent": "string (required)",
  "from": "string | null"
}
```

### POST /api/v1/mails/send/otp

```json
{
  "to": "string (required)",
  "otpCode": "string (required)",
  "otpPurpose": "string | null",
  "expiresInMinutes": 5
}
```

### POST /api/v1/mails/send

```json
{
  "to": "string (required)",
  "mailType": "OTP | WORKSPACE_INVITE | EMAIL_ALREADY_EXISTS",
  "params": {
    "key": "value"
  }
}
```

### Mail send 응답 (공통 data)

```json
{
  "status": "SUCCESS | FAILED"
}
```

---

## 11. Enum

### Task Status

- `TODO`
- `IN_PROGRESS`
- `DONE`
- `CANCELLED`

### Task Priority

- `LOW`
- `MEDIUM`
- `HIGH`

### Workspace Role

- `OWNER`
- `CREW`

### MailSendStatus

- `SUCCESS`
- `FAILED`

### MessageType

- `OTP`
- `WORKSPACE_INVITE`
- `EMAIL_ALREADY_EXISTS`

---

## 12. 참고 사항

1. Task / Project / Sprint 일부 수정·삭제 API는 `account` 쿼리 파라미터(UUID)가 필요합니다.
2. 날짜/시간 필드는 `Instant` 직렬화 기준 `ISO-8601` (`2026-03-16T00:00:00Z`) 형식입니다.
3. Swagger 확인 경로: `/swagger-ui.html` (환경 설정에 따라 접근 제한 가능).

# 백엔드 에러 코드 매핑

psycho.pizza 백엔드 API 에러 응답의 `code` 필드와 프론트엔드 노출 메시지 매핑입니다.

## 에러 응답 형식

```json
{
  "timestamp": "2025-03-14T12:00:00.000Z",
  "status": 400,
  "message": "에러 메시지 (영문)",
  "error": "Bad Request",
  "code": "ERROR_CODE",
  "path": "/api/v1/...",
  "details": null
}
```

- `code`: 에러 식별자 (null일 수 있음, Validation Failed 등)
- `message`: 백엔드 기본 메시지 (영문)

---

## Common

| Code | HTTP | 백엔드 메시지 | 프론트 메시지 |
|------|------|---------------|---------------|
| `COMMON_INVALID_EMAIL` | 400 | Invalid email | 이메일 형식이 올바르지 않습니다. |

---

## Account (계정)

| Code | HTTP | 백엔드 메시지 | 프론트 메시지 |
|------|------|---------------|---------------|
| `ACCOUNT_EMAIL_ALREADY_REGISTERED` | 409 | Email already registered | 이미 가입된 이메일입니다. |
| `ACCOUNT_NOT_FOUND` | 404 | Account not found | 계정을 찾을 수 없습니다. |
| `ACCOUNT_INVALID_NAME` | 400 | Invalid name | 이름이 올바르지 않습니다. |
| `ACCOUNT_INVALID_DISPLAY_NAME` | 400 | Invalid display name | 표시 이름이 올바르지 않습니다. |
| `ACCOUNT_INVALID_CREDENTIALS` | 401 | Invalid credentials | 인증 정보가 올바르지 않습니다. |
| `ACCOUNT_INVALID_CONFIRMATION_TOKEN` | 401 | Invalid or expired confirmation token | 확인 토큰이 만료되었거나 올바르지 않습니다. |
| `ACCOUNT_WITHDRAWAL_BLOCKED_BY_OWNED_WORKSPACE` | 409 | Transfer ownership or delete owned workspaces before withdrawing | 소유한 워크스페이스를 양도하거나 삭제한 후 탈퇴해 주세요. |

---

## Auth (인증)

| Code | HTTP | 백엔드 메시지 | 프론트 메시지 |
|------|------|---------------|---------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password | 이메일 또는 비밀번호가 올바르지 않습니다. |
| `AUTH_INVALID_REFRESH_TOKEN` | 401 | Invalid refresh token | 세션이 만료되었습니다. 다시 로그인해 주세요. |

---

## Challenge (OTP/챌린지)

| Code | HTTP | 백엔드 메시지 | 프론트 메시지 |
|------|------|---------------|---------------|
| `CHALLENGE_OTP_COOLDOWN_ACTIVE` | 429 | Please wait before requesting a new OTP | OTP 재요청 전 잠시 기다려 주세요. |
| `CHALLENGE_NOT_FOUND` | 404 | Challenge not found | 인증 요청을 찾을 수 없습니다. |
| `CHALLENGE_EXPIRED` | 410 | Challenge has expired | 인증 시간이 만료되었습니다. 다시 요청해 주세요. |
| `CHALLENGE_MAX_ATTEMPTS_EXCEEDED` | 429 | Maximum attempts exceeded | 시도 횟수를 초과했습니다. 다시 요청해 주세요. |
| `CHALLENGE_INVALID_OTP` | 401 | Invalid OTP code | OTP 코드가 올바르지 않습니다. |

---

## Message (메시지/메일)

| Code | HTTP | 백엔드 메시지 | 프론트 메시지 |
|------|------|---------------|---------------|
| `MESSAGE_REQUIRED_FIELD_MISSING` | 400 | Required message field is missing | 필수 항목이 누락되었습니다. |
| `MESSAGE_INVALID_PARAM` | 400 | Invalid message parameter | 요청 값이 올바르지 않습니다. |
| `MESSAGE_INVALID_NUMBER_PARAM` | 400 | Message parameter must be a valid number | 숫자 형식이 올바르지 않습니다. |
| `MESSAGE_POSITIVE_NUMBER_REQUIRED` | 400 | Message parameter must be positive | 양수만 입력 가능합니다. |
| `MESSAGE_INVALID_UUID_PARAM` | 400 | Message parameter must be a valid UUID | 잘못된 식별자입니다. |
| `MESSAGE_INVALID_EMAIL_PARAM` | 400 | Message parameter must be a valid email | 이메일 형식이 올바르지 않습니다. |
| `MESSAGE_MAIL_UNSUPPORTED_TYPE` | 400 | Unsupported mail type | 지원하지 않는 메일 유형입니다. |
| `MESSAGE_CHANNEL_NOT_SUPPORTED` | 400 | Message channel is not supported | 지원하지 않는 채널입니다. |
| `MESSAGE_TOKEN_AUTH_NOT_SUPPORTED` | 400 | Token authentication is not supported | 토큰 인증을 지원하지 않습니다. |
| `MESSAGE_MAIL_TEMPLATE_NOT_FOUND` | 404 | Mail template not found | 메일 템플릿을 찾을 수 없습니다. |
| `MESSAGE_MAIL_TEMPLATE_RENDER_FAILED` | 400 | Failed to render mail template | 메일 생성에 실패했습니다. |
| `MESSAGE_MAIL_DUPLICATE_PENDING_AUTH_TOKEN` | 409 | Duplicate pending mail auth token | 이미 발송된 인증 메일이 있습니다. |
| `MESSAGE_MAIL_VERIFY_URL_REQUIRED` | 500 | Mail verify URL is required | (내부 오류) |
| `MESSAGE_MAIL_TOKEN_EXPIRE_HOURS_REQUIRED` | 500 | Token expire hours is required | (내부 오류) |
| `MESSAGE_MAIL_ACTION_TYPE_REQUIRED` | 500 | Mail action type is required | (내부 오류) |

---

## Project (프로젝트)

| Code | HTTP | 백엔드 메시지 | 프론트 메시지 |
|------|------|---------------|---------------|
| `PROJECT_ID_NULL` | 400 | project_id is null. | 프로젝트 ID가 필요합니다. |
| `PROJECT_NOT_FOUND` | 404 | Project not found | 프로젝트를 찾을 수 없습니다. |
| `PROJECT_NAME_NULL` | 400 | Project name is null. | 프로젝트 이름이 필요합니다. |
| `TASK_NOT_FOUND` | 404 | Task not found | 작업을 찾을 수 없습니다. |
| `SAME_PROJECT` | 400 | Same project | 동일한 프로젝트입니다. |
| `INVALID_REQUEST` | 400 | Invalid request | 잘못된 요청입니다. |

---

## Task (작업)

| Code | HTTP | 백엔드 메시지 | 프론트 메시지 |
|------|------|---------------|---------------|
| `TASK_NOT_FOUND` | 404 | Task not found | 작업을 찾을 수 없습니다. |
| `TASK_ID_NULL` | 400 | Task ID must not be null | 작업 ID가 필요합니다. |
| `TITLE_NOT_VALID` | 400 | Title not valid | 제목이 올바르지 않습니다. |
| `DESCRIPTION_NOT_VALID` | 400 | Description not valid | 설명이 올바르지 않습니다. |
| `TASK_INFO_NOT_FOUND` | 400 | Task information not found | 작업 정보를 찾을 수 없습니다. |
| `INVALID_TRANSITION` | 400 | Invalid transition | 잘못된 상태 변경입니다. |
| `INVALID_REQUEST` | 400 | Invalid request | 잘못된 요청입니다. |

---

## Workspace (워크스페이스)

| Code | HTTP | 백엔드 메시지 | 프론트 메시지 |
|------|------|---------------|---------------|
| `WORKSPACE_NOT_FOUND` | 404 | Workspace not found | 워크스페이스를 찾을 수 없습니다. |
| `WORKSPACE_MEMBERSHIP_NOT_FOUND` | 404 | Workspace membership not found | 멤버십을 찾을 수 없습니다. |
| `WORKSPACE_OWNER_REQUIRED` | 403 | Only workspace owner can perform this action | 워크스페이스 소유자만 가능합니다. |
| `WORKSPACE_MEMBER_ALREADY_EXISTS` | 409 | Workspace membership already exists | 이미 멤버로 등록되어 있습니다. |
| `WORKSPACE_OWNER_REMOVAL_FORBIDDEN` | 400 | Workspace owner cannot be removed | 소유자는 제거할 수 없습니다. |
| `WORKSPACE_TRANSFER_OWNERSHIP_FAILED` | 400 | Failed to transfer workspace ownership | 소유권 양도에 실패했습니다. |
| `WORKSPACE_ADD_MEMBER_FAILED` | 400 | Failed to add workspace member | 멤버 추가에 실패했습니다. |
| `WORKSPACE_REMOVE_MEMBER_FAILED` | 400 | Failed to remove workspace member | 멤버 제거에 실패했습니다. |

---

## 기타 (code 없음)

| 상황 | HTTP | 메시지 | 프론트 메시지 |
|------|------|--------|---------------|
| Validation Failed | 400 | Validation Failed | 입력값을 확인해 주세요. |
| Malformed JSON | 400 | Malformed JSON request | 요청 형식이 올바르지 않습니다. |
| Forbidden | 403 | Forbidden | 접근 권한이 없습니다. |
| Internal Server Error | 500 | Internal Server Error | 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. |

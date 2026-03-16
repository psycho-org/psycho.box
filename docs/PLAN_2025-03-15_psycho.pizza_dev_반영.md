# 2025-03-15 psycho.pizza dev 브랜치 반영 계획

psycho.pizza dev 브랜치 업데이트 사항을 psycho.box(프론트엔드)에 반영하기 위한 리스트업 및 오늘 작업 계획입니다.

---

## 1. 변경/추가된 API 리스트

### 1.1 추가된 API

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| **GET** | `/api/v1/accounts/policies/password` | **Public** | 비밀번호 정책 조회 (회원가입/비밀번호 변경 시 프론트 검증용) |

**Response (data)**

```json
{
  "regex": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{12,64}$",
  "message": "비밀번호는 12자 이상이며, 대문자·소문자·숫자·특수문자를 모두 포함해야 합니다."
}
```

---

### 1.2 변경된 API (응답 스키마)

#### Challenge (OTP)

| API | 변경 내용 |
|-----|----------|
| **POST /api/v1/accounts/register/requests** | 성공 응답에 `expiresAt` (ISO-8601) 추가 |
| **POST /api/v1/accounts/me/withdraw/requests** | 동일 |
| **POST /api/v1/accounts/me/password/requests** | 동일 |

**기존**

```json
{ "challengeId": "UUID" }
```

**변경 후**

```json
{
  "challengeId": "UUID",
  "expiresAt": "2025-03-15T12:05:00.000Z"
}
```

#### 에러 응답 — Error Meta (Cooldown)

`CHALLENGE_OTP_COOLDOWN_ACTIVE` (429) 발생 시:

- **Retry-After** HTTP 헤더 추가 (초 단위)
- **meta** 필드 추가 (응답 body)

**에러 응답 예시**

```json
{
  "timestamp": "...",
  "status": 429,
  "message": "Please wait before requesting a new OTP",
  "error": "Too Many Requests",
  "code": "CHALLENGE_OTP_COOLDOWN_ACTIVE",
  "path": "/api/v1/accounts/register/requests",
  "details": null,
  "meta": {
    "availableAt": "2025-03-15T12:01:00.000Z",
    "retryAfterSeconds": 60
  }
}
```

#### Workspace Members

| API | 변경 내용 |
|-----|----------|
| **GET /api/v1/workspaces/{workspaceId}/members** | 각 멤버에 `membershipId` 필드 추가 |

**기존**

```json
[
  {
    "accountId": "UUID",
    "email": "string",
    "name": "string",
    "role": "OWNER | CREW",
    "joinedAt": "ISO-8601"
  }
]
```

**변경 후**

```json
[
  {
    "membershipId": "UUID",
    "accountId": "UUID",
    "name": "string",
    "role": "OWNER | CREW",
    "joinedAt": "ISO-8601"
  }
]
```

- `email` 필드 제거됨 (백엔드에서 제거된 것으로 추정, 실제 응답 확인 필요)
- `membershipId` 추가

---

## 2. Error Code 리스트 (변경 없음)

기존 에러 코드와 동일합니다. 신규 에러 코드는 없습니다.

| 도메인 | 코드 |
|--------|------|
| **Common** | `COMMON_INVALID_EMAIL` |
| **Account** | `ACCOUNT_EMAIL_ALREADY_REGISTERED`, `ACCOUNT_NOT_FOUND`, `ACCOUNT_INVALID_NAME`, `ACCOUNT_INVALID_DISPLAY_NAME`, `ACCOUNT_INVALID_CREDENTIALS`, `ACCOUNT_INVALID_CONFIRMATION_TOKEN`, `ACCOUNT_WITHDRAWAL_BLOCKED_BY_OWNED_WORKSPACE` |
| **Auth** | `AUTH_INVALID_CREDENTIALS`, `AUTH_INVALID_REFRESH_TOKEN` |
| **Challenge** | `CHALLENGE_OTP_COOLDOWN_ACTIVE`, `CHALLENGE_NOT_FOUND`, `CHALLENGE_EXPIRED`, `CHALLENGE_MAX_ATTEMPTS_EXCEEDED`, `CHALLENGE_INVALID_OTP` |
| **Message** | `MESSAGE_REQUIRED_FIELD_MISSING`, `MESSAGE_INVALID_PARAM`, `MESSAGE_INVALID_NUMBER_PARAM`, `MESSAGE_POSITIVE_NUMBER_REQUIRED`, `MESSAGE_INVALID_UUID_PARAM`, `MESSAGE_INVALID_EMAIL_PARAM`, `MESSAGE_MAIL_UNSUPPORTED_TYPE`, `MESSAGE_CHANNEL_NOT_SUPPORTED`, `MESSAGE_TOKEN_AUTH_NOT_SUPPORTED`, `MESSAGE_MAIL_TEMPLATE_NOT_FOUND`, `MESSAGE_MAIL_TEMPLATE_RENDER_FAILED`, `MESSAGE_MAIL_DUPLICATE_PENDING_AUTH_TOKEN`, `MESSAGE_MAIL_VERIFY_URL_REQUIRED`, `MESSAGE_MAIL_TOKEN_EXPIRE_HOURS_REQUIRED`, `MESSAGE_MAIL_ACTION_TYPE_REQUIRED` |
| **Project** | `PROJECT_ID_NULL`, `PROJECT_NOT_FOUND`, `PROJECT_NAME_NULL`, `TASK_NOT_FOUND`, `SAME_PROJECT`, `INVALID_REQUEST` |
| **Task** | `TASK_NOT_FOUND`, `TASK_ID_NULL`, `TITLE_NOT_VALID`, `DESCRIPTION_NOT_VALID`, `TASK_INFO_NOT_FOUND`, `INVALID_TRANSITION`, `INVALID_REQUEST` |
| **Workspace** | `WORKSPACE_NOT_FOUND`, `WORKSPACE_MEMBERSHIP_NOT_FOUND`, `WORKSPACE_OWNER_REQUIRED`, `WORKSPACE_MEMBER_ALREADY_EXISTS`, `WORKSPACE_OWNER_REMOVAL_FORBIDDEN`, `WORKSPACE_TRANSFER_OWNERSHIP_FAILED`, `WORKSPACE_ADD_MEMBER_FAILED`, `WORKSPACE_REMOVE_MEMBER_FAILED` |

---

## 3. 오늘 반영 계획 (TODO)

### Phase 1: 문서 업데이트

- [ ] **API.md** — 다음 내용 반영
  - `GET /api/v1/accounts/policies/password` 추가 (Account 섹션)
  - Challenge OTP 요청 응답에 `expiresAt` 추가
  - 에러 응답에 `meta` 필드 및 Cooldown 예시 추가
  - Workspace Members 응답에 `membershipId` 추가, `email` 제거 여부 확인
- [ ] **ERROR_CODES.md** — 에러 응답 `meta` 필드 설명 추가 (선택)

### Phase 2: 클라이언트 타입/유틸

- [ ] **apiRequest / ApiResult** — 에러 시 `meta` 파싱 추가
  - `ApiResult`에 `meta?: { availableAt?: string; retryAfterSeconds?: number }` 추가
  - `apiRequest`에서 `payload?.meta` 전달
- [ ] **getErrorMessage** — `meta` 기반 메시지 보강 (예: "X초 후 재요청 가능") — 선택

### Phase 3: 비밀번호 정책 API 연동

- [ ] **회원가입 페이지** (`register/page.tsx`)
  - 마운트 시 `GET /api/real/accounts/policies/password` 호출
  - 응답의 `regex`, `message`로 클라이언트 검증 및 에러 메시지 표시
  - 기존 하드코딩된 regex/메시지 제거
- [ ] 비밀번호 변경 페이지가 있다면 동일 적용

### Phase 4: OTP Cooldown UX 개선

- [ ] **회원가입 OTP 요청** (`register/page.tsx`)
  - `CHALLENGE_OTP_COOLDOWN_ACTIVE` 시 `meta.retryAfterSeconds` 또는 `Retry-After` 헤더 활용
  - "X초 후 재요청 가능" 카운트다운 표시
- [ ] 탈퇴/비밀번호 변경 OTP 요청 화면이 있다면 동일 적용

### Phase 5: OTP expiresAt (선택)

- [ ] OTP 요청 성공 시 `expiresAt` 저장
- [ ] OTP 입력 화면에 "유효 시간: ~까지" 표시

### Phase 6: Workspace Members

- [ ] 멤버 목록 타입에 `membershipId` 추가
- [ ] `email` 제거 시 관련 UI 수정 (이메일 표시 제거 또는 다른 소스 사용)

---

## 4. 우선순위 요약

| 순위 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | API.md 업데이트 | 15분 |
| 2 | 비밀번호 정책 API 연동 (회원가입) | 30분 |
| 3 | apiRequest에 meta 파싱 | 15분 |
| 4 | OTP Cooldown UX (재요청 카운트다운) | 30분 |
| 5 | Workspace Members 타입/UI 점검 | 20분 |
| 6 | OTP expiresAt 표시 (선택) | 20분 |

---

## 5. 참고

- psycho.pizza dev 최근 커밋: `feat/frontend-friendly-response`, `feat/PSY-100/add-email-template`, `feat/PSY-86/add-memberships-by-workspace`, `feat: add password policy endpoint`, `feat: Extend challenge request responses with expiresAt and cooldown`, `feat: Add error metadata support`
- 프록시 경로: `/api/real/*` → psycho.pizza 백엔드

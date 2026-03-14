# PLAN: 멀티테넌시 및 전역 상태

psycho.box는 **워크스페이스 ID 중심의 멀티테넌시** 구조입니다.  
선택된 워크스페이스 ID는 로그인 정보와 동일한 수준으로 **전역 관리**됩니다.

---

## 1. 멀티테넌시 구조

| 항목 | 설명 |
|------|------|
| **테넌트 단위** | 워크스페이스 (Workspace) |
| **식별자** | `workspaceId` (UUID) |
| **전환** | 사이드바 워크스페이스 드롭다운에서 전환 |

- 모든 데이터(프로젝트, 스프린트, 태스크, 멤버)는 워크스페이스에 소속
- API 호출 시 `workspaceId`가 Path 또는 컨텍스트로 필요

---

## 2. 전역 상태 (Global State)

다음 두 가지는 **동일한 수준**으로 전역 관리합니다.

| 상태 | 설명 | 관리 방식 |
|------|------|-----------|
| **인증 정보** | Access Token, User (id, email, name) | 메모리 + Refresh Token(쿠키) |
| **선택된 워크스페이스 ID** | 현재 작업 중인 워크스페이스 | 전역 상태 (로그인과 동급) |

### 2.1 선택된 워크스페이스 ID

- 워크스페이스 전환 시 **전역적으로** 갱신
- 모든 워크스페이스 하위 페이지·API 호출의 기준
- 로그인 정보와 함께 **앱 최상위**에서 제공 (Context, Provider 등)

---

## 3. 구현 시 고려사항

### 3.1 상태 제공

```
[AuthProvider]          ← 로그인 정보 (user, accessToken, refresh)
    └─ [WorkspaceProvider]  ← 선택된 workspaceId
           └─ App Layout (Sidebar, Header, Pages)
```

- `WorkspaceProvider`는 `AuthProvider` 하위 또는 동급
- 워크스페이스 전환 시 `workspaceId` 갱신 → 하위 컴포넌트 전체 리렌더/리패치

### 3.2 URL과의 동기화

| 경로 | workspaceId 출처 |
|------|------------------|
| `/workspaces` | 전역 상태 불필요 (목록 페이지) |
| `/workspaces/[id]/board` | URL `[id]` = 전역 상태와 동기화 |
| `/workspaces/[id]/tasks` | URL 진입 시 전역 상태를 `[id]`로 설정 |

- **URL → 전역 상태**: `/workspaces/xxx/...` 진입 시 `workspaceId = xxx`로 설정
- **전역 상태 → URL**: 워크스페이스 전환 시 해당 워크스페이스의 대표 경로로 이동 (예: `/workspaces/xxx/board`)

### 3.3 영속성 (선택)

| 옵션 | 장점 | 단점 |
|------|------|------|
| **URL만** | 단순, 공유 가능 | 새 탭/새로고침 시 목록에서 재선택 필요 |
| **sessionStorage** | 탭 내 새로고침 시 유지 | 탭 닫으면 초기화 |
| **localStorage** | 브라우저 재방문 시 유지 | 다른 기기와 불일치 가능 |

- 로그인과 동급이므로, **sessionStorage** 또는 **localStorage**로 마지막 선택 워크스페이스 유지 검토

### 3.4 초기 진입

- 로그인 후: `/workspaces` 또는 마지막 선택 워크스페이스로 리다이렉트
- 워크스페이스 미선택 시: `/workspaces` (목록) 표시
- 워크스페이스 선택/전환 시: 전역 상태 갱신 + 해당 워크스페이스 대표 페이지로 이동

---

## 4. workspaceId 브라우저 노출 (보안)

### 4.1 보안 우려: 과거 URL로의 접근

**시나리오**: 사용자가 워크스페이스에서 탈퇴했거나, 워크스페이스가 삭제된 경우.  
과거에 저장된 URL(히스토리, 북마크, 공유 링크)로 해당 워크스페이스에 접근하는 것을 막기 위함.

### 4.2 실제 보호 수단: 백엔드 인가

| 담당 | 역할 |
|------|------|
| **백엔드** | 모든 API에서 **멤버십 검증**. 비멤버·탈퇴자·삭제된 워크스페이스 → `403 Forbidden` |
| **프론트** | 403 수신 시: 선택 워크스페이스 초기화, `/workspaces`로 리다이렉트, "접근 권한 없음" 표시 |

→ **URL에 workspaceId가 있든 없든**, 접근 차단은 백엔드 인가로 처리됨. URL 숨김은 보안 수단이 아님.

### 4.3 현재 구조

- URL에 `workspaceId` (UUID) 포함: `/workspaces/{uuid}/board`
- 주소창, 히스토리, 북마크, 공유 링크에 노출됨

### 4.4 workspaceId 노출 시 보안 (UUID 자체)

| 우려 | 실제 |
|------|------|
| UUID 추측·열거 | UUID v4는 2^122 조합. 무차별 대입 불가능 |
| workspaceId 알면 탈취? | 백엔드가 **멤버십 검증**하면, 비멤버는 접근 불가. ID만으로는 의미 없음 |
| 정보 노출 | 워크스페이스 존재 여부만 알 수 있음 (이미 가입 시 목록에 노출) |

→ **백엔드 인가가 제대로 되면** UUID 노출만으로는 보안상 큰 문제는 아님.

### 4.5 workspaceId를 브라우저에 노출하지 않을 때

| 방식 | 설명 | 문제점 |
|------|------|--------|
| **URL에서 제거** | `/board`, `/tasks` 등만 사용. workspaceId는 전역 상태·세션에만 보관 | 딥링크 불가, 북마크 불가, 새 탭/새로고침 시 컨텍스트 손실 |
| **불투명 토큰** | URL에 `abc123` 같은 slug 사용. 백엔드가 slug → workspaceId 매핑 | slug도 결국 노출. UUID 대비 보안 이득은 제한적 |
| **세션 기반** | 백엔드가 "현재 워크스페이스"를 세션에 저장. 클라이언트는 ID를 아예 안 씀 | **현재 API 구조상 불가** (workspaceId Path 사용이 고정됨) |

### 4.6 권장

| 선택 | 적합한 경우 |
|------|-------------|
| **URL에 UUID 유지** | 딥링크·북마크·공유가 중요하고, 백엔드 인가가 확실할 때 (일반적인 선택) |
| **URL에서 제거** | 노출 최소화가 최우선이고, 딥링크·북마크 포기 가능할 때 |
| **불투명 slug** | UUID 노출을 피하고 싶지만, 딥링크는 유지하고 싶을 때 (백엔드에 slug 매핑 추가) |

### 4.7 URL에서 제거 시 구현 (선택)

- **프론트 경로**: `/workspaces` (목록), `/board`, `/tasks`, `/members` (workspaceId 없음)
- **workspaceId 보관**: `sessionStorage` 또는 `localStorage` (클라이언트만 사용)
- **API 호출**: psycho.pizza API는 이미 `workspaceId`를 **Path에 포함** (`/api/v1/workspaces/{workspaceId}/...`). 변경 불가.
  - 저장된 workspaceId로 요청 경로 구성: `GET /api/v1/workspaces/{storedId}/tasks` 등
  - workspaceId는 **API 요청 Path**에는 반드시 포함됨 (헤더 전송 불가)
  - **주소창**에는 노출하지 않을 수 있으나, 개발자 도구 Network 탭에서는 요청 URL에 보임
- **제한**: 링크 공유 시 `/board`만 공유 가능. 상대방은 자신의 "현재 워크스페이스"를 보게 됨

### 4.8 프론트 403 처리 (필수)

탈퇴·삭제된 워크스페이스 접근 시 API가 403을 반환하면, 프론트는 다음을 수행해야 함:

- `sessionStorage`/`localStorage`의 `workspaceId` 제거
- 전역 상태(WorkspaceProvider) 초기화
- `/access-denied`로 리다이렉트 (접근 권한 없음 전용 페이지, [PLAN_페이지_개발_계획.md](./PLAN_페이지_개발_계획.md) 참고)

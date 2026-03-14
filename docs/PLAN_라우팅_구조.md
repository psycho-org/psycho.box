# PLAN: 라우팅 구조

Next.js App Router 기반 라우팅 구조입니다.  
참고: PlanIt UI 메뉴 구조

---

## 디렉터리 구조

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx          # Auth Layout
├── (app)/
│   ├── layout.tsx          # App Layout (Sidebar + Header)
│   ├── workspaces/
│   │   ├── page.tsx        # 내 워크스페이스
│   │   └── [workspaceId]/
│   │       ├── layout.tsx  # Workspace Layout
│   │       ├── page.tsx    # redirect to /board
│   │       ├── board/page.tsx       # 스프린트 보드 (Kanban)
│   │       ├── tasks/page.tsx      # 모든 태스크
│   │       ├── members/page.tsx     # 멤버 관리
│   │       ├── analysis/
│   │       │   ├── page.tsx
│   │       │   └── [requestId]/page.tsx
│   │       └── settings/
│   │           ├── page.tsx
│   │           └── transfer/page.tsx
│   ├── access-denied/page.tsx   # 워크스페이스 접근 권한 없음 (403)
│   └── account/
│       ├── page.tsx
│       └── withdraw/page.tsx
├── api/
│   └── proxy/              # psycho.pizza 프록시 (선택)
│       └── [...path]/route.ts
└── layout.tsx              # Root
```

---

## 라우트 그룹

| 그룹 | 경로 | 설명 |
|------|------|------|
| `(auth)` | `/login`, `/register` | 인증 전용 (사이드바 없음) |
| `(app)` | `/workspaces/*`, `/access-denied`, `/account` | 로그인 후 메인 앱 |
| `api` | `/api/*` | API Route (프록시 등) |

---

## 주요 라우트

| 경로 | 페이지 |
|------|------|
| `/access-denied` | 워크스페이스 접근 권한 없음 (403 리다이렉트) |
| `/workspaces` | 내 워크스페이스 |
| `/workspaces/[id]` | → `/workspaces/[id]/board` 리다이렉트 |
| `/workspaces/[id]/board` | 스프린트 보드 (Kanban) |
| `/workspaces/[id]/tasks` | 모든 태스크 |
| `/workspaces/[id]/members` | 멤버 관리 |
| `/workspaces/[id]/analysis` | AI 분석 |
| `/workspaces/[id]/settings` | 워크스페이스 설정 |

---

## 쿼리 파라미터 (필터용)

| 페이지 | 파라미터 | 용도 |
|--------|----------|------|
| `/board` | `project` | 프로젝트 필터 |
| `/tasks` | `project`, `status`, `assignee`, `view`, `filter` | 태스크 필터·보기 |
| `view` | `card` \| `list` | 카드형 / 리스트형 |
| `filter` | `all` \| `mine` \| `backlog` \| `roadmap` \| `done` | 전체 / 내 태스크 / 백로그 / 로드맵 / 완료됨 |

---

## 동적 라우트

| 파라미터 | 용도 |
|----------|------|
| `[workspaceId]` | 워크스페이스 ID |
| `[requestId]` | AI 분석 요청 ID |

- 스프린트/프로젝트/태스크는 쿼리 파라미터 또는 모달로 처리 (별도 페이지 없음)

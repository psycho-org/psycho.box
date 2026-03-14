# psycho.box 개발 계획 (PLAN)

Next.js 프론트엔드(psycho.box) 개발 계획의 **메인 인덱스**입니다.  
세부 내용은 아래 문서를 참고하세요.

---

## 문서 목록

| 문서 | 설명 |
|------|------|
| [PLAN_VERCEL_배포_보안.md](./PLAN_VERCEL_배포_보안.md) | Vercel 배포 시 보안 취약점, CORS, 쿠키, 환경 변수 등 |
| [PLAN_레이아웃_메뉴.md](./PLAN_레이아웃_메뉴.md) | 레이아웃 구조, 메뉴 트리, 화면 구성 |
| [PLAN_멀티테넌시_전역상태.md](./PLAN_멀티테넌시_전역상태.md) | 워크스페이스 중심 멀티테넌시, 선택 워크스페이스 ID 전역 관리 |
| [PLAN_페이지_개발_계획.md](./PLAN_페이지_개발_계획.md) | 메뉴별 페이지 목록, 우선순위(P0/P1/P2) |
| [PLAN_라우팅_구조.md](./PLAN_라우팅_구조.md) | Next.js App Router 기반 라우팅 구조 |
| [PLAN_미구현_API.md](./PLAN_미구현_API.md) | 개발에 필요하지만 미구현된 백엔드 API |
| [API.md](./API.md) | psycho.pizza 백엔드 API 문서 |

---

## 메인 비즈니스 요약

| 영역 | 설명 | API 상태 |
|------|------|----------|
| **워크스페이스 관리** | 워크스페이스 CRUD, 멤버, 소유권 이전 | ✅ 준비됨 |
| **일정 관리** | Task, Project, Sprint 기반 일정 | ✅ 준비됨 |
| **AI 요약·점수** | 일정 기반 AI 분석, 요약, 점수 | 🔄 개발 중 (API 미공개) |

---

## 다음 단계

1. **백엔드 에러 코드 스캔**: psycho.pizza의 `*ErrorCode.kt` 파일을 확인해 추가·변경된 에러 코드가 있으면 `docs/ERROR_CODES.md`, `src/lib/error-messages.ts`에 반영
2. Next.js 프로젝트 초기화 (`create-next-app`)
3. Auth Provider, **Workspace Provider** (선택 워크스페이스 ID 전역 관리) 구현
4. Auth Layout, App Layout (Sidebar + Header) 구현
5. API 클라이언트 설정 (Base URL, 인증 헤더, Refresh 로직)
6. P0 페이지 순차 구현 (내 워크스페이스 → 스프린트 보드 → 태스크 → 멤버 관리)
7. 모달 컴포넌트 구현 (태스크/스프린트/워크스페이스 생성, 멤버 초대)
8. Vercel 배포 설정 및 CORS/프록시 검증

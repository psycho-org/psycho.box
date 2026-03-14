# psycho.box

psycho.pizza API용 Next.js 프론트엔드.  
docs/ 내 PLAN 문서 기반 레이아웃·라우팅 구조.

## 실행

```bash
npm install
npm run dev
```

http://localhost:3000

## 구조

- `(auth)` - 로그인, 회원가입 (사이드바 없음)
- `(app)` - 워크스페이스, 보드, 태스크, 멤버 관리 (사이드바 + 헤더)
- `@theme` - globals.css 색상·브레이크포인트

## 참고

- [PLAN_레이아웃_메뉴.md](./docs/PLAN_레이아웃_메뉴.md)
- [PLAN_라우팅_구조.md](./docs/PLAN_라우팅_구조.md)
- [API.md](./docs/API.md)

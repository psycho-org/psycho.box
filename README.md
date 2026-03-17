# psycho.box

psycho.pizza API용 Next.js 프론트엔드.  
docs/ 내 PLAN 문서 기반 레이아웃·라우팅 구조.

## 실행

```bash
cp .env.example .env.local
npm install
npm run dev
```

http://localhost:3000

## 환경 변수

`psycho.box`는 브라우저가 아니라 Next.js 서버에서 `psycho.pizza` API를 호출합니다.
AWS 배포 시 아래 값은 인프라에서 주입해야 합니다.

```bash
BACKEND_API_URL=https://api.example.com
BACKEND_REFRESH_COOKIE_NAME=refresh_token
```

- 로컬 개발 기본값은 `.env.example` 기준입니다.
- 프로덕션에서는 `BACKEND_API_URL`, `BACKEND_REFRESH_COOKIE_NAME`이 없으면 서버가 바로 실패하도록 했습니다.
- EC2/Systemd, CodeDeploy, ECS, Elastic Beanstalk 어느 쪽이든 애플리케이션 런타임 환경변수로 넣으면 됩니다.

## AWS EC2 배포

EC2 단독 배포 기준 파일:

- `deploy/fetch-env.sh`
- `deploy/deploy.sh`
- `psycho-box.service`

SSM Parameter Store 예시 키:

```bash
/psycho/prod/box/backend-api-url
/psycho/prod/box/backend-refresh-cookie-name
/psycho/prod/box/node-env
/psycho/prod/box/port
```

EC2에는 AWS CLI와 SSM 조회 권한이 붙은 IAM Role이 있어야 합니다.

최초 1회 예시:

```bash
sudo cp psycho-box.service /etc/systemd/system/psycho-box.service
sudo chmod 644 /etc/systemd/system/psycho-box.service
chmod +x deploy/fetch-env.sh deploy/deploy.sh
./deploy/deploy.sh
sudo systemctl enable psycho-box
```

## 구조

- `(auth)` - 로그인, 회원가입 (사이드바 없음)
- `(app)` - 워크스페이스, 보드, 태스크, 멤버 관리 (사이드바 + 헤더)
- `@theme` - globals.css 색상·브레이크포인트

## 참고

- [PLAN_레이아웃_메뉴.md](./docs/PLAN_레이아웃_메뉴.md)
- [PLAN_라우팅_구조.md](./docs/PLAN_라우팅_구조.md)
- [API.md](./docs/API.md)

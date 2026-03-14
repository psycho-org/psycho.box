# PLAN: Vercel 배포 보안

psycho.box를 Vercel에 배포할 때 고려할 보안 취약점과 주의사항입니다.

---

## 1. 크로스 도메인 인증 (핵심)

psycho.box(Vercel) ↔ psycho.pizza(백엔드)가 **서로 다른 도메인**일 경우:

| 이슈 | 설명 | 대응 |
|------|------|------|
| **HTTP-only 쿠키** | Refresh Token이 `psycho.pizza` 도메인에 설정됨. `psycho.box`에서 `/api/v1/auth/refresh` 호출 시 **쿠키가 전송되지 않음** (Same-Origin 정책) | (A) 프록시: `psycho.box/api/*` → `psycho.pizza`로 프록시하여 same-origin처럼 동작. (B) Refresh API를 `psycho.box`의 API Route에서 호출하고, 백엔드에 `credentials: 'include'`로 요청 (백엔드 CORS `credentials: true`, `Access-Control-Allow-Origin`에 psycho.box 명시 필요) |
| **CORS** | 백엔드가 `psycho.box` origin을 허용해야 함 | `Access-Control-Allow-Origin: https://psycho.box.vercel.app` (또는 프로덕션 도메인), `Access-Control-Allow-Credentials: true` |
| **CORS preflight** | OPTIONS 요청 처리 | 백엔드에서 OPTIONS 허용 |

---

## 2. 환경 변수 노출

| 항목 | 위험 | 대응 |
|------|------|------|
| `NEXT_PUBLIC_*` | 클라이언트 번들에 포함됨 | **절대** API 키, 시크릿 넣지 말 것. 공개해도 되는 URL만 사용 |
| 서버 전용 변수 | `NEXT_PUBLIC_` 없으면 서버/빌드에만 노출 | Vercel 프로젝트 설정 → Environment Variables에서 설정. Production/Preview/Development 구분 권장 |

---

## 3. API Base URL

```
# 권장
NEXT_PUBLIC_API_BASE_URL=https://api.psycho.pizza  # 또는 psycho.pizza
```

- 클라이언트에서 직접 호출 시: CORS 설정 필수
- API Route 프록시 사용 시: `NEXT_PUBLIC_` 없이 서버에서만 `API_BASE_URL` 사용

---

## 4. JWT 저장

| 방식 | 보안 | 비고 |
|------|------|------|
| `localStorage` | XSS에 취약 | 피할 것 |
| `sessionStorage` | 탭 닫으면 사라짐 | 로그인 유지 불가 |
| **메모리 + HTTP-only 쿠키** | 상대적으로 안전 | Access Token은 메모리/state, Refresh는 쿠키. 백엔드가 쿠키 설정 |

→ 현재 백엔드 설계(Refresh Token HTTP-only 쿠키)에 맞추려면 **프록시 또는 CORS credentials** 구성이 필요함.

---

## 5. Vercel 특유 주의사항

| 항목 | 내용 |
|------|------|
| **Edge/Serverless** | API Route, Server Components는 서버리스. 장기 연결(WebSocket 등)은 제한적 |
| **빌드 시점** | `NEXT_PUBLIC_*`는 빌드 시점에 주입. 배포 후 변경 시 재배포 필요 |
| **Preview 배포** | PR마다 별도 URL. CORS/쿠키 도메인에 Preview URL 추가 검토 |
| **Rate Limit** | Vercel 기본 제한 있음. 대량 트래픽 시 Pro/Enterprise 또는 별도 CDN 고려 |

---

## 6. 권장 아키텍처 (도메인 분리 시)

```
[Browser] → psycho.box (Vercel)
              ├─ 정적 페이지, React
              └─ /api/proxy/* → Next.js API Route → psycho.pizza (백엔드)
```

- 클라이언트는 `psycho.box`만 호출 (same-origin)
- API Route에서 `psycho.pizza`로 서버-서버 요청
- Refresh: 클라이언트 → `psycho.box/api/auth/refresh` → 서버가 psycho.pizza 호출 후 새 Access Token 반환 (Refresh Token은 백엔드-백엔드에서 처리)

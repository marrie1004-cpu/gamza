# 🥔 감자 (Gamza) - 따뜻하고 포슬포슬한 익명 중고거래 플랫폼

개인식별정보(이메일, 전화번호, 실명) 노출 부담 없이 누구나 안전하고 편안하게 동네 주민과 물건을 나눌 수 있는 감성 중고거래 웹 서비스입니다.

![감자 서비스 스크린샷](./screenshot.png)

---

## ✨ 주요 기능

- **🥔 완전 익명 안심 프로필**
  - 회원가입 시 복잡한 실명/전화번호 인증 없이 간편하게 시작
  - `포슬포슬한알감자`, `노릇노릇한통감자` 등 귀여운 감자 닉네임 자동 부여
  - 당근보다 따뜻한 나만의 익명성 보장

- **📍 동네 기반 물품 거래**
  - 역삼1동, 서초동 등 내 동네 및 인근 동네 물품 탐색
  - 전자기기, 의류, 생활가전, 가구, 도서 등 다양한 카테고리 필터링
  - 판매중/예약중/거래완료 상태별 보기 필터 및 키워드 실시간 검색

- **📝 직관적인 물품 등록 및 관리**
  - 드래그 앤 드롭 또는 파일 선택을 통한 다중 상품 이미지 업로드
  - 무료 나눔 체크 및 가격 입력 편의 기능
  - 거래 희망 장소(지도/주소), 상세 설명, 상태 변경/삭제 기능

- **💬 1:1 실시간 소통 및 관심 목록**
  - 마음에 드는 상품 찜하기(관심 목록) 토글
  - 구매 희망자와 판매자 간 부담 없는 실시간 채팅
  - 거래 매너 평가(포슬포슬 온도)

---

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Realtime, Storage)
- **Design System**: 포근하고 친근한 감자 테마 컬러 팔레트 & 반응형 모바일 우선 UI

---

## 🚀 로컬 실행 방법

별도의 무거운 프레임워크나 빌드 도구 설치 없이 가볍게 실행할 수 있습니다.

### 방법 1: PowerShell 내장 웹 서버 실행 (권장)
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```
실행 후 브라우저에서 `http://localhost:8080` 접속

### 방법 2: Live Server 또는 정적 웹 서버
VS Code의 `Live Server` 확장을 사용하거나 npx http-server 등을 통해 실행할 수 있습니다.
```bash
npx serve .
```

---

## ⚙️ 환경 설정 (Supabase 연동)

프로젝트 루트의 [supabase.js](supabase.js) 파일에 본인의 Supabase 프로젝트 정보를 입력하거나 설정합니다.

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

> ⚠️ **보안 유의사항**: 관리자용 `SERVICE_ROLE_KEY`는 절대 클라이언트 코드나 GitHub 공개 저장소에 업로드하지 마세요.

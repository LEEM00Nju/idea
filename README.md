# Sleep2Flow

수면시간(어젯밤)과 오늘의 할 일을 입력하면,  
실행 가능한 시간 블록(집중/보조/휴식/낮잠)을 자동으로 생성하는 개인 생산성 향상 웹 앱입니다.

---

## 문서

- [IDEATION](docs/IDEATION.md)
- [PRD](docs/PRD.md)
- [TRD](docs/TRD.md)
- [AGENTS](docs/AGENTS.md)

---

## 핵심 기능 (MVP)

- 오늘 할 일 입력
- 수면시간 입력
- 큰 작업 자동 분해
- 수면 상태 기반 시간 블록 자동 배치
- 낮잠/휴식 제안
- 실패 시 룰 기반 fallback 플랜 제공

---

## 데모 플로우 (E2E)

1. 사용자가 오늘 할 일 + 수면시간 입력
2. 앱이 작업 분해 및 우선순위/강도 배치 수행
3. 결과 화면에서 오늘 실행 계획표 출력
4. 사용자가 계획 확인 후 즉시 실행

---

## 해커톤 평가기준 충족 근거

### 1) GitHub Copilot SDK 및 Microsoft Agent Framework 활용 (25%)
- Copilot SDK를 통해 모델 연결/응답 생성 수행
- Microsoft Agent Framework 기반 다중 에이전트 오케스트레이션
  - Task Decomposer Agent
  - Energy Planner Agent
- 단계별 컨텍스트 전달 및 실패 시 fallback 전략 적용

### 2) 생산성 향상 효과 및 문제 적합성 (18%)
- 수면 상태를 반영해 “실행 가능한 계획” 자동화
- 단순 체크리스트가 아닌 시작 가능한 작업 단위 제공
- 측정 지표:
  - 계획 수립 시간 단축
  - 시작 지연 시간 감소
  - 고집중 작업 완료율 향상

### 3) Azure 클라우드 통합 (18%)
- Azure에 실제 배포된 웹 앱/API
- Azure Storage를 통한 최소 데이터 저장
- (옵션) Application Insights로 응답시간/오류율/fallback 비율 관찰

### 4) 기능 완성도 및 기술적 구현 (16%)
- 입력 → 처리 → 결과의 E2E 동작
- 입력 검증, 오류 메시지, 재시도/대체 로직 포함
- 반응형 웹 기반 구현

### 5) 사용자 경험 및 워크플로 설계 (12%)
- 2화면(입력/결과) 중심의 단순하고 빠른 UX
- 핵심 가치까지 3클릭 내 도달
- AI 결과를 이해 가능한 시간표로 투명하게 전달

### 6) 책임 있는 AI, 보안 및 신뢰 (6%)
- “AI 생성 결과” 명시
- 민감정보 최소 저장 및 로그 마스킹
- 비밀키는 환경변수/클라우드 설정으로 분리
- 자동 위험 동작 금지, 사용자 확인 중심 설계

### 7) 혁신성 및 독창성 (5%)
- 수면시간과 업무 계획을 결합한 생산성 최적화 접근
- 일반 To-do 관리에서 실행 계획 자동화로 확장

---

## 기술 스택

- Frontend: React + TypeScript + Vite
- Backend: Node.js (API)
- Agent: Microsoft Agent Framework, GitHub Copilot SDK
- Cloud: Azure App Service, Azure Storage, (옵션) Application Insights

---

## 실행 방법 (예시)

```bash
npm install
npm run dev
```

---

## 배포 URL

- Web: (여기에 Azure 배포 URL 입력)
- API: (여기에 Azure API URL 입력)

---

## 팀 메모

본 프로젝트는 해커톤 규정에 맞춰  
- 웹 앱 형태로 구현되었고  
- 필수 기술(Copilot SDK, Microsoft Agent Framework)과  
- Azure 배포를 포함합니다.

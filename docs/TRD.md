# TRD.md

## 0) 문서 목적
본 문서는 **Sleep2Flow**(수면시간 연계 개인 생산성 향상 웹 앱)의 기술 구현 방안을 정의한다.  
목표는 제한 시간 내에 **E2E 동작**, **Agent Framework + Copilot SDK 활용**, **Azure 배포**를 안정적으로 달성하는 것이다.

---

## 1) 시스템 개요

- 플랫폼: 반응형 웹 앱
- 핵심 입력: `오늘 할 일 목록`, `어젯밤 수면시간`
- 핵심 출력: `실행 가능한 오늘 계획표(집중/보조/휴식/낮잠)`
- 핵심 가치: 할 일 “기록”이 아니라, 수면 상태를 반영한 “실행 계획 자동화”

---

## 2) 기술 스택

### Frontend
- React + TypeScript + Vite
- UI: 단일 페이지 2뷰
  - 입력 화면
  - 결과 화면

### Backend/API
- Node.js + TypeScript
- REST API (`POST /api/plan`)

### Agent Layer (필수)
- **Microsoft Agent Framework**
  - 다중 에이전트 오케스트레이션
  - 에이전트 간 컨텍스트 전달
  - 도구 호출/단계별 처리
- **GitHub Copilot SDK**
  - 모델 연결
  - 스트리밍 응답 처리(가능 시)
  - 프롬프트/컨텍스트 기반 생성

### Cloud (필수)
- **Azure App Service**: 웹앱/API 배포
- **Azure Storage (Table 또는 Blob)**: 계획 결과/로그 저장(최소 범위)
- **Application Insights**: 오류/지연 관찰(가능 시)

> 참고: Azure AI 서비스 사용은 필수가 아니므로, 본 MVP는 필수 요건 충족 중심으로 설계한다.

---

## 3) 아키텍처

1. 사용자 입력(할 일, 수면시간)
2. Frontend → `POST /api/plan`
3. 오케스트레이터가 Agent 순차 호출
   - Task Decomposer Agent
   - Energy Planner Agent
4. 결과 JSON 반환
5. Frontend 결과 렌더링 + 저장(옵션)

---

## 4) 에이전트 오케스트레이션 시퀀스

### Step 1. 입력 정규화
- 빈 값/형식 검증
- 수면시간 범위 검증(예: 0~14시간)

### Step 2. Task Decomposer Agent
- 큰 작업을 20~30분 실행 단위로 분해
- 출력: `subtasks[]` (title, duration, intensity)

### Step 3. Energy Planner Agent
- 수면시간 기반 에너지 정책 적용
- 시간 블록 배치(고집중/저집중/휴식/낮잠 제안)

### Step 4. 결과 구성
- 사용자에게 이해 가능한 일정표 JSON 생성
- AI 생성 결과임을 명시

### Step 5. 실패 대응
- Agent 실패/지연 시 룰 기반 fallback 실행
- “기본 계획으로 전환됨” 메시지 노출

---

## 5) API 명세 (MVP)

## POST `/api/plan`

### Request
```json
{
  "sleepHours": 5.5,
  "tasks": [
    { "title": "기획서 작성", "estimateMin": 120, "priority": "high" },
    { "title": "이메일 정리", "estimateMin": 30, "priority": "low" }
  ],
  "startTime": "09:00"
}
```

### Response
```json
{
  "aiGenerated": true,
  "summary": "수면시간 5.5시간 기준으로 고집중 작업 1개를 오전에 배치했습니다.",
  "planBlocks": [
    { "start": "09:00", "end": "09:25", "task": "기획서 작성 - 개요", "intensity": "high" },
    { "start": "09:30", "end": "09:55", "task": "기획서 작성 - 본문 1", "intensity": "high" },
    { "start": "10:00", "end": "10:20", "task": "휴식/짧은 산책", "intensity": "rest" }
  ],
  "napSuggestion": {
    "recommended": true,
    "window": "14:00-14:20",
    "reason": "수면 부족으로 오후 집중력 저하 가능성"
  },
  "fallbackUsed": false
}
```

---

## 6) 수면 기반 계획 규칙 (fallback 정책)

- `sleepHours < 5`
  - 고난도 작업 최대 1개
  - 짧은 블록 위주(20~25분)
  - 휴식 빈도 증가
- `5 <= sleepHours < 7`
  - 25분 집중 + 5분 휴식
  - 오전 고집중, 오후 보조업무
- `sleepHours >= 7`
  - 고난도 우선 배치
  - 긴 집중 블록 허용(30~45분)

---

## 7) 오류 처리 및 신뢰성

- 입력 오류: 필드별 즉시 검증 메시지
- Agent 타임아웃: fallback으로 자동 전환
- 네트워크 오류: 재시도 버튼 제공
- 장애 시에도 최소 기능(E2E) 보장

---

## 8) 보안/책임 있는 AI

- 비밀키: `.env` 및 Azure App Settings/Secrets 사용
- 로그: 민감 텍스트 최소 저장 또는 마스킹
- 투명성: 결과에 “AI 생성 추천” 표시
- 사용자 통제:
  - 자동 실행 없음
  - 최종 계획은 사용자가 확인/수정 후 확정
- 안전 경계:
  - 의료/진단 조언 금지
  - 생산성 관점 제안만 수행

---

## 9) 관찰 가능성(Observability)

- Application Insights로 다음 수집:
  - API 응답시간
  - 오류율(4xx/5xx)
  - fallback 발생 비율
- 목표:
  - P95 응답 5초 이내
  - 데모 중 치명 오류 0건

---

## 10) 배포 전략 (반복 가능한 방식)

1. Azure 리소스 생성(App Service, Storage)
2. 환경변수 설정(API 키, 앱 설정)
3. 빌드/배포
4. 배포 후 헬스체크(`/health`)
5. 데모 URL 검증

---

## 11) 완료 기준(Definition of Done)

- [ ] 입력 화면/결과 화면 동작
- [ ] `/api/plan` 정상 응답
- [ ] Agent Framework + Copilot SDK 호출 코드 포함
- [ ] Azure 배포 URL 동작
- [ ] fallback 및 오류 처리 동작
- [ ] README에 실행/배포/규정충족 근거 문서화

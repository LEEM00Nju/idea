# RhythmPilot

RhythmPilot은 수면을 반영한 하루 일정 관리 웹앱입니다. 수면 시간, 시작 시간, 할 일을 입력하면 집중 블록, 지원 블록, 휴식 블록, 낮잠 블록으로 구성된 실행 가능한 일정을 제안합니다.

## 앱 구조

```text
idea/
├── frontend/  # React + TypeScript + Vite
├── backend/   # Express + TypeScript API
└── docs/      # 제품, 기술, 에이전트 사양
```

## 문서

- [IDEATION](docs/IDEATION.md)
- [PRD](docs/PRD.md)
- [TRD](docs/TRD.md)
- [AGENTS](docs/AGENTS.md)

## 주요 기능

- 2단계 UX: 입력 → 결과
- 유효성 검증이 포함된 `POST /api/plan` 엔드포인트
- Task Decomposer + Energy Planner 에이전트 오케스트레이션
- 수면 인식 일정 규칙 및 규칙 기반 폴백
- Azure Table Storage 감사 로깅 (최소 메타데이터만)
- Application Insights 이벤트/오류 훅
- 명시적 AI 라벨링 및 실행 전 사용자 확인

## 로컬 개발

```bash
npm install
npm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드/API: http://localhost:3001
- 헬스 체크: http://localhost:3001/health

## 빌드

```bash
npm run build
```

백엔드는 프로덕션에서 `frontend/dist`를 자동으로 서빙하여 Azure App Service 단일 배포가 가능합니다.

## 환경 변수

### 백엔드

- `PORT` - API 포트 (기본값 `3001`)
- `COPILOT_SDK_ENABLED` - GitHub Copilot SDK 사용 시 `true`로 설정
- `COPILOT_MODEL` - 선택적 모델 재정의 (기본값 `gpt-5-mini`)
- `AGENT_TIMEOUT_MS` - 폴백 전 에이전트별 타임아웃 (기본값 `4000`)
- `ALLOWED_ORIGIN` - CORS 허용 브라우저 출처 (기본값 `http://localhost:5173`)
- `AZURE_TABLES_CONNECTION_STRING` - 선택적 Azure Table Storage 연결 문자열
- `AZURE_TABLES_TABLE_NAME` - 선택적 테이블 이름 재정의
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - 선택적 App Insights 연결 문자열

## Azure 배포 방법

RhythmPilot은 Azure App Service 배포를 지원합니다:

1. `npm install && npm run build` 실행
2. Node.js 20+ 환경의 App Service에 리포지토리 배포
3. 위 환경 변수를 App Settings에 설정
4. `/health`를 헬스 프로브로 사용

Azure 통합은 런타임에서 선택 사항입니다. 스토리지 또는 모니터링 설정이 없어도 로컬에서 작업 내용을 저장하지 않고 정상 작동합니다.

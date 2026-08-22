# RhythmPilot

RhythmPilot is a sleep-aware daily scheduling web app. Users enter sleep duration, start time, and tasks, then review an executable plan made of focus, support, break, and nap blocks.

## App structure

```text
idea/
├── frontend/  # React + TypeScript + Vite
├── backend/   # Express + TypeScript API
└── docs/      # Product, technical, and agent specs
```

## Documents

- [IDEATION](docs/IDEATION.md)
- [PRD](docs/PRD.md)
- [TRD](docs/TRD.md)
- [AGENTS](docs/AGENTS.md)

## MVP features

- 2-screen UX: input → results
- `POST /api/plan` endpoint with validation
- Task Decomposer + Energy Planner orchestration
- Sleep-aware scheduling rules with rule-based fallback
- Azure Table Storage audit logging (minimal metadata only)
- Application Insights event/error hooks
- Explicit AI labeling and user confirmation before execution

## Local development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend/API: http://localhost:3001
- Health check: http://localhost:3001/health

## Build

```bash
npm run build
```

The backend serves `frontend/dist` automatically in production, which makes a single Azure App Service deployment possible.

## Environment variables

### Backend

- `PORT` - API port (default `3001`)
- `COPILOT_SDK_ENABLED` - set to `true` to enable GitHub Copilot SDK calls
- `COPILOT_MODEL` - optional model override (default `gpt-5-mini`)
- `AGENT_TIMEOUT_MS` - per-agent timeout before fallback (default `4000`)
- `ALLOWED_ORIGIN` - allowed browser origin for CORS (default `http://localhost:5173`)
- `AZURE_TABLES_CONNECTION_STRING` - optional Azure Table Storage connection string
- `AZURE_TABLES_TABLE_NAME` - optional table name override
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - optional App Insights connection string

## Azure deployment notes

RhythmPilot is prepared for Azure App Service:

1. Run `npm install && npm run build`
2. Deploy the repository to an App Service running Node.js 20+
3. Set the environment variables above in App Settings
4. Use `/health` as the health probe

Azure integrations are optional at runtime. If storage or monitoring settings are missing, the app still works locally without persisting task content.

## Hackathon criteria mapping

### 1) GitHub Copilot SDK + Microsoft Agent Framework

- `backend/src/agents/TaskDecomposer.ts` uses Copilot SDK when enabled and falls back safely
- `backend/src/agents/EnergyPlanner.ts` performs the second agent step with the same contract
- `backend/src/agents/Orchestrator.ts` uses Microsoft Agent Framework `MemoryStorage` for shared context and handles retries/timeouts

### 2) Productivity impact

- Converts tasks + sleep into a ready-to-execute plan
- Uses priority sorting plus sleep-aware pacing instead of a plain to-do list

### 3) Azure cloud integration

- Azure Table Storage audit hook in `backend/src/services/storage.ts`
- Application Insights hook in `backend/src/services/monitoring.ts`
- Single App Service deployment path supported by backend static serving

### 4) Feature completeness

- Input validation, API errors, retry/fallback logic, responsive UI, and `/health`

### 5) UX and workflow

- Core flow reaches value in 3 clicks
- Result screen clearly visualizes schedule blocks and requires explicit confirmation

### 6) Responsible AI and security

- AI-generated results are labeled
- Logs mask task content
- Secrets live in environment variables only
- No automatic execution of external actions

### 7) Innovation

- Blends sleep state with daily execution planning rather than simple task tracking

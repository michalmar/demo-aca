# Student Questionnaire SPA (Frontend Only)

A simple, modern Vite + React + Tailwind application that presents a short questionnaire for students (ages 10–15). The UI mimics a lightweight chat feed: questions appear as bubbles, with a sticky answer composer at the bottom.

## Tech Stack
- React 18 + TypeScript
- Vite 5
- TailwindCSS (dark mode default, ChatGPT-inspired styling)
- Minimal shadcn-style component patterns (Button, Input, Card, etc.)

## Features
- Dynamic rendering of mixed question types (text, multi-choice, scale).
- Progress navigation (Back / Next / Submit) with validation (must answer before moving on).
- LocalStorage persistence (answers survive refresh).
- Mock submission with console log (replace with real API later).
- Simple theme toggle (dark/light).

## Data Model
Each question: `{ id, text, type, options?, scaleMax? }`.
Types supported: `text`, `multichoice`, `scale`.

## Planned Backend API (Not Implemented)
Backend scaffold now included in `backend/` using FastAPI with in-memory storage.

Current endpoints:
- `GET /api/questionnaire` -> returns questionnaire structure.
- `POST /api/answers` -> body: `{ "userId": string, "answers": Record<string,string> }` saves answers.
- `GET /api/answers/{userId}` -> fetch stored answers.
- `GET /health` -> basic health check.

Auth layer (future): simple session or token to identify student (header or cookie).
Persistence (future): replace in-memory with a database table (e.g. Postgres) mapping userId -> answers JSON.

Frontend uses `VITE_API_BASE_URL` (see `.env`). Falls back to local mock if backend unreachable.

## Quick Start
```bash
npm install
npm run dev
```

### Run Backend (optional now)
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```
Open: http://localhost:5173

### Using Cosmos DB (Local Emulator)
1. Start emulator (Docker):
```bash
docker run -p 8081:8081 -p 10251:10251 -p 10252:10252 -p 10253:10253 -p 10254:10254 \
  --name cosmos-emulator -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=true \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
```
2. Trust emulator certificate (macOS): Navigate to https://localhost:8081/_explorer and follow prompts; if needed export cert and add to Keychain as trusted.
3. Retrieve primary key from emulator logs (`docker logs cosmos-emulator | grep PrimaryKey`).
4. Create `.env` in `backend/` from `.env.sample` and set `COSMOS_KEY`.
5. Restart backend. It will create DB `questionnaire_db` and containers `answers` (partition key `/userId`) and `questionnaire` (partition key `/id`). The questionnaire is seeded once with the default in `backend/data.py` if missing.

If Cosmos vars absent or init fails, backend silently falls back to in-memory storage.

### Questionnaire Source
`/api/questionnaire` now serves the document stored in Cosmos (container `questionnaire`) when available; otherwise it falls back to the static definition. Update the content by editing `backend/data.py` and restarting (first run seeds); or PATCH the Cosmos item with id `questionnaire`.

### Deploying to Azure
Both backend and frontend are deployed to Azure Container Apps using GitHub Actions workflows:

#### Backend Deployment
- Workflow: `.github/workflows/deploy-backend.yml`
- Triggers on changes to `backend/**` or workflow file
- Builds Docker image from `backend/Dockerfile`
- Deploys to Azure Container Apps with FastAPI (Python 3.11)
- Environment variables: `AZURE_CLIENT_ID`, `COSMOS_ENDPOINT`, `COSMOS_DATABASE_NAME`, `COSMOS_ANSWERS_CONTAINER_NAME`, `COSMOS_QUESTIONNAIRE_CONTAINER_NAME`, `FRONTEND_FQDN`

#### Frontend Deployment
- Workflow: `.github/workflows/deploy-frontend.yml`
- Triggers on changes to frontend files (`src/**`, `package.json`, etc.) or workflow file
- Builds Docker image from root `Dockerfile` (multi-stage: Node 20 alpine + nginx)
- Deploys to Azure Container Apps serving static React SPA
- Environment variables: `VITE_API_BASE_URL` (set to backend FQDN)

#### Required Azure Resources
- Provision Azure Cosmos DB (Core SQL API) and copy endpoint/key to env
- Azure Container Apps Environment
- Azure Container Registry
- Managed Identity for accessing Cosmos DB
- Consider adding authentication (e.g., Azure AD / simple JWT) before storing PII

## GitHub Actions Configuration
- Make the helper executable with `chmod +x scripts/configure-github.sh`.
- Populate repository variables and secrets for the deployment workflows with `scripts/configure-github.sh [.azure/<env-name>/.env]`. The script reads the azd environment file (defaults to `.azure/$AZURE_ENV_NAME/.env`) and pushes values such as:
  - Secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
  - Variables: `AZURE_RESOURCE_GROUP`, `AZURE_CONTAINERAPPS_ENVIRONMENT`, `AZURE_CONTAINER_REGISTRY`
  - Variables: `AZURE_BACKEND_APP_NAME`, `AZURE_FRONTEND_APP_NAME`
  - Variables: `COSMOS_ENDPOINT`, `COSMOS_DATABASE_NAME`, `COSMOS_ANSWERS_CONTAINER_NAME`, `COSMOS_QUESTIONNAIRE_CONTAINER_NAME`
  - Variables: `MANAGED_IDENTITY_CLIENT_ID`, `BACKEND_FQDN`, `FRONTEND_FQDN`
- Ensure you are authenticated with `gh auth login` before running the script. Refresh the azd environment (`azd provision` or `azd env refresh`) so the `.env` file contains up-to-date outputs prior to execution.
- Adjust `infra/main.parameters.json` if you customize resource names; re-run the script afterwards to refresh GitHub configuration.

## Folder Structure
```
src/
  components/ui/*      # Basic UI elements
  components/*         # Questionnaire specific pieces
  context/*            # State management
  data/*               # Questionnaire definition
  services/*           # Mock persistence layer
  layout/*             # Page layout
backend/
  Dockerfile           # Backend Python API container
  main.py              # FastAPI application
  requirements.txt     # Python dependencies
Dockerfile             # Frontend React SPA container (root)
nginx.conf             # Nginx configuration for frontend
.github/workflows/
  deploy-backend.yml   # Backend deployment workflow
  deploy-frontend.yml  # Frontend deployment workflow
```

## Customization Ideas
- Add progress indicator or sidebar summary.
- Add avatar or playful accent colors per question.
- Add accessibility improvements (ARIA, keyboard focus states).
- Internationalization for question text.

## License
Internal demo — no license header added per instructions.

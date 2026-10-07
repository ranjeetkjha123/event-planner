# Plan Event

Foundation scaffold for a wedding planning platform. The repository starts from the architecture and product documents in [`docs/`](docs/).

## Architecture

- `frontend/src/`: Next.js App Router with TypeScript. Routes live in `src/app`; shared UI and future feature modules belong under `src/components` and `src/modules`. It calls the backend and must never connect directly to MongoDB.
- `backend/src/`: FastAPI application package. Keep API routes, feature modules, and server infrastructure under this source root. Private data access must be authorized and scoped by `wedding_id` in this service.
- MongoDB Atlas is the planned production database. `docker-compose.yml` provides MongoDB for local development only.
- Google Cloud Storage is the planned private media store. Uploads should use short-lived signed URLs; media bytes do not belong in MongoDB.
- Integrations (Google OAuth, Places, Resend, YouTube and GCS) are documented targets, not implemented in this scaffold.

## Requirements

- Node.js 22.13 or newer and npm (the resolved toolchain includes packages that require Node 22).
- Python 3.11 or newer.
- Docker with the Compose plugin, only if you want the local MongoDB container.

## Run locally

Start MongoDB if needed:

```sh
docker compose up -d mongodb
```

Run the API in one terminal:

```sh
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --app-dir ./src
```

The scaffold API health endpoint is `http://localhost:8000/api/v1/health` and interactive API docs are at `http://localhost:8000/docs`.

Run the frontend in another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The starter page is a placeholder and does not call the API yet. Frontend routes and source files live in `frontend/src/`.

## Environment variables

No environment variables are required by the current scaffold. Copy `.env.example` to `.env` when beginning integration work. The listed names are planned configuration keys; settings are not yet wired to providers. Never commit secrets.

## Quality commands

```sh
# Frontend
cd frontend
npm run lint
npm run typecheck
npm run build

# Backend (from backend/, with its virtual environment active)
python -m compileall app
```

No automated application tests exist yet. Add focused tests with the first implemented business modules.

## Initial implementation boundaries

This scaffold does not implement authentication, authorization, database models or connections, wedding workflows, uploads, email, vendor search, or deployment. It establishes the app entry points and local development shape only. Keep secrets server-side, validate inputs at the API boundary, rate-limit public token endpoints, and enforce wedding membership/role checks for every private operation.

## Design-document note

The PRD defines Admin and Member roles. The API and database designs also define Manager, with invitations restricted to Manager or Member. Resolve this role model before implementing invitation and authorization policies. The system design leaves the GCP compute product open; Cloud Run is an example, not a committed choice.

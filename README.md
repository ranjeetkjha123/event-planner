# Make My Marriage

Starter scaffold for the Make My Marriage wedding-planning platform. Product
requirements and architecture are defined in [`docs/`](docs/).

## Architecture

- `frontend/src/`: Next.js App Router with TypeScript. The approved design is a modular monolith: Route Handlers, domain modules, and server infrastructure live in this application. The browser never connects directly to MongoDB.
- MongoDB Atlas is the planned production database. `docker-compose.yml` provides MongoDB for local development only.
- Cloudflare R2 is the documented media store. Uploads use short-lived signed URLs; media bytes do not belong in MongoDB.
- Google OAuth, Places, Resend, YouTube, and R2 integrations must be implemented according to the design documents before they are treated as available.

## Requirements

- Node.js 22.13 or newer and npm (the resolved toolchain includes packages that require Node 22).
- Docker with the Compose plugin, only if you want the local MongoDB container.

## Run locally

Start MongoDB if needed:

```sh
docker compose up -d mongodb
```

Run the application:

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The starter page is a placeholder. The basic
application health endpoint is `http://localhost:3000/api/v1/health`.

## Environment variables

The starter page and health endpoint need no environment variables. Copy
`.env.example` to `.env` when beginning integration work. These planned
configuration keys are not wired to the current scaffold. Never commit secrets.

## Quality commands

```sh
# Frontend
cd frontend
npm run lint
npm run typecheck
npm run build
```

## Initial implementation boundaries

This scaffold does not implement authentication, authorization, database models or connections, wedding workflows, uploads, email, vendor search, or deployment. It establishes the app entry points and local development shape only. Keep secrets server-side, validate inputs at the API boundary, rate-limit public token endpoints, and enforce wedding membership/role checks for every private operation.

## Design-document note

The PRD describes Admin, Manager, and Member access in its detailed role rules. Keep role behavior aligned with the API and database designs when implementing authorization.
# Google Stitch MCP (Codex)

This repository includes a project-scoped Codex MCP connection to Google Stitch.
It exposes read-only project and screen lookup tools, including screen retrieval
for inspecting Stitch screenshots. It does not add Stitch credentials or code to
the wedding application runtime.

1. Copy `STITCH_API_KEY` from `.env.example` into the ignored project `.env.local`
   file and set its value. Do not commit the key.
2. Trust this project in Codex so its `.codex/config.toml` is loaded.
3. Restart/reload the Codex session and approve/connect to the `stitch` MCP server.
4. Ask Codex to list the Stitch projects, then retrieve screens from the target
   project to inspect their screenshot references.

The connection uses Google's `https://stitch.googleapis.com/mcp` endpoint. The
local helper sends the key as `X-Goog-Api-Key` and prints only the HTTP header
JSON required by Codex. `.env.local` is ignored by Git. Codex reads that file
through the helper; the Next.js app does not consume `STITCH_API_KEY`.

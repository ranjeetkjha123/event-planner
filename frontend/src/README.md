# Frontend source layout

This Next.js frontend follows the feature-oriented layout of the Make My Marriage reference project. The directories below are architecture placeholders; product routes, components, modules, and provider integrations will be added as those features are implemented.

- `app/` contains route entry points and API route handlers.
- `components/` contains reusable UI grouped by product area.
- `config/` contains frontend/server configuration accessors and their tests.
- `modules/` contains feature use cases and domain logic.
- `server/` contains infrastructure adapters for auth, database, email, HTTP, and storage.

The approved system design uses Next.js Route Handlers for HTTP boundaries and
server-side modules for business logic and persistence. Do not add a separate
FastAPI service; keep secrets and database access server-side.

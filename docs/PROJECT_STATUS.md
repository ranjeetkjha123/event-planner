# Make My Marriage — Project Status

**Last updated:** 2026-10-23

### Follow-up — guest list foundation — 2026-10-23

- Added wedding-scoped guest records with validated create, list, read, update,
  and delete APIs. Admins and Managers can manage records; Viewers can read
  them. Guest-to-event associations are restricted to active events in the
  same wedding, and API responses do not expose invitation tokens.
- Added `/guests` with search, RSVP/event filters, paging, guest household
  details, party limits, event selection, and create/edit/remove controls. Added
  the Guests navigation entry to the workspace and dashboard.
- Scope limitation: this increment stores guest planning records only. It does
  not send invitations, provide public RSVP links, or change the dashboard's
  unavailable Guest/Confirmed metrics. Those require the next invitation and
  RSVP increment. The documented API design contains an older implementation
  note for guest features; this checkout previously had no guest module or
  routes, so that note does not describe the code that was present here.
- Validation: ESLint and TypeScript (`--incremental false`) passed; all 23
  automated tests passed with Node 24.22.1. Localhost Admin QA created a
  disposable guest, confirmed it persisted after reload, edited it, confirmed
  the update, and deleted it; a fresh page load showed an empty list. This
  exposed and fixed a capacity-guard bug for guests whose RSVP attendance count
  is null. The dashboard's Guest card now links to the list.
- Task QA: on localhost, created a disposable task, confirmed it appeared in
  the task list, edited and reloaded it, and confirmed it was absent after a
  fresh list load following deletion/cleanup. The normal five wedding tasks
  remained. No production deployment was checked.
- Remaining: verify Viewer write denial and cross-wedding isolation; add
  invitation sending and guest RSVP flows; then connect
  guest counts to the dashboard after RSVP data is available.

### Follow-up — event creation screen and populated wedding plan — 2026-10-23

- Added Admin/Manager event creation to the Events screen, which previously
  exposed only edit/archive controls even though the documented create API was
  available. Event count now updates immediately, and descriptions are visible
  in the event list.
- In the signed-in local wedding workspace, created four draft events
  (Mehendi, Sangeet, wedding ceremony, and reception) around the saved wedding
  date. No venue or address was invented; descriptions mark the schedule as
  tentative and ask the family to confirm timing and venue details.
- Updated the existing photographer task with actionable details and linked it
  to the ceremony. Added three assigned, event-linked planning tasks for venue
  confirmation, Sangeet production, and the ceremony run-of-show, plus one
  reception planning task.
- Validation: ESLint, TypeScript, and `git diff --check` passed. Browser
  verification confirmed the four events and five tasks persisted after
  navigation/reload and appeared in the dashboard summary (4 events, 5 open
  tasks). These records are real workspace data; dates, venues, and plans still
  need family confirmation.

### Follow-up — task management and dashboard — 2026-10-23

- Added the wedding-scoped `tasks` collection and indexes, validated CRUD APIs,
  assignment to current wedding members, active-event association, pagination,
  status/priority/member/event filters, and optimistic update conflict checks.
- Added the `/tasks` screen for Admins and Managers to create, edit, complete,
  filter, assign, and delete tasks. Viewers can read tasks but cannot change
  them. The dashboard now shows task completion progress and up to five tasks
  due today or later, using the wedding time zone.
- Reworked the signed-in dashboard to follow the Stitch dashboard preview and
  PRD command-center structure: planning sidebar, wedding countdown, summary
  cards, upcoming events, and task progress. Guest, RSVP, and expense cards are
  clearly marked unavailable until those modules exist; no sample counts or
  budget calculations are presented as live wedding data.
- Updated same-origin verification to respect the request Host and forwarded
  protocol, so local `localhost` and `127.0.0.1` origins both pass when matched.
- Validation: 19 focused tests passed, ESLint and TypeScript passed, and
  `git diff --check` passed. Local HTTP checks confirmed signed-out redirects,
  task API authentication, invalid-filter validation, and mismatched-origin
  rejection. Signed-in Admin QA verified login, task screen rendering, create,
  readback, edit/complete, dashboard summary rendering, delete, and cleanup
  against MongoDB. The temporary QA task was confirmed absent after deletion.
  The redesigned dashboard returned 200 in a signed-in render check, showed the
  real planning sections and unavailable-module labels, and omitted sample
  budget values. ESLint and TypeScript checks passed after the layout update.
- Documentation note: `API_DESIGN.md` contains an older note calling task API
  behavior implemented, but the prior checkout had no task module or routes.
  Its contract was followed; that older status wording does not prove prior
  implementation in this checkout.
- Remaining: verify Viewer read-only behavior, Manager writes, assignment and
  event association, and cross-wedding rejection with disposable memberships
  and event data. Production deployment has not been verified.

### Follow-up — workspace section navigation — 2026-10-22

- Added consistent navigation between the wedding Overview, Events, and Admin-
  only Members sections. The dashboard remains the workspace landing page and
  links directly to the existing event-management flow; non-Admin members do
  not see a Members navigation entry.
- Validation: all 14 tests, ESLint, TypeScript, and `git diff --check` passed.
  Started Next.js on `127.0.0.1:3100` with Webpack after the default port/dev
  lock was unavailable. HTTP checks returned 200 for login, redirected
  unauthenticated dashboard/events/members pages to login, and returned 401
  from the events API. No wedding data was read or changed.
- Remaining: signed-in visual QA under Admin, Manager, and Viewer accounts;
  the current browser automation session did not grant desktop access.

### Follow-up — invitation role and invited-user flow — 2026-10-22

- Added the `VIEWER` wedding role with read-only access to the dashboard,
  wedding details, and event list. Viewer event creation is denied by the
  service/API, wedding editing is already restricted to Admin/Manager, and
  member administration remains Admin-only.
- Invitation forms in onboarding and member settings now default to Viewer and
  let an Admin choose Viewer, Manager, or Admin. The invitation schema also
  defaults omitted roles to Viewer; role changes retain final-Admin protection.
- Invitation links now retain their token through signup/login and return the
  user to the invitation after authentication, where they can accept the
  invited wedding instead of being sent directly to new-wedding onboarding.
- Updated PRD, system, database, and API role definitions to include Viewer and
  the default-role policy. Updated the invitation email to label Viewer as
  read only.
- Validation: all 13 tests passed with Node 24; lint and TypeScript checks
  passed; `git diff --check` passed. No live database, email, or browser
  acceptance test was performed in this change.
- Remaining: manually exercise role selection, Viewer write denial, invited
  signup/sign-in and acceptance in localhost; verify email delivery and the
  deployed flow after redeployment. Existing members retain their stored role
  until an Admin changes it; only newly created invitations default to Viewer.

### Follow-up — event editing and archiving — 2026-10-22

- Added membership-scoped event updates and soft archival. Updates validate
  partial input, merge start/end times before saving, clear optional values,
  reject edits to archived events, and detect concurrent changes. Archive sets
  `archivedAt`; it preserves the event and its existing references.
- Added the signed-in `/events` management page with event details, wedding-time-
  zone display/editing, a dashboard link, and an archive warning. Viewers can
  read the list; API writes remain restricted to Admin/Manager.
- Validation: all 14 tests passed; ESLint and TypeScript passed. Browser QA in a
  disposable Admin workspace created an event, edited its description, reloaded
  to verify persistence, and archived it from the active list. The default
  Viewer invitation selection and available roles were visible in onboarding.
  API checks returned 401 for unauthenticated updates/deletes and 400 for a
  malformed event ID. Temporary QA account, wedding, event, membership, session,
  and signup rate-limit rows were removed.
- Limitations: no separate Viewer account was used for browser write-denial QA;
  that denial is covered by the permission unit test. Invitation acceptance,
  actual email delivery, and production behavior remain unverified because no
  separate invitee/sender-domain browser run was performed. The default
  Turbopack build was denied write access to `.next/trace`; the production
  Webpack build completed successfully with generated-file write access.

### Follow-up — approved database reset and fresh account QA — 2026-10-21

- After the user explicitly approved clearing all project data, deleted every
  document from the seven non-system collections in `make_my_marriage`; kept
  collection/index definitions. Verified each collection was empty immediately
  after deletion.
- Recreated the user's account through signup, verified the new session and
  sign-in, created a fresh wedding workspace using the couple/date/location
  details previously shown, and confirmed wedding readback as Admin.
- Sent one Manager invitation to the user-authorized recipient through Resend.
  The app returned success and the pending invitation was read back from MongoDB.
  The Outlook inbox and the invitation acceptance click were not directly
  observed; those still need recipient-side confirmation.
- Logged out and confirmed the session endpoint returned 401. No passwords,
  cookies, tokens, or invitation URLs were recorded in project docs.

### Follow-up — member role editing — 2026-10-21

- The Admin members screen now offers an Admin/Manager selector and explicit
  Save action for each member. Saving calls the documented
  `PATCH /api/members/:membershipId` endpoint.
- The server validates the role, authenticates and rechecks Admin authority,
  scopes the target to the current wedding, and protects the final Admin using
  a transaction that serializes role changes for the wedding.
- Validation: all 12 tests, lint, TypeScript, and diff checks passed. Live QA
  against MongoDB passed 12 checks: Admin members page output, current-role
  readback, Manager authorization denial, promote/demote and persistence,
  final-Admin protection, changed-role authorization, invalid-role rejection,
  and cross-wedding isolation. Three disposable users, two weddings, their
  memberships, and sessions were removed. No invitation emails were sent.
- Remaining QA: manually click the role selector in a browser and verify the
  refreshed screen under a signed-in Admin session; concurrent Admin role
  changes were not stress-tested.

### Follow-up — invitation link origin — 2026-10-20

- Invitation URLs now use `NEXT_PUBLIC_APP_URL` when configured, rather than
  the incoming request host. This prevents production invitation emails from
  containing a local or proxy-generated host. Local development falls back to
  the local request origin.
- Production requires `NEXT_PUBLIC_APP_URL`; set it to the deployed web app URL
  (for example, the public Vercel URL). The sender address configured in Resend
  is independent of this app URL.
- Validation: ESLint, TypeScript, and `git diff --check` passed. No new email was
  sent as part of this code change.

## Workspace audit — 2026-10-17

The historical milestones below describe work that was previously recorded,
but most do not match the source files present in this checkout. A source
inventory on 2026-10-17 found no authentication, wedding, member, event, task,
guest, RSVP, or gallery implementation files. The public marketing homepage has
since been rebuilt in this workspace; see the current homepage milestone below.
Treat older feature claims as historical records, not as verified features
available in this checkout. The Next.js health Route Handler is operational
only and does not establish database connectivity.

The current docs define a Next.js modular monolith. The FastAPI package still
present under `backend/` is a leftover scaffold that conflicts with that
architecture and is not part of the documented app startup path. The public
homepage is the first current product UI increment; email/password accounts and
MongoDB sessions are implemented and have passed a live local smoke check.
Wedding creation, editing, session-aware navigation, event persistence, and the
member invitation flow are implemented in this checkout. Invitation delivery
and acceptance still need live end-to-end QA with separate accounts. Task CRUD
and the dashboard task summary are implemented, and signed-in Admin persistence
passed local QA; Manager, Viewer, and cross-wedding association checks remain.

This is the ongoing record of major development milestones. Read it before
starting development and update it whenever a major feature is implemented or
materially changed. Product scope and architecture remain defined by the PRD,
System Design, Database Design, and API Design documents.

## Current position

The source files present in this checkout include the public homepage, account
entry screens, wedding setup and dashboard, event management, and the Next.js
health Route Handler. Email/password signup, sign-in, logout, and current-session
lookup use MongoDB-backed accounts and server-side sessions. Wedding setup
persists the wedding plus its creator's Admin membership. Wedding details,
member invitations/roles, and event creation/editing/archiving are membership-
scoped. The public homepage reads the server session and switches between
account/workspace actions and signed-out account links. Invitation acceptance
joins the authenticated user atomically to the wedding. Wedding-scoped task
CRUD, current-member/event assignment checks, filters, and a dashboard task
summary are implemented; signed-in Admin persistence passed local QA, while
Manager, Viewer, and cross-wedding behavior remain to verify. The health endpoint
returns application health only and does not verify MongoDB or provider connectivity.

The dated milestone table and detailed entries below preserve earlier reported
work. Current account authentication was reverified locally on 2026-10-20;
older wedding, planning, guest, and gallery claims remain historical and cannot
be verified against the source files in this checkout. The backend FastAPI
scaffold also remains outside the current Next.js modular monolith startup path
described by the system design.
| Milestone | Status | Recorded on |
| --- | --- | --- |
| Application scaffold | Complete — foundation only | 2026-09-10 |
| Public homepage | Complete — UI with mock data | 2026-09-10 |
| Account authentication | Complete — account scope tested and reviewed | 2026-09-10 |
| Wedding onboarding and overview | Complete — implemented scope accepted | 2026-09-10 |
| Wedding detail editing | Complete — implemented scope accepted | 2026-09-11 |
| Wedding member invitations | Complete — implemented scope accepted | 2026-09-12 |
| Member roles and removal | Complete — implemented scope accepted | 2026-09-12 |
| Initial Vercel deployment and custom domain | Live — confirmed by user | 2026-09-15 |
| Wedding workspace skeleton | Complete — implemented scope accepted | 2026-09-15 |
| Wedding events | Complete — implemented scope accepted | 2026-09-16 |
| Wedding tasks | Complete — implemented scope accepted | 2026-09-16 |
| Guest management | Complete — implemented scope accepted | 2026-09-16 |
| Guest invitation sharing and public RSVP | Complete — implemented scope accepted | 2026-09-16 |
| Gallery R2 setup | Configured — development storage verified | 2026-09-18 |
| Organiser photo gallery | Implemented — source publication authorised | 2026-09-18 |
| Public marketing homepage rebuild in this checkout | Revised against Stitch — illustrative UI | 2026-10-17 |
| Account and wedding setup screens | In progress — interactive UI prototype only | 2026-10-18 |
| Email/password authentication | Implemented — signup, sign-in and logout verified against MongoDB; other Foundation work remains | 2026-10-18 |
| Wedding creation and initial dashboard | Implemented — persistence and creator Admin membership; events and invitations tracked in later follow-up entries | 2026-10-20 |
| Wedding details edit and save | Implemented — edit form and role-authorized, membership-scoped PATCH; persistence round trip verified with disposable QA workspace | 2026-10-20 |
| Homepage session-aware navigation | Implemented — signed-in users see account and wedding/setup links; signed-out users see sign-in/create-account links; verified with disposable account | 2026-10-20 |
| Wedding event management | Implemented — creation, listing, editing, and soft archive; browser edit/archive QA passed | 2026-10-22 |
| Wedding member invitations and acceptance | In progress — hashed-token acceptance, Admin UI, revocation, and matching-email QA passed; Resend delivery awaits sender-domain setup | 2026-10-20 |
| Wedding task management and dashboard summary | Implemented — signed-in Admin CRUD and dashboard persistence QA passed locally; other roles and tenant boundaries remain | 2026-10-23 |

Dates above record when progress was documented or verified, rather than
asserting the original creation date of earlier work.

## 1. Application scaffold

**Status:** Complete — foundation only

**Recorded on:** 2026-09-10

### Implemented

- Next.js App Router application with TypeScript, React, and Tailwind CSS.
- Routing and layout under `src/app`, infrastructure under `src/server`, and
  environment configuration under `src/config`.
- Reusable Mongoose connection helper and Zod environment validation.
- HTTP response/error helpers and secure token generation/HMAC-SHA-256 hashing
  utilities.
- Development, production build, Webpack build fallback, lint, typecheck, and
  Vitest scripts; focused tests for environment, token, and error utilities.
- Project requirements and development rules documented in `docs` and
  `AGENTS.md`.

### Validation

- Development server started successfully and the initial scaffold returned
  HTTP 200 at `/`.
- Initial scaffold was reviewed in the browser and confirmed working by the user.

### Boundaries

- Infrastructure helpers do not constitute working authentication or wedding
  management features.
- The scaffold browser check did not verify a live MongoDB connection or external
  provider integrations.
- Utility tests are present; this entry does not claim a fresh test run.

## 2. Public homepage

**Status:** Complete — UI with mock data

**Recorded on:** 2026-09-10

### Implemented

- Public homepage at `/`, based on the Stitch project
  “Make My Marriage SaaS Landing Page.”
- Burgundy, ivory, and muted gold styling, locally hosted Manrope and Playfair
  Display fonts, the supplied logo, and wedding imagery.
- Header, hero, sample wedding dashboard, planning overview, family roles,
  V1 feature cards, multi-event timeline, guest invitation/RSVP illustrations,
  photo-sharing section, theme previews, trust section, final call to action,
  and footer.
- Responsive layouts, mobile navigation including Sign In, section links,
  keyboard focus styles, a skip link, and reduced-motion support.
- Three local wedding-theme preview dialogs.
- Originally, Start Planning and Sign In opened availability messages. These
  were replaced by working account links in the authentication milestone.
- Follow-up on 2026-09-11: homepage actions now reflect the current session on
  the initial server render. Signed-out visitors retain Sign In/Start Planning;
  signed-in visitors see Continue setup or Go to your wedding. Desktop header,
  mobile menu, hero, and final planning actions share this state. Existing
  session-change, focus, visibility, and page-restoration listeners revalidate
  actions without redirecting away from the homepage. Network failures retain
  the last known state.
- Homepage components under `src/components/home`; local illustrative data in
  `src/components/home/home-data.ts`; thin page entry in `src/app/page.tsx`.
- Removed design content outside V1, including accommodation, transport,
  budget allocation, granular roles, real-time updates, and custom domains.

### Validation

- Lint and TypeScript checks passed during implementation.
- Final production build passed using `npm run build:webpack`.
- Homepage session follow-up: all 87 tests, lint, TypeScript, and the Webpack
  production build passed. Focused tests cover server-provided initial states,
  desktop/mobile actions, cross-tab login/logout, wedding creation, network
  failure, and listener cleanup. The user accepted this follow-up and authorized
  committing and pushing it on 2026-09-11.
- Browser checks covered desktop and small-screen layouts, horizontal overflow,
  image loading, section navigation, mobile menu behaviour, planning messages,
  and theme dialogs. No browser warnings or errors were observed in that check.

### Remaining work and limitations

- The dashboard, invitations, RSVP, gallery, and QR illustration are marketing
  previews, not functioning domain features. No backend APIs or database flows
  were added for the homepage.
- Follow-up on 2026-09-10: Start Planning and Sign In now link to working signup
  and login screens, replacing the original availability messages.
- Sample social-proof figures, including “4,200+ couples” and “4.9/5,” were
  retained at the user's request for the development UI. Replace with verified
  figures or remove them before public launch.
- The final default Turbopack build encountered a local worker port permission
  error. The existing Webpack fallback succeeded; revisit the default build in
  an environment permitting its worker processes.
- This milestone was delivered through the local development preview; no
  production deployment was performed.

### Current checkout rebuild — 2026-10-17

**Status:** Implemented — illustrative marketing UI

#### Implemented scope

- Rebuilt `/` as a responsive public landing page with product introduction,
  Indian wedding event ribbon, shared-planning explanation, three-step overview,
  planning feature cards, illustrative dashboard, guest invitation preview,
  and closing call to action.
- Added accessible section navigation, skip link, focus styles, and reduced
  motion handling. The page uses CSS and inline SVG illustration; it adds no
  dependency or external image request.
- Kept dashboard and guest invitation content explicitly illustrative. Links
  navigate to sections on this page because signup/login routes are absent from
  the current checkout.
- Kept the route entry thin in `src/app/page.tsx`; presentation lives in
  `src/components/home/landing-page.tsx`.

#### Validation

- `npm run lint`, `npm run typecheck`, and `npm run build` passed on 2026-10-17.
- Local Next.js server returned HTTP 200 for `/`; the page was visually checked
  in the available narrow browser viewport. The production build includes the
  static `/` route and the health endpoint.

#### Remaining work and limitations

- No approved Stitch screenshot or supplied homepage asset was present in the
  current source tree, so the page follows the written homepage brief retained
  in this status document.
- Desktop browser review remains to be done. Current calls to action are
  in-page navigation only; wire account creation and sign-in after those flows
  are implemented in the Foundation phase.
- This page is UI only. Dashboard numbers and guest invitation are sample
  illustrations, not connected product data or working guest flows.
- No production deployment was performed.

## 3. Account authentication

**Status:** Complete — account scope tested and reviewed

**Recorded on:** 2026-09-10

### Implemented

- Responsive `/signup` and `/login` screens matching the homepage palette,
  typography, and imagery; password visibility, pending states, and errors.
- Signup, login, logout, and current-user APIs with documented response shapes.
- MongoDB users, normalized unique email addresses, Argon2id password hashes,
  and server-side sessions. Cookie secrets are HMAC-hashed in MongoDB; cookies
  are HttpOnly, SameSite=Lax, and Secure in production, with a default 30-day
  lifetime. Expiration is checked on reads independently of TTL cleanup.
- Protected `/welcome` showing the signed-in user and a working sign-out action.
- Strict Zod validation, bounded JSON bodies, configured-origin mutation checks,
  no-store API responses, and persistent MongoDB rate limits.
- Account use cases live in `src/modules/auth`; session/password/HTTP mechanisms
  live in `src/server/auth`; route handlers remain thin.

### Validation

- Latest verification: all 28 tests, lint, TypeScript, and the production
  Webpack build passed after the manual-testing fixes.
- On 2026-09-10, the user confirmed testing and code review were complete and
  accepted the feature. The earlier pending browser acceptance checks are closed.
- Live development API checks passed for signup, normalized-email duplicates,
  invalid credentials, current user, protected welcome, cookie flags, cross-site
  request rejection, login, logout revocation, explicit expiry, and rate limiting.
  The temporary test account and its sessions were removed afterward.
- Signup checked at desktop and narrow mobile widths, with loaded images and no
  horizontal overflow; required-field focus and sign-in navigation verified.


### Boundaries and operational choices

- Manual-testing fixes on 2026-09-10: authenticated visits to `/login` and
  `/signup` now redirect server-side to `/welcome`. Welcome tabs revalidate
  `/api/auth/me` on a cross-tab session-change marker, focus, visibility return,
  and page restoration; a 401 hides stale content and redirects to sign-in.
  Storage contains only a random change marker, never credentials or user data.
  Storage-disabled browsers still revalidate when the tab is focused again.
  Passwords over 128 characters receive plain-language errors on both endpoints.
  Validation: 28 tests, lint, and TypeScript passed; live temporary-account checks
  verified redirects and both password messages. Client-effect regression tests
  cover cross-tab logout, focus fallback, listener cleanup, and network failures.
  The user subsequently confirmed completion of testing and code review.

- Logout fix on 2026-09-10: the browser sends an empty POST, which Next.js
  represents as a readable stream. The original parser incorrectly required
  JSON for that empty stream. Logout now accepts zero body bytes while retaining
  validation of nonempty bodies and origin checks. Four route regression cases
  were added (20 tests total pass), along with passing lint and TypeScript checks.
  Live verification using the button's empty-body request confirmed session
  deletion, cookie clearing, and rejection of the revoked session. The temporary
  verification account was removed.

- Follow-up on 2026-09-10: wedding onboarding now supplies real membership and
  wedding context. Login reports actual `hasWedding`; `/me` returns the role and
  a wedding summary. `/welcome` redirects to onboarding or the overview.
- Password reset/email delivery and email verification are not part of this
  increment. Passwords must be 12–128 characters when signing up.
- `NEXT_PUBLIC_APP_URL` must match the browser origin exactly. Set an HTTPS URL
  for production and configure MongoDB plus `AUTH_TOKEN_PEPPER` server-side.
- The new infrastructure collection `auth_rate_limits` provides atomic fixed
  windows with TTL cleanup: 10 attempts per normalized email per 15 minutes,
  plus shared ceilings of 30 signup / 60 login requests per minute. The shared
  ceiling avoids trusting client-supplied IP headers.
- Deferred on 2026-09-10 for local development or a small private V1 pilot:
  one caller can exhaust the shared signup/login quota, including with malformed
  requests, temporarily blocking authentication requests from everyone. This is
  an availability limitation, not an authentication bypass. Before opening public
  signups, replace the low shared ceiling with per-client limiting using a trusted
  proxy-provided IP or an edge limiter; retain the per-email limit. Add regression
  tests proving that one client's exhausted quota does not block another client.
  This fix remains unimplemented.
- If session creation fails after a user is saved, that account can subsequently
  sign in; signup intentionally does not require a multi-document transaction.
- No production deployment was performed.

## 4. Wedding onboarding and overview

**Status:** Complete — implemented scope accepted

**Recorded on:** 2026-09-10

### Design references

The user approved these screens in Stitch project `5169674594013355245`:

- “V1 — Wedding Onboarding — Desktop” (`488c0256e8f3409d83b923fc63d2bd6b`).
- “V1 — Wedding Onboarding — Mobile” (`87876a92da0942249fb60a7814e48fec`).
- “V1 — Wedding Overview — Desktop” (`0437561737dd4e3e846f84bc08dc41e5`).
- “V1 — Wedding Overview — Mobile” (`0307d6983d9d4361a4a7fede90490c9a`).

### Implemented

- `/onboarding`: responsive single-page form for required names, calendar date,
  and manual location; optional title/description; selectable time zone defaulting
  to Asia/Kolkata. Title suggestion, inline errors, first-invalid-field focus,
  disabled submitting state, retry messaging, and retained values after failures.
- `/dashboard`: saved names/title, wedding date, time-zone-aware countdown,
  location, time zone, description, signed-in user and role, and sign out. This is
  the initial overview, not the future aggregate management dashboard.
- Thin authenticated `POST /api/wedding` and `GET /api/wedding` routes with strict
  body/query validation, origin checks, and no-store responses.
- Wedding and initial Admin membership created in a MongoDB transaction. Unique
  membership indexes enforce one wedding per user, including concurrent requests.
- Unique stable website slug with collision handling; stable high-entropy gallery
  share secret, omitted from ordinary responses. API Design section 108 and
  AGENTS.md explicitly supersede the older database `gallery.tokenHash` field:
  the implementation stores `gallery.token` with a unique index and hidden selection.
- Auth routing reflects membership, and other tabs refresh when a wedding is
  created. Logout authenticates independently of wedding availability.
- Review follow-up on 2026-09-10: onboarding has its own session boundary. An
  expired session keeps the form mounted and disables submission, with a sign-in
  link that opens another tab. Reauthentication as the same user resumes the
  retained draft; a different user or an existing wedding unmounts it before
  navigation. Identity is rechecked before submitting. Overview pages retain
  their normal expired-session redirect behaviour.
- Local fonts/logo and decorative SVG arches. Stitch state-example boards become
  real form states; unbuilt footer links and promises about future features are
  omitted. No user wedding details are prefilled with the design's sample data.

### Validation

- Latest verification: 58 tests, lint, and TypeScript checks passed. Production
  Webpack build passed. Five additional real React component tests cover draft
  retention on focus expiry, same-user recovery, different-user clearing, expiry
  during submission, pre-submit identity checks, and network-failure recovery.
  `happy-dom` was added as a development-only dependency to test mounted form
  state, rather than relying on mocked React hooks for this regression.
- Live development checks passed for routing, invalid input, concurrent creation
  (one wedding and one Admin membership), duplicate rejection, slug collisions,
  cross-user isolation, omission of share secrets, persisted overview data,
  membership after logout/login, and unauthenticated protection. Temporary users,
  weddings, memberships, and sessions were removed after verification.
- Desktop and mobile layouts checked using rendered responses from the temporary
  accounts, with no horizontal overflow. The visual preview used static responses;
  it does not substitute for interactive browser acceptance testing.
- On 2026-09-10, the user accepted this increment after reviewing the feature
  and the session-expiry draft-retention fix, and authorized committing and
  pushing it to GitHub. Earlier pending acceptance work is closed.

### Boundaries

- Requires MongoDB Atlas or a replica set for transactions; no standalone-server
  fallback that could leave an orphan wedding.
- Onboarding drafts stay only in the original tab's React state. Reloading,
  closing, or deliberately navigating away from the tab discards the draft;
  nothing is persisted to browser storage. The expiry notice explains this.
- Dates are stored as `YYYY-MM-DD`, with a named time zone. Past dates are permitted
  and receive a “Celebrated … ago” label; today gets a wedding-day label.
- Website starts unpublished with the Classic theme. Gallery, guest uploads, and
  livestream start disabled. These are initial settings, not implemented features.
- Wedding editing, cover uploads, Places autocomplete, member invitations, and
  aggregate dashboard metrics remain separate increments. No `/api/dashboard`
  aggregation or future feature routes were added.
- Follow-up on 2026-09-11: wedding editing is implemented in milestone 5. Creation
  and editing now share the wedding-details form and draft session boundary;
  onboarding retains its existing expiry and account-switch protection.
- This milestone is delivered through the local development preview. Publishing
  the source to GitHub does not constitute a production deployment.

### Current checkout follow-up — 2026-10-20

**Status:** Implemented — end-to-end local database flows verified

#### Implemented scope

- The current onboarding flow submits validated couple, date, title, description,
  time-zone, and city details to `POST /api/wedding`.
- The service atomically creates the Wedding and creator's `ADMIN` membership,
  generates a unique stable website slug and a hidden high-entropy gallery
  secret, and rejects repeat creation for the same account. GET `/api/wedding`
  derives access from the signed-in user's membership and returns no share secret.
- `/onboarding` and `/dashboard` require a valid session and route users based
  on whether they have a Wedding. The dashboard shows only persisted values.
- `/wedding/edit` pre-fills the persisted wedding, and `PATCH /api/wedding`
  allows Admin/Manager members to save validated updates to their own wedding.
- The homepage reads the current server session and displays the account and
  wedding/setup action while signed in, or the sign-in/create-account actions
  while signed out.
- Selected event names, dates, and local start times are saved as Event records;
  the dashboard reads them back in the wedding time zone.
- Admins can invite members through Resend, list/revoke pending invitations, and
  view current members. Invitees use a high-entropy link, sign in or create an
  account with the matching email, and accept into the wedding. Acceptance
  creates membership and consumes the invitation in one MongoDB transaction.
- Resend uses the existing `RESEND_API_KEY` plus `RESEND_FROM_EMAIL`; these are
  server-only. Invitation tokens are HMAC-SHA-256 hashed with
  `AUTH_TOKEN_PEPPER` and expire after seven days.
- Focused invitation/event schema and timezone conversion tests were added.

#### Validation

- Implementation and documentation review completed against the PRD and API,
  database, and system design documents.
- Lint, TypeScript, and all 11 focused tests passed with Node 24.19.0. The
  production build was attempted but blocked by Windows `EPERM` writing build
  output while the local dev server was running; the dev server remains active.
- Local API/database QA passed on 2026-10-20 after restarting the dev server to
  load the updated Mongoose model: 16 flow checks passed for signed-out access,
  signup/session, invalid-date rejection, wedding creation/readback, secret
  omission, initial Admin membership, duplicate creation, dashboard and
  onboarding guards, logout, and sign-in persistence. A final database cleanup
  check also passed; the disposable user, wedding, membership, and rate-limit
  record were removed.
- End-to-end QA verified wedding edit/save/readback, edit-page rendering,
  unchanged wedding slug, and homepage session persistence across home/dashboard
  navigation, sign-out, and sign-in. All temporary QA records were removed.

#### Remaining work

- Live QA remains for Resend delivery to a user-approved address, token
  acceptance with the matching account, email-mismatch rejection, expiry,
  revocation, and persisted event readback. The invitation feature is not marked
  complete until these external/database flows are verified.
- Follow-up event CRUD (editing and archiving), role changes/removal, and member
  notification controls remain out of this increment.
- Restart the local dev server after changing a Mongoose model so its cached
  schema is reloaded. QA found that the pre-change process accepted a create
  request but stripped fields from the saved document; the fresh-process rerun
  passed.
- Stitch MCP configuration is present in `.codex/config.toml`, but its tools
  were unavailable in this session. Screen references recorded above remain the
  design source used for this increment; no new screenshot was retrieved.

## 5. Wedding detail editing

**Status:** Complete — implemented scope accepted

**Recorded on:** 2026-09-11

### Implemented

- Based on the user-approved “V1 — Edit Wedding” screen
  (`5a07cbd146ca4f49bdce1ced27d86d71`) in Stitch project
  `5169674594013355245`, with a responsive layout matching onboarding.
- Overview links to `/wedding/edit`, prefilled with saved names, date, location,
  optional title/description, and time zone. Includes title suggestion, optional
  text clearing, validation, save progress, retry errors, and a saved confirmation
  on return to the overview.
- Authenticated `PATCH /api/wedding` permits Admin and Manager membership roles,
  derives wedding ownership from the current membership, and validates partial
  updates. The design's Admin-only wording is adjusted to match API permissions.
- The form sends only changed fields. API location patches preserve omitted
  nested fields; changing the manual location in the form explicitly clears
  obsolete structured address/coordinate metadata. Slug and gallery token stay
  unchanged and are not editable through this endpoint.
- Cancel, in-app navigation, and sign out confirm before discarding changes.
  Refresh/close use the browser's native warning; the overview enters editing
  through document navigation so browser Back also crosses that boundary.
- Session expiry retains and disables the mounted draft. Signing in as the same
  user in another tab resumes editing; changing identity or wedding clears the
  form before navigation. Saving rechecks identity. Other overview tabs refresh
  saved details on session-change signals or focus.
- Review fix on 2026-09-11: the overview keys its countdown by wedding date and
  time zone so refreshed details reset the countdown immediately. Regression
  tests update both fields without remounting the overview or advancing timers.

### Validation

- All 79 tests, lint, TypeScript, and the production Webpack build passed.
  Tests cover partial validation, membership authorization, missing weddings,
  real form state, changed-field submissions, failure retention, discard guards,
  and session expiry/recovery. Existing onboarding and authentication tests pass.
- Live development API checks verified persisted updates, optional text clearing,
  nested field preservation, Admin/Manager access, unauthenticated rejection,
  wedding isolation, protected-field rejection, and unchanged slug/gallery token.
  Saved edit and overview responses were checked. Temporary test data was removed.
- Desktop and mobile static response previews checked for layout and horizontal
  overflow. These checks and component tests do not replace manual interactive
  acceptance testing. On 2026-09-11, the user accepted this increment and its
  review fixes and authorized committing and pushing the source to GitHub.
- Final regression verification after the countdown fix: all 89 tests,
  TypeScript, and lint passed. The production Webpack build also passed for the
  final increment before publication.

### Boundaries

- Drafts remain in memory in the original tab; there is no recovery after a
  confirmed reload, close, or departure. Native unload warnings depend on browser
  support and user interaction.
- Concurrent updates use last-write-wins for each submitted field; there is no
  version conflict interface in this increment.
- Cover uploads, Places autocomplete, invitations, and aggregate dashboard
  metrics remain separate features. No production deployment was performed.

## 6. Wedding member invitations

**Status:** Complete — implemented scope accepted

**Recorded on:** 2026-09-11

### Design references

Approved screens in Stitch project `5169674594013355245`:

- “V1 — Wedding Members” (`79a70c7a2fe14665a4098b88c6f2abe5`), including the
  nested Invite Wedding Member and Revoke Wedding Invitation dialogs.
- “V1 — Accept Wedding Invitation” (`544de539d95e466eab35e831427bf579`).
- Implemented responsive website layouts; design state-switcher controls and
  unbuilt footer links are omitted. Existing application logo/fonts are reused.

### Implemented

- Admin-only `/settings/members`, linked from the signed-in wedding header.
  Lists real member names/emails/roles and pending invitations; shows the current
  user, empty/loading/retry states, invite dialog, revoke confirmation, and
  success feedback. Failed sends retain entered email and role.
- Member listing API permits Admin and Manager reads, per API Design. Invitation
  administration and its UI remain Admin-only, per the PRD. Role editing and
  removal of existing members are outside this increment.
- Follow-up on 2026-09-12: role editing and member removal are implemented in
  milestone 7, reusing the Members page and dialog styling.
- Thin member-list, invitation-create/list/revoke, public invitation-read, and
  acceptance endpoints. All mutations check origin; routes validate bodies,
  queries, and parameters, authenticate where required, and return no-store
  responses. Wedding scope is derived from membership.
- Normalized email, Admin/Manager roles, seven-day expiry, HMAC-SHA-256 token
  hashes, and a unique pending invitation per wedding/email. Existing members
  and duplicate pending invitations receive clear errors. Replacement invites
  revoke expired pending records to release the unique index.
- Immediate Resend delivery through server-side fetch with a bounded timeout and
  per-invitation idempotency key. No new dependency, queue, or SDK was added.
  Missing email configuration fails before inserting an invitation; failed or
  uncertain delivery revokes that attempt so an Admin can retry.
- `/member-invitations/:token` shows only invited email, role, couple names, and
  wedding date. Includes signed-out, matching-account, wrong-email, existing
  wedding, accepting, success, invalid/revoked/expired/already-accepted, and retry
  states. Session changes are rechecked on focus and cross-tab signals.
- Login/signup preserve an allowlisted invitation return path. Switching from the
  wrong account signs out first. Acceptance is explicit and verifies normalized
  email, current membership, link status/expiry, and wedding existence.
- Manual-testing follow-up on 2026-09-12: signed-out recipients now see Create an
  account to join first, with Already have an account? Sign in alongside it.
  Login and signup prefill email from the validated invitation record, preserve
  the return destination, and use invitation-specific copy. Login explains that
  receiving an invitation does not create an account. No account-existence lookup
  is used to choose the email link or reveal registration status.
- Membership creation and invitation acceptance commit atomically; unique user
  membership prevents concurrent joins to different weddings. Revocation and
  acceptance use conditional writes, so revoked links cannot grant access.
- Tokens are omitted from ordinary API responses and browser storage. Local
  request logs suppress invitation paths/auth return URLs, and invitation/auth
  pages send a no-referrer policy.

### Validation

- 123 tests passed, including mounted React UI tests, API boundaries, invitation
  authorization/validation, public projection, email-adapter failure handling,
  retry behaviour, and invitation return-path validation. The five opt-in database
  tests are skipped by the ordinary test command and were run separately.
- Signup-guidance follow-up on 2026-09-12: 129 tests, TypeScript, lint, and the
  production Webpack build passed. New tests cover invitation-derived email
  prefill, safe handling of stale links, signup-first actions, retained guidance
  after failed login, and return to acceptance after signup or sign-in. The
  unchanged database integration tests were not rerun for this UI/auth change.
- All five live MongoDB integration tests passed with mocked email: concurrent
  duplicate invitations, tenant isolation, email mismatch, revocation, Manager
  permissions, simultaneous acceptance, attempts to join two weddings, expiry,
  replacement invitations, and failed-send cleanup/retry. Temporary data removed.
- TypeScript, lint, and the production Webpack build passed.
- Static fixtures rendered from the real React components checked at desktop and
  mobile widths for member lists, invitation/revocation dialogs, and acceptance.
  No horizontal overflow observed in the checked mobile previews. These checks
  do not claim interactive acceptance testing against a real mailbox.

### Remaining setup and boundaries

- At initial implementation, Resend was not configured locally. Follow-up on
  2026-09-12: the user reported receiving an invitation email, then encountered
  confusion signing in before creating an account. The UI follow-up addresses
  that path. The user subsequently accepted the feature on 2026-09-12.
- `NEXT_PUBLIC_APP_URL` must be accessible to recipients; localhost links cannot
  be used from another person's device. Configure production access logs and
  analytics to redact invitation secrets before deploying publicly.
- A provider timeout can occur after an email was accepted by Resend; a delayed
  message from a failed attempt may contain a revoked link. A process crash after
  inserting the invitation can leave it pending; an Admin can revoke and retry.
  There is no durable email job or automatic retry in this single-email flow.
- On 2026-09-12, the user accepted the feature and authorized publishing the
  source to GitHub. No production deployment was performed.
- During testing, the configured sender used resend.dev, which restricts ordinary
  recipients to the Resend account email. Sending to other users requires a
  verified owned domain. Delivery beyond that testing restriction has not been
  verified in this session; generic provider-error handling remains unchanged.

## 7. Member roles and removal

**Status:** Complete — implemented scope accepted

**Recorded on:** 2026-09-12

### Implemented

- Current member rows offer Change role and Remove member; the current user's
  removal action is labelled Leave wedding. Dialogs show the target name/email,
  explain permissions or access loss, require confirmation, disable pending
  actions, and retain errors for retry. The role selector starts with the current
  role and prevents an unchanged save.
- Admin-only `PATCH /api/members/:membershipId` and
  `DELETE /api/members/:membershipId`, with strict validation, origin checks,
  authenticated identity, and no-store responses. Targets are scoped by ID and
  the acting user's wedding; cross-wedding targets return NOT_FOUND.
- The last Admin cannot be demoted or removed. UI controls explain this rule;
  the database enforces it even with stale UI and simultaneous requests. Both
  operations first increment the Wedding's internal `__v` in a transaction,
  recheck the acting Admin's membership, then inspect/mutate the target and count
  Admins. This shared write prevents snapshot write-skew between different targets.
- Removal deletes only membership, leaving the user's account intact. Subsequent
  wedding requests use fresh membership and deny access. The user can be invited
  again. Self-removal opens onboarding; self-demotion returns to the overview.
- Session synchronization now detects changed membership roles as well as wedding
  and user identity. Old Admin content is hidden on revalidation before refresh;
  focus and cross-tab signals update open tabs. No real-time push was introduced.

### Validation

- Focused UI tests cover last-Admin controls, confirmation before removal, failure
  retention, self-demotion, and self-removal. API tests cover authentication,
  origin/parameter/query/body validation, identity forwarding, and no-store
  responses. Service tests cover role validation, ownership scoping, and Manager
  rejection; session tests cover hiding stale Admin controls.
- All 140 ordinary tests, TypeScript, lint, and the production Webpack build
  passed. The nine opt-in database tests were run separately, as recorded below.
- All nine live MongoDB integration tests passed, including the five invitation
  regressions and new checks for promotion/demotion, last-Admin errors, target
  isolation, removal/access loss, and concurrent self-demotions, self-removals,
  and mutual demotions. Each race preserved one Admin; stale acting Admin
  permission was rejected. Temporary data was removed and email was mocked.

### Boundaries

- On 2026-09-12, the user accepted this increment and authorized committing and
  pushing it. Open tabs discover remote changes on revalidation; already-rendered
  content is not remotely erased.
- Existing invitations and the wedding itself are not deleted by member removal.
  This increment does not add guest management, ownership transfer, or audit logs.
- No production deployment was performed.

## 8. Initial production deployment

**Status:** Live — confirmed by user

**Recorded on:** 2026-09-15

- The user deployed the app to Vercel and confirmed working database connections,
  invitation email delivery, and the production application. A custom domain is
  now configured; its address has not been supplied in this conversation.
- Deployment troubleshooting covered the exact application origin setting,
  Atlas network access, and hosted Resend configuration. The user reported
  allowing all IP addresses in Atlas to resolve connectivity.
- Earlier milestone statements about no deployment describe their delivery at
  that time and are superseded by this deployment milestone. This entry records
  user confirmation; no independent production audit or new test run is claimed.
- Existing public-launch limitations, including shared authentication rate limits
  and sample homepage claims, remain documented above. Future development and
  database resets must be isolated from production data.

## 9. Wedding workspace skeleton

**Status:** Complete — implemented scope accepted

**Recorded on:** 2026-09-15

- Adapted the Stitch wedding workspace design to V1: shared desktop sidebar,
  mobile navigation drawer, account header, and dashboard. Wedding editing and
  member management now use the same shell; onboarding retains its existing flow.
- Wedding identity, date, time zone, location, description, countdown, and member
  names come from saved data. Member lookups use the existing authenticated,
  wedding-scoped service; only names, IDs, and roles reach the dashboard.
- Navigation includes events, tasks, guests, invitations/RSVP, expenses, selected
  vendors, vendor discovery, website, gallery, guest QR, and livestream. Unbuilt
  sections open an accessible Coming soon dialog. No future routes, APIs, or
  persistence layers were created.
- Dashboard summaries, event/task previews, RSVP distribution, and expenses are
  clearly labelled sample data. They do not write records or send invitations.
  Existing edit and Admin-only member-management links remain functional.
- Excluded non-V1 design features, including seating/room allocation, transport,
  WhatsApp concierge, budget allocation, vendor contract management, and exports.
- All 144 ordinary tests, lint, TypeScript, and the production Webpack build passed.
  Tests include role-aware navigation, every placeholder dialog, mobile drawer
  transitions, absence of placeholder network requests, real/sample separation,
  and refreshed countdown behaviour. Nine opt-in database tests were not run.
- Desktop and mobile presentation checked using an isolated rendering of the
  actual components with fixture data. The local authenticated browser session
  was unavailable during that visual check. After restarting the local dev server
  with updated environment values, the user confirmed login worked; server logs
  showed successful login, dashboard, and session responses. On 2026-09-16, the
  user confirmed testing and code review passed and accepted the feature.
- On 2026-09-16, removed the repetitive wedding-name card from the desktop
  sidebar and mobile navigation at the user’s request. Wedding names remain
  in the dashboard heading.
- TypeScript and the three workspace tests also passed after the sidebar change.
- The user authorized committing and pushing this increment on 2026-09-16.
  No production deployment verification is claimed; connected Vercel deployments
  may be triggered by the GitHub push.

## 10. Wedding events

**Status:** Complete — implemented scope accepted

**Recorded on:** 2026-09-16

- Retrieved the approved Stitch List, Empty State, and Create screens. Implemented
  responsive list, creation, details, editing, archive confirmation, and unsaved
  changes flows in the existing workspace. Details/edit/dialogs follow the same
  visual language. Prototype controls and features outside V1 were omitted.
- Admins and Managers can create, list, read, update, and archive events through
  `/api/events` and `/api/events/:eventId`. Membership determines the wedding;
  IDs, queries, and bodies are validated. Repositories scope every resource by
  wedding ID and event ID. Cross-wedding requests return NOT_FOUND.
- Events support a name, optional preset/custom type, start and optional end,
  venue, address, description, and dress code. Type remains optional in the API
  per the database design; the UI defaults to Custom. No cover uploads yet.
- Dates are stored as UTC instants and entered/displayed in the wedding time zone.
  Overnight events work. The form rejects nonexistent/ambiguous daylight-saving
  times rather than silently moving them. Unchanged timestamps retain precision.
- Lists group by local date and order chronologically. Archived events are hidden
  by default, optionally visible, and read-only. Archiving preserves records and
  references; no hard-delete or restore capability was added.
- Partial edits validate the resulting start/end pair. An atomic version check
  rejects a concurrent update/archive during saving. The form sends only changed
  fields. API failures retain input; session expiry retains the draft in the open
  tab through reauthentication, and account/wedding changes discard it. Drafts
  are not persisted across closing or refreshing the tab.
- The sidebar Events link is active. Dashboard event count and upcoming events
  now use saved data, with a real empty state. Other dashboard modules retain
  explicitly labelled samples. Existing focus/cross-tab refresh signals update
  event views and dashboard data.
- All 174 ordinary tests, TypeScript, lint, and the production Webpack build
  passed. Coverage includes validation, timezone/DST conversion, tenant-scoped
  queries, auth/origin boundaries, archive behaviour, concurrent-write guards,
  partial form updates, draft retention, empty states, and dashboard summaries.
- Browser checks used the actual components in an isolated in-memory fixture:
  list, create, details, edit, archive, and unsaved confirmation; desktop/mobile
  layout and mobile horizontal overflow were checked. No database integration
  tests or production-data mutations were performed. Nine existing opt-in
  database tests remain skipped. The user subsequently confirmed that manual QA
  and code review passed and accepted the implemented feature on 2026-09-16.
- Save troubleshooting on 2026-09-16: the long-running dev server returned HTML
  404 responses for `/api/events` despite the route being present in the production
  build. Restarting it restored the expected JSON authentication response. The form
  now distinguishes unexpected server responses from connection failures, retains
  input, and avoids claiming success when no saved event is returned. Nine focused
  event-form tests, TypeScript, and lint passed after this fix.
- No new dependencies, uploads, invitations, task/guest/vendor associations, or
  other future modules were introduced.
- The user authorized committing and pushing this increment on 2026-09-16.
  No production deployment verification is claimed; a connected Vercel deployment
  may be triggered by the GitHub push.

## 11. Wedding tasks

**Status:** Complete — implemented scope accepted

**Recorded on:** 2026-09-16

- Used the approved Stitch task list, filtered/completed, and delete/error states.
  Create/edit/details follow the existing Events forms. Responsive website UI
  includes task lists, empty states, filters, pagination, details, editing,
  inline status updates, permanent deletion confirmation, and retryable errors.
- Admins and Managers can manage tasks at `/tasks`, `/api/tasks`, and
  `/api/tasks/:taskId`. Every lookup/write is wedding-scoped; IDs, queries and
  bodies are validated. Assignees are current wedding memberships; new event
  links require active events in the same wedding. Existing archived-event and
  former-member context stays visible and can be retained or cleared.
- Fields: title, optional description, single member, optional event and due date,
  priority, and status. All Tasks/My Tasks/Completed views support status,
  priority, member and event filters, including unassigned/general tasks.
- Due dates are entered/displayed in the wedding timezone and stored as UTC.
  Overdue starts after the due calendar day. Completed timestamps are set on
  completion, preserved during metadata edits, and cleared on reopening.
  Optimistic version checks reject writes racing with another update.
- The sidebar Tasks link and dashboard task totals/nearest-due incomplete tasks
  now use saved data. Empty and all-completed summaries replace task fixtures.
  Other unimplemented modules retain labelled samples. Existing focus and
  cross-tab signals refresh task views and dashboard summaries.
- Forms retain input after failures and through session expiry/reauthentication
  in the same open tab. Account or wedding changes discard the draft. Unsaved
  changes require confirmation before leaving; reload/close does not persist it.
- Validation: 214 ordinary tests, TypeScript, lint, and production Webpack build
  passed. Coverage includes scoping, reference validation, completion transitions,
  concurrent updates, filters/pagination, auth/origin boundaries, form failure and
  session retention, deletion confirmation, and saved dashboard summaries.
- Browser checks used actual components with isolated in-memory fixtures:
  desktop list and creation, My Tasks, mobile details/edit/delete and unsaved
  confirmation. Mobile list had no horizontal overflow. No configured database
  mutations were made for these checks; nine opt-in database tests remain skipped.
  The local server was restarted, and `/api/tasks` returned the expected no-store
  JSON 401 authentication response. On 2026-09-16, the user confirmed testing
  and code review were complete and accepted the feature.
- API implementation details are recorded in `API_DESIGN.md`. No new dependencies,
  comments, attachments, subtasks, reminders, or other future features were added.
  The user authorized committing and pushing this increment on 2026-09-16.
  No production deployment verification is claimed; a connected Vercel deployment
  may be triggered by the GitHub push.

## 12. Guest management

**Status:** Complete — implemented scope accepted

**Recorded on:** 2026-09-16

- Retrieved approved Stitch Guest List and Create screens. Implemented responsive
  table/mobile cards, search, event/RSVP filters, pagination, empty/no-results states,
  create, details, edit, delete confirmation, and retryable errors in the workspace.
  Related screens follow the same visual language; prototype controls were omitted.
- Admins and Managers manage guest groups through `/guests`, `/api/guests`, and
  `/api/guests/:guestId`. All resources are wedding-scoped; IDs, queries and bodies
  are validated. Searches treat input literally, including regex metacharacters.
- One record represents an invitation/family group. Fields include name, optional
  email/phone, maximum party size including the named guest, optional event
  selections, and notes. Shared email addresses are allowed; contact fields and
  event selections can be cleared. New guests have Pending RSVP and no attendance.
- New associations require active events in the same wedding. Existing archived
  event selections remain visible and can be retained or removed. No-events flows
  work. Cross-wedding metadata is never loaded through guest references.
- RSVP is read-only in this increment. Reducing party size below existing attendance
  is rejected; atomic version/capacity checks guard concurrent updates. Deleting
  a guest permanently removes its record and associated invitation secret.
- Stable 32-byte invitation secrets follow API §44 and AGENTS.md, are excluded from
  default reads and CRUD responses, and are never logged. API, database and system
  documents now reconcile the older hash-only recommendation with that accepted
  exception. Sharing/public RSVP/email remain deferred; no guest EmailJobs exist yet.
- Guest navigation is active. Dashboard guest groups and maximum capacity use saved
  data with an empty-state action, distinct from invitations sent or attendance.
  Other unimplemented modules retain labelled samples. Existing focus/cross-tab
  refresh signals update lists and dashboard totals after mutations.
- Forms send changed fields only, retain input after failures and session expiry
  in the same open tab, and discard drafts on account/wedding changes. Unsaved
  navigation prompts are reused. Drafts do not persist across reload or tab closure.
- Validation: 252 ordinary tests, TypeScript, lint, and production Webpack build
  passed. Focused coverage includes tenant scoping, reference validation, capacity
  guards, secret-safe projections, search escaping, auth/origin boundaries,
  optional-field clearing, session retention, deletion and dashboard totals.
- Browser checks used actual components with isolated in-memory fixtures: desktop
  list/search/create/event selection and mobile edit/save/delete, unsaved prompts,
  and guest cards. Mobile form/list had no horizontal overflow. No configured
  database mutations were performed for QA; nine opt-in database tests remain skipped.
  After restarting the local server, `/api/guests` returned the expected no-store
  JSON 401 authentication response.
- No new dependencies, CSV/bulk operations, invitation delivery, public RSVP,
  seating, rooms, or transport features were added. On 2026-09-16, the user
  confirmed QA and manual testing were complete and accepted the feature.
- The user authorized committing and pushing this increment on 2026-09-16.
  No production deployment verification is claimed; a connected Vercel deployment
  may be triggered by the GitHub push.

## 13. Guest invitation sharing and public RSVP

**Status:** Complete — implemented scope accepted

**Recorded on:** 2026-09-16

- Retrieved and reviewed approved Stitch “Guest Invitations — Sharing” and
  “Public Invitation — Pending RSVP” screens, including embedded response states.
  Preserved the sharing layout’s two columns, contact/event cards, burgundy accents,
  public floral hero, overlapping status card, dated itinerary, and formal RSVP
  styling. The approved floral image is bundled locally. Layouts adapt to mobile.
- Admins/Managers retrieve a stable guest URL from guest details, copy it with a
  manual fallback, or open it in a new tab. Retrieval is wedding-scoped and uses
  the configured application origin. Existing secrets are not regenerated.
- Public `/invite/:token` requires no account. It displays only the invited group’s
  name/capacity/RSVP, permitted wedding details and active invited ceremonies.
  Contacts, notes, database IDs, other guests, and unrelated tokens are excluded.
- Guests accept with a whole-number headcount within capacity, decline with zero,
  and edit their response using the same link. Repeated identical submissions are
  idempotent. Atomic version/capacity checks guard concurrent organiser edits.
  Retryable errors retain input; conflicts refresh permitted details for review.
  Invalid/deleted guest or wedding links show a generic unavailable state.
- Saved RSVP groups and people attending replace the dashboard’s RSVP sample data.
  Invitations & RSVP navigation links to this summary; pending guests are linked
  to their existing filtered list. Focus/cross-tab signals refresh saved data.
- Public routes use no-store, no-referrer, and noindex protections. Application
  incoming request logging excludes token-bearing paths. RSVP writes reuse HMAC
  keyed MongoDB counters: 300/minute globally and 20 per invitation/15 minutes.
- Validation: 282 ordinary tests passed across the full suite and focused follow-up
  runs; TypeScript, lint, and a production Webpack build passed. Coverage includes
  tenant isolation, minimal public projections, stable sharing, active events,
  RSVP capacity/concurrency/idempotency, origin checks, rate limits, retained form
  choices, stale refresh protection, clipboard fallback, and saved summary totals.
- Browser checks used actual components with isolated in-memory fixtures: desktop
  sharing and public invitation; accepting for three people; mobile response edit
  and decline; responsive sharing and RSVP forms. Both pages had no horizontal
  overflow at mobile width. The local server was restarted; unauthenticated summary
  returned JSON 401 and an invalid public invitation returned generic JSON 404
  with privacy headers. No configured database mutations were performed for QA;
  nine opt-in database tests remain skipped. These checks do not claim independent
  production verification.
- No new dependencies or database domain collections. Guest email delivery,
  bulk sending/reminders, deadlines, individual family rosters, dietary fields,
  transport, rooms, concierge details, and cover uploads remain outside this
  increment. Project/API/database/system documentation updated together.
- Review follow-up (2026-09-16): fixed shared RSVP quota exhaustion. The service
  verifies the invitation and wedding and validates headcount before rate limiting;
  per-invitation admission now precedes shared quota consumption. Rejected attempts
  cannot drain capacity for other weddings. Regression coverage exercises 300
  attempts on one valid invitation, 300 distinct nonexistent tokens, deleted
  weddings, invalid capacity, and idempotent responses using in-memory persistence.
  Follow-up validation: 286 tests passed (nine opt-in database tests skipped),
  TypeScript and lint passed. No live database requests were used for this fix.
- On 2026-09-16, the user accepted this feature and the quota review fix and
  authorized committing and pushing the increment to GitHub. No production
  deployment verification is claimed.

## 14. Gallery R2 infrastructure setup

**Initial status:** Configured — application integration pending

**Follow-up on 2026-09-18:** Development storage operations are now verified;
see milestone 15. The setup details below preserve the original setup record.

**Recorded on:** 2026-09-18

- User activated Cloudflare R2 and authorised browser setup, including explicit
  confirmation to create separate bucket-scoped Object Read & Write credentials.
- Created `make-my-marriage-dev` and `make-my-marriage-prod` in Asia-Pacific with
  Standard storage. Both remain private; public development URLs are disabled.
- Development CORS allows `http://localhost:3000`. Production CORS allows
  `https://www.makemymarriage.in` and `https://makemymarriage.in`. Both allow
  GET/PUT/HEAD, Content-Type, expose ETag, and cache preflight for 3600 seconds.
- Separate active account API tokens are restricted to their corresponding
  buckets. Development R2 values are saved in Git-ignored `.env.local` with
  owner-only file permissions. Production values are saved as Vercel secrets
  scoped to Production only. No secret values are recorded in documentation.
- Verified bucket/CORS settings and token status in Cloudflare, local environment
  presence/format, and all four saved Production variable entries in Vercel.
  Actual signed upload/read/delete verification is pending application integration.
- No production redeploy was triggered. Vercel settings take effect on the next
  deployment. Existing `R2_PUBLIC_BASE_URL` placeholder was left unchanged; private
  signed-URL storage does not require a public base URL. Preview deployments are
  not configured for gallery storage in this step.
- Gallery UI, upload APIs, photo metadata, viewing, downloads, deletion, guest
  sharing, and QR functionality have not been implemented in this milestone.

## 15. Organiser photo gallery

**Status:** Implemented — source publication authorised

**Recorded on:** 2026-09-18

- Implemented the approved Stitch “Wedding Gallery — Overview” design
  (screen `471e71e1b20249e7a53d4e47b42c7025`) within the existing workspace:
  responsive photo cards, event filters, count, cursor pagination, empty/error
  states, upload dialog, full-size viewer and permanent-delete confirmation.
  Gallery navigation and the dashboard link now open `/gallery`.
- Admins and Managers can upload multiple JPEG/PNG/WebP photos (10 MiB each,
  20 selected per batch), optionally assign an active event, monitor individual
  progress, pause, and retry failures while keeping successful photos. Files and
  partial results stay in the tab across session expiry; switching accounts or
  weddings unmounts the draft. Navigation guards warn before discarding files.
- Private R2 signed uploads and reads are working. Server-issued pending metadata
  binds each upload to the wedding and uploading membership; confirmation checks
  actual size/MIME/signature and conditionally copies to an independent final key.
  Idempotent confirmation and hidden deletion tombstones prevent replay and
  duplicate publication. Limits apply per member, then per wedding.
- Event filtering includes unassigned Wedding Memories and retained photos from
  archived events. The viewer supports previous/next, arrow keys and swipe;
  downloads obtain a fresh signed attachment URL. Storage deletion happens before
  metadata tombstoning, and errors remain available for retry.
- Added AWS S3 client/presigner dependencies for the R2 adapter. API, system and
  database documents record the lifecycle extension, limits and download route.
- Validation: 328 automated tests passed; ten opt-in tests skipped (nine database
  tests plus the R2 smoke test). The R2 smoke test was also explicitly run and
  passed against `make-my-marriage-dev`: CORS preflight, signed PUT, rejection
  of a mismatched upload byte length, metadata and signature verification, ETag-conditional copy, original download and test-object
  deletion. No live MongoDB records or production bucket objects were modified.
  TypeScript and lint passed; webpack production build passed. Isolated browser
  checks covered desktop/mobile layouts, event empty state, viewer navigation,
  delete confirmation and refreshed photo count, valid/unsupported file selection,
  mixed upload outcomes and retryable gallery errors using fake application data.
- On 2026-09-18, the user authorised updating this status document and committing
  and pushing the gallery increment to GitHub. This authorisation does not imply
  an independently verified production deployment or completed manual QA.
- Remaining verification: user QA/code review, real application/database end-to-end
  acceptance, and production deployment verification.
  Originals are lazy-loaded; thumbnail derivatives are deferred and browsing can
  download up to 10 MiB/photo. Abandoned/replayed staging objects and failed-cleanup
  orphans require future reconciliation; no automatic cleanup is implemented.
  Guest gallery access/uploads, public links/QR, gallery settings, video/HEIC,
  bulk operations, moderation, and image editing remain outside this increment.
- Follow-up to milestone 14: development storage credentials/CORS are now verified
  with actual object operations. Production and Preview integration are not tested.

## 16. Stitch-informed homepage alignment

**Status:** Implemented — responsive illustrative UI; product workflows remain outside this increment

**Recorded on:** 2026-10-17

- Updated the current / page to match the supplied Stitch project “Indian Wedding Design System”: cream/ivory and blush surfaces, rose actions, navy headings, photo-led hero, ten-item feature strip, browser-style demo dashboard, and three-step explanation.
- Added an original generated wedding hero image at frontend/public/images/indian-wedding-hero.png.
- Added responsive layout rules, keyboard focus styles, semantic landmarks, descriptive image text, reduced-motion handling, and explicit illustrative labels for demo wedding figures.
- Used the project documentation’s email/password account convention rather than the Stitch brief’s Google sign-in suggestion. This checkout has no homepage sign-in/onboarding route, live demo workflow, or product video, so those locations explain the limitation or provide an on-page preview anchor.
- The Stitch project contains a desktop reference screenshot and written responsive guidance; no separate mobile screen was available. Mobile behavior is implemented from the brief and checked in the current browser viewport.
- Validation on 2026-10-17: npm run lint, npm run typecheck, and npm run build passed. Browser inspection confirmed the page content and local hero image render.
- Boundaries: the dashboard values are static sample data; feature strip items describe product scope and are not proof that those modules exist in this checkout. No database, authentication, or product API behavior was added.

## 17. Account and wedding setup screen prototype

**Status:** In progress — interactive UI prototype; no working backend

**Recorded on:** 2026-10-18

### Implemented

- Added email-and-password sign-in and signup screens, plus a password-reset
  request screen, following the PRD/API design rather than the Stitch Google and
  email/mobile one-time-code mockup.
- Connected homepage sign-in and start-planning actions to the account routes.
- Added a responsive wedding setup wizard in the documented order: couple and
  wedding details, co-planners, then events and traditions. It supports local
  step navigation, adding/removing draft planners, selecting suggested events,
  and entering custom event names.
- Kept form values in page memory only. No account, session, wedding, event, or
  invitation data is sent or persisted.

### Validation

- `npx eslint src/app src/components eslint.config.mjs` passed, and
  `npx tsc --noEmit --incremental false` passed.
- The local development server returned HTTP 200 for `/`, `/login`, `/signup`,
  `/forgot-password`, and `/onboarding`; browser inspection confirmed the new
  page content and initial onboarding step order.
- `npm run build` was attempted but could not write Next.js `.next/trace`
  (`EPERM`); production build validation remains unconfirmed. The standard
  incremental typecheck also hit a build-info write-permission error; the
  no-incremental typecheck above passed.

### Remaining work and limitations

- Implement server-backed auth, sessions, password reset delivery, MongoDB
  persistence, atomic wedding and Admin membership creation, member invitations,
  wedding event persistence, and authenticated routing before treating these
  screens as product workflows.
- PRD journey order and the current Stitch step order differ. This prototype
  follows the PRD order: invite members before setting up events.

## 18. Email/password authentication foundation

**Status:** Implemented — signup, sign-in, logout, and session lifecycle verified;
Foundation phase remains in progress

**Recorded on:** 2026-10-18

### Implemented

- Connected the login form to `POST /api/auth/login`, with Zod request
  validation, normalized email lookup, bcrypt password verification, and a
  generic invalid-credentials response.
- Connected signup UI to `POST /api/auth/signup`. New accounts use normalized
  unique email addresses, bcrypt password hashes, and an authenticated session;
  duplicate email addresses receive a clear conflict response.
- Added `POST /api/auth/logout` to revoke the stored session and clear its cookie.
  Sign-in and signup forms continue to the current onboarding preview after the
  server confirms the session. The onboarding UI has a working sign-out action.
- Added HMAC-keyed MongoDB fixed-window limits for signups and sign-ins, with
  10 attempts per email per 15 minutes and shared limits of 30 signups / 60
  sign-ins per minute. The shared limits are a small-pilot tradeoff and can
  temporarily block all users if exhausted.
- Added MongoDB User, Session, WeddingMembership, and minimal Wedding read
  models needed by the login response and current-user endpoint.
- Created random session cookies with HttpOnly, SameSite=Lax, production Secure
  behavior, 30-day expiry, and HMAC-SHA-256 token storage using
  `AUTH_TOKEN_PEPPER`.
- The database/API docs describe session token SHA-256, while `AGENTS.md`
  requires HMAC-SHA-256 with the pepper. This increment follows the repository
  instruction; reconcile the design wording in a documentation update.
- Added the documented `GET /api/auth/me` endpoint to verify a session and
  return current user and membership context without exposing token hashes.
- Loaded the repository-root `.env.local` in development because the Next.js
  app runs from `frontend/`. A local 256-bit pepper was generated when the
  existing ignored setting was empty; its value is not committed.

### Validation

- `npm test` (3 auth-schema tests), `npm run lint`, and
  `npx tsc --noEmit --incremental false` passed using Node 24.19.0.
- Live local API verification against the configured MongoDB database passed:
  signup returned 201, `/api/auth/me` returned 200 with the new session,
  logout returned 200, sign-in returned 200, and the revoked session returned
  401. The disposable test account and its sessions were removed afterward.
- Invalid credentials returned 401, signup validation returned 400, and logout
  without a session returned 200. No secret values were included in outputs.
- The auth limiter returned 401 for the first ten failed sign-ins and 429 for
  the eleventh attempt for one normalized email.
- The currently running development server's Node version was not independently
  checked during this verification. The project's minimum is Node 22.13.0.
- Current reconfirmation on 2026-10-20: `/login` and `/signup` returned HTTP
  200, and unauthenticated `/api/auth/me` returned 401. A new signup could not
  be completed because the MongoDB driver failed TLS negotiation with
  `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` for all resolved Atlas nodes; direct
  Mongoose diagnostics reported `MongooseServerSelectionError`. SRV DNS resolved
  to three nodes, and the configured database name remains
  `make_my_marriage`. No QA user was created in this blocked run. The prior
  successful auth verification above is retained as historical evidence, but
  current signup persistence and sign-in needed to be rerun after connectivity
  was restored. The later recovery check below supersedes that temporary block.
- Later on 2026-10-20, after the user restored Atlas connectivity, signup
  returned 201, session lookup returned 200, logout returned 200 and revoked
  the session (subsequent lookup returned 401), sign-in returned 200 with a
  valid session, and final logout returned 200. A direct database read found
  one user document in `make_my_marriage.users`, with normalized email and a
  bcrypt password hash. A disposable QA account was removed; the remaining
  document belongs to the user's signup. Duplicate-signup and rate-limit checks
  were not repeated in this recovery run. See [AUTH_QA.md](AUTH_QA.md).

### Remaining work and limitations

- Password reset and email delivery remain pending; the forgot-password page is
  still a UI placeholder. V1 does not require email verification.
- Signup and sign-in use fixed-window rate limits, but the shared application
  ceilings can be exhausted by one caller. Before opening public signup, replace
  them with trusted per-client limits while retaining per-email limits.
- Add server-side authentication guards before exposing private wedding APIs or
  screens. Do not treat the current onboarding prototype as persisted data.
- Sign-in and signup redirect to the onboarding preview because wedding
  creation and the dashboard are not yet server-backed. Session expiry and TTL
  cleanup are implemented, but expiry behavior has not received a separate live
  wait-and-expire test.
- The MongoDB TLS failure seen earlier on 2026-10-20 was resolved, and local
  signup/sign-in connectivity was verified afterward. Rerun the QA checklist
  after changing Atlas access, the root `.env.local`, or authentication code.

## Upcoming development

The homepage milestone is complete for its stated scope: responsive marketing UI
with illustrative preview data. **The current product phases are Phase 1:
Foundation and Phase 2: Planning, both in progress.** Authentication, wedding
setup persistence, guarded dashboard, wedding-detail editing, event CRUD, and
the first task-management increment are implemented. Invitation delivery and
authenticated task persistence still need end-to-end verification. No later
product phase is marked complete in this checkout.

| PRD phase | Status in this checkout | Scope |
| --- | --- | --- |
| Homepage design | Complete — illustrative UI | Stitch-aligned marketing page; no product workflows |
| 1. Foundation | In progress — auth, wedding, and local invitation acceptance implemented; Resend delivery pending | Signup/sign-in/logout, persisted wedding setup, creator Admin membership, member invitation/list/revoke/accept flow. Password recovery and verified-sender email delivery remain. |
| 2. Planning | In progress — event CRUD and task management implemented; signed-in Admin task flow verified locally | Event CRUD, wedding-scoped task CRUD, assignment, filters, and dashboard task summary. |
| 3. Guests | Pending | Guest management, invitations, RSVP, email, WhatsApp sharing |
| 4. Financial and Vendors | Pending | Expenses, vendor management and discovery |
| 5. Wedding Experience | Pending | Wedding website, themes, YouTube livestream |
| 6. Memories | Pending | Gallery, guest uploads, albums, private sharing, QR code |
| 7. Production Readiness | Pending | Error handling, security, responsive review, performance, testing, analytics, deployment, monitoring |

**Recommended next increment:** verify task management with Manager and Viewer
memberships, including role permissions, member/event association validation,
and cross-wedding isolation. Keep separate invitee acceptance QA and
verified-sender delivery as Foundation follow-ups.

### Current checkout follow-up — member invitations and event persistence — 2026-10-20

**Status:** In progress — local database workflows verified; Resend delivery
awaits a verified sender domain

#### Implemented scope

- The setup wizard collects event names, local dates, and start times, converts
  them using the wedding time zone, saves each Event through `POST /api/events`,
  and displays persisted events on the dashboard.
- Admins can view current members and pending invitations, send Manager
  invitations through the server-only Resend adapter, and revoke pending invites.
- Invitees can view a limited public invitation summary, then sign in/create an
  account using the invited email and accept. Acceptance creates a
  `WeddingMembership` and consumes the invitation in a MongoDB transaction.
- Invitation tokens use 256-bit random secrets stored only as HMAC-SHA-256
  hashes with `AUTH_TOKEN_PEPPER`; invites expire after seven days. Resend needs
  both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` configured server-side.
- API validation, role checks, and wedding scoping follow the current product
  design. No email token is logged or returned from invitation APIs.

#### Validation

- Lint and TypeScript passed; all 11 focused tests passed for event and
  invitation schemas, token shape, and timezone conversion.
- Local unauthenticated checks returned 401 for event/member APIs, 307 to login
  for `/members`, and 404 for an invalid public invitation token.
- Live local QA passed 13 checks using disposable owner and invitee accounts:
  workspace and event persistence/readback, dashboard event display, public
  invite summary, rejection for the wrong email, matching-email transactional
  acceptance, invited-member workspace access, single-use enforcement, Admin
  member list, invitation revocation, and disabled revoked links. All QA user,
  wedding, event, invitation, membership, session, and per-email rate-limit
  records were removed afterward.
- A read-only Resend domains request accepted the configured API key but
  returned zero domains. No email was sent and no member/event QA records were
  created by the provider-configuration check.

#### Remaining work

- Verify a sender domain in Resend before invitations can be sent to arbitrary
  recipients. Then verify actual email delivery using an authorized test
  recipient. Expiry and duplicate-invite prevention also remain to be checked.
- Member removal remains future work. Event editing and archiving were
  implemented and verified in the 2026-10-22 follow-up above.

For each feature increment, update this file in the same change: record its
status and date, implemented scope, validation performed, and remaining work or
limitations. Keep the dated milestone history below intact; do not mark a whole
phase complete when only part of its scope has shipped.
## Updating this document

- Update the current position, milestone table, and last-updated date when a
  major feature progresses.
- Add a numbered milestone for each new major feature. Record its status, date,
  implemented scope, validation actually performed, and remaining work.
- Update existing entries when their scope changes, preserving the earlier
  milestone and noting the date and substance of significant follow-up changes.
- Use explicit statuses such as **In progress**, **Complete — UI with mock data**,
  or **Complete — end to end**. Completion applies only to the stated scope.
- Keep entries concise and factual. Never include credentials, tokens, or
  private connection strings.

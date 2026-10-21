# Authentication QA

## Fresh account QA after approved reset — 2026-10-21

- At the user's request, all documents were cleared from the seven non-system
  app collections in `make_my_marriage`; each collection was verified empty.
- Signup created a fresh account and session (201); `/api/auth/me` returned 200.
  A fresh wedding was created (201), read back while signed in (200), and the
  user had Admin membership. The signed-in members page returned 200.
- Sign-in with the credentials supplied for this QA returned 200; workspace
  readback succeeded. Logout returned 200 and subsequent session lookup returned
  401.
- The requested Manager invitation email was accepted by Resend (the app
  returned 201) and appeared in the pending invitation list from MongoDB. The
  user's Outlook inbox and token acceptance were not inspected in this run.
- No credentials, cookies, session tokens, or raw invitation links are recorded.

This checklist covers the email/password account flows implemented in the
Next.js app. Run it against the local development app and the intended
development MongoDB database. Never paste `MONGODB_URI`, passwords, cookies, or
session tokens into chat, screenshots, or logs.

## Before testing

1. Start the app from `frontend/` using Node.js 22.13 or newer.
2. Confirm the repository-root `.env.local` has `MONGODB_DATABASE=make_my_marriage`
   and a valid Atlas `MONGODB_URI`. Restart the dev server after changing either
   value.
3. In MongoDB Compass, connect to the same Atlas cluster, expand
   `make_my_marriage`, open `users`, and refresh the collection.

## Signup and persisted user

1. Open `http://localhost:3000/signup` and submit a new email, name, and
   password of at least 12 characters.
2. Expect a successful account response and navigation to `/onboarding`.
3. Refresh Compass. A document should appear in `make_my_marriage.users` with
   `name`, `email`, `emailNormalized`, `passwordHash`, `createdAt`, and
   `updatedAt`. `passwordHash` is a bcrypt hash; the original password must not
   be stored.
4. A second signup with the same email should return an “account already
   exists” message and must not create another user.
5. Invalid email, missing name, or a password shorter than 12 characters
   should be rejected without creating a user.

## Sign-in and session

1. Sign out, then sign in using the same email and password. Expect navigation
   to `/onboarding`.
2. A wrong password should show a generic invalid-email-or-password message.
3. `GET /api/auth/me` should return 200 while signed in and 401 when signed out.
4. The browser's `mmm_session` cookie should be HttpOnly and SameSite=Lax; its
   raw value should not be copied or shared.
5. Sign out. Expect the session to be revoked; `/api/auth/me` should return 401.
   The corresponding session record is in `make_my_marriage.sessions` and is
   deleted at sign-out.
6. Repeated sign-in attempts are limited to 10 per normalized email per
   15-minute window. The eleventh should return 429. Shared app limits also
   apply; see the limitation recorded in `PROJECT_STATUS.md`.

## Expected current boundaries

- Signup, sign-in, current-user lookup, logout, and authentication rate limits
  are server-backed.
- Wedding creation and the initial Admin membership are server-backed; the
  `/dashboard` route reads persisted wedding data after sign-in.
- Wedding details have a prefilled `/wedding/edit` form and authenticated
  `PATCH /api/wedding` handler. The save/readback flow passed end-to-end with a
  disposable QA workspace; see the editing execution record below.
- Password recovery remains a placeholder; it is not a passing account flow.
- Planner invitations and event selections entered during onboarding remain
  previews and are not persisted yet. See the wedding setup QA record below.
- The public homepage reflects the current server session: signed-in users get
  their account and wedding/setup links; signed-out users get account links.

## Execution record — 2026-10-20

- `/login` and `/signup` pages loaded locally; signup form fields and link back
  to sign-in were present.
- Unauthenticated `GET /api/auth/me` returned 401. Malformed signup and login
  request payloads returned 400.
- The initial valid signup QA request did not complete. A direct, secret-safe
  MongoDB diagnostic found that SRV DNS resolves to three Atlas nodes, but TLS
  connection attempts fail with `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` and the
  driver reports `MongooseServerSelectionError`.
- No QA account was created by that blocked attempt. At that point, signup
  persistence, duplicate signup, successful sign-in, session round-trip,
  logout, and rate limiting still needed verification.
- Configured database name is `make_my_marriage`, matching the Compass database
  shown by the user. The account collection cannot be inspected directly from
  this execution environment while the TLS connection is failing.

### Recovery verification — later on 2026-10-20

- After the Atlas connection was restored, local signup returned 201; the new
  session lookup returned 200; logout returned 200 and the follow-up session
  lookup returned 401; sign-in returned 200 and its session lookup returned
  200; final logout returned 200.
- A direct read-only MongoDB check found one user document in
  `make_my_marriage.users`. The expected `email`, `emailNormalized`, and
  `passwordHash` fields were present; the email normalization matched and the
  password value was a bcrypt hash. Personal field values were not printed.
- The separate disposable QA account used for the earlier flow test was
  removed. The one remaining user is the account created through the user's
  signup flow. Duplicate signup and rate-limit checks were not repeated during
  this recovery check; see the earlier successful verification in
  `PROJECT_STATUS.md` for those results.

### Wedding setup QA — 2026-10-20

- The local Next.js server was restarted with Node 24.19.0 before testing so the
  current Mongoose Wedding schema was loaded.
- All 16 application checks passed using a disposable `example.invalid` account:
  signed-out access, signup and session lookup, invalid date rejection, wedding
  creation and database-backed readback, gallery-token omission, initial Admin
  role, duplicate creation rejection, dashboard rendering, onboarding redirect,
  logout/session revocation, sign-in after creation, and continued membership
  access.
- Cleanup was confirmed: the temporary user, its wedding, membership, session,
  and per-email rate-limit record were removed. The user's real account and data
  were not used.
- A first run against the already-running server failed readback because its
  cached Mongoose model predated the schema update. The resulting QA-only data
  was identified by its generated fake email and test names, then removed. The
  restarted server passed the complete rerun.

### Wedding detail editing — 2026-10-20

- The edit schema accepted partial documented updates and rejected empty
  updates, impossible dates, and client-supplied `weddingId` values.
- Unauthenticated `GET /wedding/edit` redirected to `/login`; unauthenticated
  `PATCH /api/wedding` returned 401. The route checks the signed-in member's
  role and derives wedding scope from that membership.
- Lint, TypeScript, and all 7 test cases passed with Node 24.19.0.
- The active local browser session currently routes to onboarding and has no
  wedding workspace. The end-to-end test used a disposable QA account and
  workspace; cleanup deleted its user, wedding, membership and email rate-limit
  record. The user's account and wedding data were not used or changed.
- The application-side flow passed: signup, wedding creation, PATCH updates to
  couple names/date/location, default-title refresh, unchanged public slug, GET
  readback, and updated dashboard HTML. The test account was logged out before
  cleanup.
- The signed-in edit page also rendered with the saved wedding values and save
  button. A second disposable QA run was cleaned up: one user, one wedding, one
  membership, and its email rate-limit record were removed.

### Homepage session persistence — 2026-10-20

- Initial QA found a defect: signup/sign-in and `/dashboard` worked, but the
  homepage still showed Sign In and Get Started while authenticated.
- After the homepage change, a signed-in account with a wedding displayed its
  account label and Go to your wedding action; rendered homepage HTML had no
  Sign In or signup links. Opening the dashboard afterward still returned 200.
- Sign-out returned success and revoked the session (`/api/auth/me` returned
  401); the homepage then showed the signed-out account links. Signing in again
  restored the signed-in homepage actions without changing the workspace.
- QA used a disposable account/workspace. Cleanup removed its user, wedding,
  membership, session if present, and per-email rate-limit record. User data was
  not changed. Lint and TypeScript checks passed after the homepage change.

### Member invitation and event increment — 2026-10-20

- Focused tests cover valid/invalid event inputs, rejecting client-selected
  wedding IDs, timezone-aware local event conversion, invitation email/role
  validation, and high-entropy token shape.
- Lint, TypeScript, and all 11 tests passed. Local unauthenticated checks
  returned 401 for `/api/events`, `/api/members`, and
  `/api/members/invitations`; `/members` redirected to login. Invalid public
  invitation tokens returned 404.
- A read-only Resend domains check accepted the configured API key but returned
  no domains. No email was sent, so actual provider delivery remains unverified
  until a sender domain is available.
- A separate local MongoDB QA flow passed 13 checks using two disposable fake
  accounts: event create/readback and dashboard display, public invitation
  summary, mismatch rejection, matching-email acceptance, member access,
  one-time use, member listing, and revocation. The account, wedding, events,
  invitations, memberships, sessions, and per-email signup limits were removed.
  No email was sent; actual delivery remains unverified.

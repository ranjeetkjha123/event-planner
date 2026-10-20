# Authentication QA

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
- Password recovery remains a placeholder; it is not a passing account flow.
- `/onboarding` is currently a preview. Wedding details, planner invitations,
  and events entered there are not persisted yet.

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

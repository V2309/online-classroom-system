# Memory - JWT Auth Backend

Last updated: 2026-07-22

## What was built

- Completed JWT authentication for the NestJS backend.
- Updated `src/module/auth/auth.service.ts` so signup and login both return `accessToken`, `expiresIn`, and a sanitized `user` object.
- Updated `src/module/auth/auth.controller.ts` with FE-ready endpoints:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Added `src/module/auth/strategies/jwt.strategy.ts` to validate JWTs from either `Authorization: Bearer <token>` or the httpOnly `session` cookie.
- Fixed `src/common/decorators/current-user.decorator.ts` to work as a request param decorator.
- Updated `src/common/guards/roles.guard.ts` typing so it can read `request.user.role`.
- Updated signup/login DTOs for validation, including email-or-phone signup and optional `img`.

## Decisions made

- Frontend can authenticate in either of two supported ways:
  - Store and send `accessToken` with `Authorization: Bearer <token>`.
  - Use the backend-set httpOnly `session` cookie with `credentials: 'include'`.
- JWT access token lifetime is currently 15 minutes and response includes `expiresIn: 900`.
- Auth responses never expose password hashes.
- Signup automatically creates matching `Student` or `Teacher` profile records for those roles; `admin` only creates a `User` record.

## Problems solved

- Existing `JwtAuthGuard` had no registered JWT strategy; it now works through Passport JWT.
- Existing `CurrentUser` decorator was metadata-based rather than request-user based; it now returns the authenticated user or a selected property.
- TypeScript build errors around `Request.user.role`, decorator metadata imports, and exported auth response types were resolved.
- Jest initially failed in sandbox with `spawn EPERM`; reran with `--runInBand` outside sandbox and tests passed.

## Current state

- `npm run build` passes.
- `npm test -- --runInBand` passes: 2 test suites, 2 tests.
- No refresh-token flow yet; auth currently uses only a 15-minute access token plus optional cookie.
- Repo appears fully untracked in git status, so normal git diff is not useful until files are added/tracked.

## Next session starts with

- Decide whether to add refresh tokens for longer-lived frontend sessions.
- If keeping cookie auth for browser FE, verify `FRONTEND_URL`, cookie sameSite/secure settings, and frontend `credentials: 'include'` behavior in the real environment.
- Add focused auth e2e tests for signup/login/me/logout once test database setup is agreed.

## Open questions

- Should the frontend use bearer tokens, httpOnly cookies, or both?
- Should login sessions survive longer than 15 minutes through refresh tokens?

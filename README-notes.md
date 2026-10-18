# Run My Errands

Two separate projects in one repo:

| Folder      | What it is                                   | Runs on |
|-------------|----------------------------------------------|---------|
| `backend/`  | Spring Boot 4.1 (Java 21) REST API + PostgreSQL | :8080 |
| `frontend/` | React 18 + TypeScript (Vite) web app          | :5173 |

## Open in VS Code
`File → Open Workspace from File…` → **`run-my-errands.code-workspace`**
(VS Code will offer to install the recommended Java / Spring Boot / Docker extensions.)

## First run (4 steps)
1. **Database** — `cd backend && docker compose up -d`  (Postgres 16 on :5432; Flyway creates all tables + seeds the 13 categories on first start)
2. **Backend** — `cd backend && mvn spring-boot:run`   → check `http://localhost:8080/api/v1/categories`
3. **Frontend** — `cd frontend && npm install && npm run dev`  → open `http://localhost:5173`
4. Sign up in the browser. (The dev server proxies `/api` to :8080, so there's no CORS setup to do.)

> Before anything real: change `app.jwt.secret` in `backend/src/main/resources/application.yml`
> (`openssl rand -base64 48`).

## How the app works (matches the architecture plan)
- **Auth:** email + password → JWT. Phone number is a profile field only.
- **Two booking paths:** (1) Requester books a Giver straight from *Matches* → booking starts `REQUESTED`, Giver accepts/declines.
  (2) Giver sends an *Offer* on an open favor → Requester accepts → booking starts `CONFIRMED`, all other offers auto-rejected.
- **Phone reveal:** `GET /bookings/{id}/contact` returns the other side's phone **only** when the booking is `CONFIRMED`/`COMPLETED`/`CLOSED`, enforced server-side.
- **Reviews:** blind two-way — hidden until both submit, or 7 days pass (hourly job publishes stale ones).
- **No chat, no payments** — by design (see the thesis scope).

## Status — what's real and what's still TODO
**Built:** auth, categories, giver profile + per-category prices, post favor, haversine nearby-giver matching
(±25% price, 15 km), browse open favors, offers (send / accept / reject / withdraw), booking state machine,
contact reveal, blind reviews + rating aggregates, all main screens, EN/MK language switch.

**Not built yet:** `/auth/refresh` + `/auth/logout`, notifications (page is a placeholder), PATCH/DELETE favor,
radius/lat-lng filtering on *Browse*, booking auto-expiry after 24 h, map view, tests, PostGIS (haversine SQL is used instead),
rate limiting, Docker deployment.

**Honesty note:** the frontend was compiled (`tsc` + `vite build`) successfully. The backend has **not** been
compiled or run yet — first `mvn spring-boot:run` may surface small errors (Spring Boot 4 is new). Fix them one at a time;
the code is small and conventional.

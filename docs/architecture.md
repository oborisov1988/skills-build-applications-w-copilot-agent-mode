# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build route-based React pages for activities, teams, leaderboard, and workout suggestions using the shared API client and Bootstrap layouts; each page will render loading, empty, success, and error states with accessible text roles and alerts.
- Logic tier decision: Keep the Express app thin and route-driven; all business rules live in explicit service functions so `/api/*` handlers only validate input, call services, and convert errors into deliberate 4xx responses.
- Data tier decision: Use Mongoose schemas to enforce required fields and relationship integrity, and keep seeding idempotent by upserting demo users, teams, activities, and workouts without clearing unrelated data.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`, verify both referenced records exist, reject malformed IDs with 4xx, and persist `user`, `team`, `type`, `minutes`, computed `points`, and `occurredAt`.
- Team management approach: Require a name and mascot on create requests, default `members` to an empty array, and preserve member IDs as ObjectIds while returning populated team data through the API.
- Leaderboard approach: Aggregate activity points by team, order descending by total points, and assign 1-based ranks in the returned `leaderboard` payload.
- Workout suggestions approach: Match suggestions to a user’s most recent activity pattern and fitness goal, prefer workouts whose `focus` matches that pattern, and include a reason that references the underlying run/strength/endurance pattern or activity history.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Fails because the Mongoose schemas are missing required validation for `User`, `Team`, `Activity`, and `Workout`. The seed also indicates those models are not yet enforcing the data contract.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Fails because the backend still returns `501` for invalid requests instead of deliberate `400` validation errors, does not aggregate leaderboard totals, and does not suggest workouts based on user activity patterns.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Fails because the app still renders placeholder “Implementation pending” content rather than fetching and showing real activity, team, leaderboard, and workout data with loading/empty/error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Use this to confirm the TypeScript contracts, route/service signatures, and model validation all compile after the data and logic tiers are implemented.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Use this to confirm the React route components and API client contract compile cleanly after the presentation tier is wired to the backend contract.

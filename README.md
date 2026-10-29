# ProblemPad

ProblemPad is a personal DSA problem library with an integrated editor, saved drafts, test cases, Gemini-assisted problem parsing and candidate test generation, and OnlineCompiler.io-backed code execution.

## Stack and layout

- `frontend/`: React 19, Vite, React Router, Tailwind CSS, Monaco, Axios and Lucide.
- `backend/`: Express ES modules, Mongoose, JWT, bcrypt, Zod, Google Gen AI SDK and OnlineCompiler.io execution integration.
- MongoDB stores users, problems and test cases, collections, drafts and submissions.

## Setup

Node.js 20+ is recommended. The workspace root `.env` is loaded by the backend. The provided `.env` is intentionally ignored by Git. Set `MONGO_URI` and `GOOGLE_API_KEY` there; ProblemPad maps the latter to `GEMINI_API_KEY` inside the backend. Add a long random `JWT_SECRET` before using the app outside local development. OnlineCompiler.io execution requires `ONLINECOMPILER_API_KEY`; its Judge0-compatible endpoint is used by default.

For local development, run MongoDB separately or use MongoDB Atlas. If using Atlas, allow your machine's IP in Atlas Network Access and use the Atlas connection string as `MONGO_URI`.

Install and run:

```sh
npm install
npm --prefix backend install
npm --prefix frontend install
npm run dev
```

Frontend: `http://localhost:5173`. API: `http://127.0.0.1:4000/api/health`.

## Integrations

Gemini is called only from the backend using `GOOGLE_API_KEY`/`GEMINI_API_KEY`. Generated test cases are labeled unverified because model-provided expected outputs are not independently checked. Review them before use. Parsing and test generation are limited to 10 calls/hour per IP.

Code execution sends source and input to OnlineCompiler.io's Judge0-compatible submissions endpoint (`https://api.onlinecompiler.io/api/judge0`). Add your REST API key as `ONLINECOMPILER_API_KEY` in the project root `.env`; set `ONLINECOMPILER_API_URL` only if you need to override the endpoint. The backend keeps the key server-side and sends code with stdin, then compares the returned output with each expected output. Function-only problems may need a language-specific harness added to the problem definition. Legacy `JUDGE0_API_KEY` and `JUDGE0_API_URL` variables remain supported for existing configurations.

By default, CORS accepts requests from any frontend origin. Set `CLIENT_ORIGIN` in the backend host to the frontend's exact origin (for example, `https://your-app.onrender.com`, with no path) when you are ready to restrict browser access. Multiple frontend origins can be comma-separated; localhost origins remain enabled for development.

## Security and current limits

Passwords use bcrypt. API routes require a bearer JWT; private problems, drafts and submissions are scoped to their owner. Hidden test inputs and expected outputs are filtered from reads by non-owners. Markdown is rendered as React text with raw HTML disabled. `.env` is gitignored.

MVP limitations: authentication uses browser local storage tokens; use HTTPS in deployment and consider HttpOnly cookie sessions with CSRF protections. Public sharing is available for problem reads but there is no public profile/discovery UI. Collection membership can be added and removed with the collection routes. Sample tests can be run directly; Submit runs only test cases marked `verified`, which should be reviewed and marked approved before shipping. Set the test case `verified` flag via the API/database after checking it. AI-generated cases are never auto-approved. A production judge deployment should add execution quotas, queueing, stricter provider timeouts and an isolated self-hosted execution environment.

## Commands

- `npm run dev`: API and frontend development servers.
- `npm run build`: frontend production build.
- `npm --prefix backend test`: backend Node test runner.
- `npm --prefix backend start`: production API process.

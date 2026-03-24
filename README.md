# Boardli Backend

Backend API for Boardli, an onboarding assistant platform where companies upload knowledge resources and employees query them through an AI-powered chat interface (RAG workflow).

## Tech Stack

- NestJS
- MongoDB + Mongoose
- JWT + Passport
- Google OAuth 2.0
- Gemini AI (`@google/generative-ai`)
- LangChain text splitters
- Typesense (vector search and indexing)
- Redis (cache and query statistics)
- Swagger (OpenAPI docs)

## Features

- Company and employee authentication (email/password + Google OAuth)
- Role-aware endpoints for `company` and `employee` users
- Company department management and employee invitation flow
- Resource ingestion from:
  - uploaded files (`.pdf`, `.docx`, `.md`, `.txt`)
  - URLs (static and dynamic pages via Cheerio/Puppeteer)
- RAG chat over company knowledge base:
  - chunking + embeddings + vector retrieval + Gemini answer generation
- AI-generated personalized employee avatars
- Chat history persistence and welcome message bootstrap
- Swagger API documentation at runtime

## Prerequisites

- Node.js 20+
- npm 10+ (or pnpm, but align with the lockfile strategy in your team)
- MongoDB instance
- Redis instance
- Typesense instance
- Google OAuth credentials
- Gemini API keys

## Getting Started (Local)

### 1. Clone

```bash
git clone <your-repository-url>
cd Empat-final-project-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root and set variables from the table below.

### 4. Run in development

```bash
npm run start:dev
```

The API starts on `http://localhost:3000` unless `PORT` is overridden.

## Environment Variables

All variables used by this codebase:

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port for NestJS server. Defaults to `3000`. |
| `MONGODB_URI` | Yes | MongoDB connection string for `MongooseModule.forRoot`. |
| `JWT_SECRET` | Yes | Secret used by `JwtModule` and `JwtStrategy` to sign/verify JWT tokens. |
| `FRONTEND_URL` | Yes | Frontend base URL used for OAuth redirects and resource download links. |
| `APP_URL` | Yes | Public backend URL used to build avatar public links in `ImageGeneratorService`. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth web client ID used by Passport Google strategy. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth web client secret. |
| `GOOGLE_CALLBACK_URL` | Yes | OAuth callback URL for `GET /api/v1/auth/google/callback`. |
| `GOOGLE_CLIENT_ID_MOBILE` | Yes | Google mobile client ID used to verify mobile ID tokens in `AuthService.verifyGoogleIdToken`. |
| `GEMINI_API_KEYS` | Yes | Comma-separated Gemini API keys; `GeminiService` rotates keys after several requests. |
| `POLLINATIONS_API_KEYS` | Yes | Comma-separated API keys used for avatar image generation fallback/provider calls. |
| `REDIS_URL` | Yes | Redis connection string for `RedisService`. |
| `TYPESENSE_HOST` | Yes | Typesense host (used by `SearchService`). |
| `TYPESENSE_PORT` | Yes | Typesense port (used by `SearchService`). |
| `TYPESENSE_PROTOCOL` | Yes | Typesense protocol (`http` or `https`). |
| `TYPESENSE_API_KEY` | Yes | Typesense admin/search key for collections and document operations. |
| `PUPPETEER_EXECUTABLE_PATH` | No | Chromium executable path for dynamic page scraping. Defaults to container/linux path if not set. |

## Project Structure

```text
src/
  app.module.ts
  main.ts
  modules/
    auth/         # Registration, login, JWT, Google OAuth strategies
    companies/    # Company profile, departments, invite lifecycle
    employees/    # Employee CRUD and profile updates
    resources/    # Upload URL/file resources and secure retrieval
    ai/           # RAG orchestration, embeddings, Gemini responses, avatars
    chat/         # Chat history persistence
    search/       # Typesense initialization and vector search
    cache/        # Redis client + response caching + query stats
```

## Available Scripts

From `package.json`:

- `npm run start` - run NestJS in default mode
- `npm run start:dev` - run in watch mode
- `npm run start:debug` - run with debugger and watch mode
- `npm run build` - compile TypeScript to `dist/`
- `npm run start:prod` - run production build (`node dist/main`)
- `npm run lint` - run ESLint with autofix
- `npm run format` - run Prettier formatting
- `npm run test` - run unit tests
- `npm run test:watch` - run tests in watch mode
- `npm run test:cov` - run tests with coverage
- `npm run test:e2e` - run e2e test suite
- `npm run test:debug` - run Jest in debug mode

## API Documentation (Swagger)

When the server is running:

- Swagger UI: `http://localhost:3000/api/v1/docs`

## Core API Areas

- `AuthController` (`/api/v1/auth`)
  - employee/company registration and login
  - Google OAuth web + mobile login
  - current user profile (`/me`)
- `CompaniesController` (`/api/v1/companies`)
  - department management
  - invite employee flow
  - employee/invite update paths for company accounts
- `EmployeeController` (`/api/v1/employees`)
  - list/read/update/delete employee or invite records by company scope
- `ResourcesController` (`/api/v1/resources`)
  - upload file, add URL, list resources, secure download
- `AiController` (`/api/v1/ai`)
  - AI status
  - RAG chat endpoint
  - avatar generation
  - chat history

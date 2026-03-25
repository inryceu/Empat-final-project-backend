# Boardli Backend Architecture

## Overview

Boardli Backend is a NestJS monolith organized by domain modules. It combines classic business APIs (auth, companies, employees, resources) with an AI pipeline that ingests knowledge, builds embeddings, stores vectors, and serves contextual answers through Gemini.

Primary runtime components:

- HTTP API: NestJS (`main.ts`, `app.module.ts`)
- Primary DB: MongoDB (Mongoose schemas)
- Vector/search engine: Typesense
- Cache and lightweight analytics: Redis
- LLM provider: Gemini APIs
- Web/file ingestion utilities: Puppeteer, Cheerio, LangChain, Mammoth

## Runtime Composition

`AppModule` wires global infrastructure and feature modules:

- `ConfigModule.forRoot({ isGlobal: true })`
- `MongooseModule.forRoot(process.env.MONGODB_URI || '')`
- feature modules: `AiModule`, `AuthModule`, `EmployeesModule`, `CompaniesModule`
- static files: `ServeStaticModule` serves `/public/*`

`main.ts` configures:

- global validation pipe (`whitelist`, `forbidNonWhitelisted`, `transform`)
- global prefix `/api`
- URI versioning (`/v1`)
- Swagger at `/api/v1/docs`
- CORS with credentials enabled

## Folder Structure

```text
src/
  main.ts                    # bootstrap, Swagger, CORS, validation
  app.module.ts              # root module imports
  modules/
    auth/
      auth.controller.ts     # auth endpoints
      auth.service.ts        # credentials and token logic
      auth.module.ts
      strategies/
        jwt.strategy.ts
        google.strategy.ts
      dto/
    companies/
      companies.controller.ts
      companies.service.ts
      companies.module.ts
      schemas/
        company.schema.ts
        invite.schema.ts
      dto/
    employees/
      employee.controller.ts
      employee.service.ts
      employee.module.ts
      schemas/
        employee.schema.ts
    resources/
      resources.controller.ts
      resources.service.ts
      resources.module.ts
      schemas/
        resource.schema.ts
      dto/
    ai/
      ai.controller.ts
      ai.module.ts
      services/
        ai.service.ts
        gemini.service.ts
        document.service.ts
        scraper.service.ts
        image-generator.service.ts
      schemas/
        resource-chunk.schema.ts
      utils/
        chunks.utils.ts
      constants/
        prompts.constant.ts
      dto/
    search/
      search.service.ts
      search.module.ts
    cache/
      redis.module.ts
      services/
        redis.service.ts
        cache.service.ts
    chat/
      chat.module.ts
      chat.service.ts
      schemas/
        chat.schema.ts
```

## Module Breakdown

### 1) Auth Module (`src/modules/auth`)

Responsibilities:

- employee/company registration and login
- password hashing (`bcrypt`)
- JWT issuance and profile resolution
- Google OAuth web callback and mobile token verification

Key files:

- `AuthController`: `/auth/*` routes
- `AuthService`: credential verification, registration, token issuance
- `JwtStrategy`: validates Bearer token and loads user entity
- `GoogleStrategy`: Passport OAuth strategy

Notable flow:

```ts
const payload = {
  email: entity.email,
  id: entity._id?.toString() || entity.id,
  userType,
};
const accessToken = this.jwtService.sign(payload);
```

### 2) Companies Module (`src/modules/companies`)

Responsibilities:

- manage company profile data
- department CRUD-like operations
- invitation lifecycle (`Invite` collection)
- update pending invite records and active employee records via one endpoint

Key files:

- `companies.controller.ts`
- `companies.service.ts`
- schemas: `company.schema.ts`, `invite.schema.ts`

### 3) Employees Module (`src/modules/employees`)

Responsibilities:

- employee listing, retrieval, update, delete within company scope
- supports mixed responses containing both active employees and pending invites
- avatar URL update (`updateAvatar`)

Key files:

- `employee.controller.ts`
- `employee.service.ts`
- schema: `employee.schema.ts`

### 4) Resources Module (`src/modules/resources`)

Responsibilities:

- upload local files and register URL resources
- protect access by company and employee scope
- trigger async content processing (`processFile`, `processUrl`)
- secure file download stream

Key behavior:

- `ResourceSchema` hooks in `resources.module.ts` synchronize with Typesense:
  - post-save => `SearchService.upsertResource(...)`
  - post-findOneAndDelete => `SearchService.deleteResource(...)`

### 5) AI + Chat Modules (`src/modules/ai`, `src/modules/chat`)

Responsibilities:

- orchestrate RAG response generation
- split and embed knowledge chunks
- aggregate retrieved context and call Gemini
- persist chat history + welcome message
- generate personalized avatars for employees

Key files:

- `AiController`, `AiService`, `GeminiService`
- `DocumentService` (file parsing/chunking)
- `ScraperService` (URL ingestion)
- `ChatService` (`Chat` collection operations)
- `ResourceChunk` schema

## Database Design (MongoDB)

Collections defined by Mongoose schemas:

### `companies`

Schema: `company.schema.ts`

- `name`, `industry`, `size`, `contactName`
- `email` (unique), `password`
- `departments: string[]`
- timestamps

### `employees`

Schema: `employee.schema.ts`

- `name`, `email` (unique), `password?`
- `department`, `role`, `gender?`, `hobbies?`, `favoriteAnimal?`
- `companyId` -> ObjectId reference to company
- `avatarUrl?`
- timestamps

### `invites`

Schema: `invite.schema.ts`

- `email` (unique), `token` (unique)
- `companyId` -> ObjectId reference to company
- `name`, `department`, `role`
- timestamps

### `resources`

Schema: `resource.schema.ts`

- ownership/scope:
  - `companyId` (required)
  - `employeeId` (nullable; `null` means company-global)
- metadata:
  - `type` (`file` | `url`)
  - `title`
  - `url`, `fileName`, `mimeType`, `fileSize`, `filePath`
- processing status:
  - `processed`, `processedAt`, `processingError`
  - `extractedContent`, `extractedAt`, `contentLength`, `originalUrl`
- lightweight `embedding` field for resource-level indexing

### `resourcechunks`

Schema: `resource-chunk.schema.ts`

- `resourceId` -> ObjectId reference to `resources`
- `companyId`
- `chunkText`
- `embedding: number[]`
- `chunkIndex`
- timestamps

### `chats`

Schema: `chat.schema.ts`

- `userId` (unique)
- `messages[]`:
  - `role` (`employee` | `assistant`)
  - `content`
  - `sources[]`
  - `createdAt`
- timestamps

## Data Relationships

- One `Company` -> many `Employees`
- One `Company` -> many `Invites`
- One `Company` -> many `Resources`
- One `Employee` -> zero/many employee-scoped `Resources`
- One `Resource` -> many `ResourceChunk`
- One user (`employeeId` or company user id) -> one `Chat` document

## Authentication Architecture

### JWT Strategy

Token creation occurs in `AuthService.login(entity, userType)` and includes:

- `email`
- `id`
- `userType` (`employee` or `company`)

Validation occurs in `JwtStrategy.validate(payload)`:

- if `payload.userType === 'company'`: fetches company via `CompaniesService.findOne`
- else: fetches employee via `EmployeesService.findByIdForAuth`
- returns normalized `req.user` with `id` and `userType`

Guard usage across controllers:

- `@UseGuards(AuthGuard('jwt'))` on AI, resources, companies, employees, and profile routes

### Google OAuth Flow

Web flow:

1. `GET /api/v1/auth/google` -> Passport Google redirect
2. `GET /api/v1/auth/google/callback` -> receives profile
3. `AuthController.googleAuthRedirect` extracts email and calls `AuthService.handleGoogleLogin`
4. backend redirects to frontend with `token` or error query parameter

Mobile flow:

1. `POST /api/v1/auth/google/mobile` with `idToken`
2. `AuthService.verifyGoogleIdToken` validates token using `OAuth2Client`
3. user resolved by email and JWT is issued

### Role-Aware Access Control

The codebase uses:

- JWT guard for authentication
- explicit role checks in controller methods (`req.user.userType`) for authorization

Examples:

- company-only endpoints in `CompaniesController` throw `ForbiddenException` for employees
- AI avatar endpoints in `AiController` reject company users
- resources visibility depends on `companyId` and optional `employeeId`

## File Processing Pipeline

## 1) Resource creation

File upload route:

- `POST /api/v1/resources/upload` (`FileInterceptor`, disk storage `./uploads`)

URL route:

- `POST /api/v1/resources/url`

Both create a `Resource` document and then trigger async processing:

- `ResourcesService.processFile(resourceId)` or
- `ResourcesService.processUrl(resourceId)`

## 2) Parsing and extraction

`DocumentService.extractTextFromFile`:

- `.pdf` -> `PDFLoader`
- `.docx` -> `mammoth.extractRawText`
- `.md`/`.txt` -> filesystem read

`ScraperService.scrapeWebPage`:

- Google Docs -> export text endpoint
- dynamic pages (`notion.*`, `webflow`) -> Puppeteer
- static pages -> fetch + Cheerio content extraction
- cleanup/normalization via `cleanAndStructureContent`

## 3) Chunking

`DocumentService.splitIntoChunks` uses:

```ts
new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
});
```

`AiService.processAndSaveChunks` persists chunk docs in `ResourceChunk` collection.

## RAG Pipeline

### 1) Embeddings generation

`GeminiService.generateEmbeddings(texts)`:

- model: `gemini-embedding-001`
- batches requests (`BATCH_SIZE = 5`)
- rotates API keys every `REQUESTS_PER_KEY`

### 2) Vector persistence

After chunk insertion:

- `AiService` calls `SearchService.upsertChunks(savedDocs)`
- data imported into Typesense collection `resource_chunks`

Resource-level metadata is synced into Typesense collection `resources` via Mongoose schema hooks.

### 3) Query-time retrieval

`AiService.generateResponse(query, companyId, employeeId)`:

1. Cache lookup in Redis by normalized query + company hash
2. Query expansion (`expandQuery`)
3. Embedding generation for each expanded query
4. Vector search through `SearchService.searchChunksByVector`
5. Deduplication and ranking in `aggregateChunks`

Typesense filter logic enforces visibility:

- company scope always applied
- employee sees own + global chunks (`employeeId` and `GLOBAL`)
- company/system scope reads global chunks

### 4) Context assembly and LLM answer

`buildContextFromChunks`:

- fetches related `Resource` docs
- builds prompt context from chunk text
- prepares `sources` metadata

`GeminiService.generateContent` (model `gemini-2.5-flash`) receives:

- system prompt (`SYSTEM_PROMPT`)
- user prompt with retrieved context and question

Response is cached and persisted to chat history (`ChatService.saveMessagePair`).

## Caching Strategy (Redis)

Implemented in `CacheService` + `RedisService`:

- response cache key: MD5(normalized query + companyId)
- TTL: 3600 seconds
- popularity tracking:
  - increments per-query counters
  - stores ranked entries in sorted set `ai:popular:<companyId>`
- graceful degradation:
  - if Redis is unavailable, AI path still works without cache

## Error Handling Approach

Nest exceptions are used for API-level errors:

- `UnauthorizedException`, `ForbiddenException`
- `NotFoundException`
- `BadRequestException`
- `ConflictException`

Processing pipeline errors:

- file/url processing catches errors and updates `Resource.processingError`
- many async side effects use `.catch(...)` logging to avoid crashing request cycle
- search/cache failures degrade functionality instead of failing the whole request

## Request Lifecycle Examples

### Chat request (`POST /api/v1/ai/chat`)

1. JWT guard authenticates request.
2. Controller derives `companyId` + `employeeId`.
3. `AiService.generateResponse` executes cache -> retrieve -> generate -> cache.
4. Message pair is persisted in `Chat` collection.
5. Client receives `{ content, sources }`.

### Resource upload (`POST /api/v1/resources/upload`)

1. JWT guard authenticates user and role context.
2. File stored under `uploads/`.
3. `Resource` doc created (with title embedding).
4. Async parser extracts text and chunks content.
5. Chunk embeddings generated and stored in MongoDB + Typesense.
6. `Resource.processed` updated on success/failure.

## Integration Notes

- API prefix/version: `/api/v1`
- Swagger: `/api/v1/docs`
- static assets: `/public/*` (avatars)
- Docker setup includes `api`, `gateway` (nginx), `db` (mongo), `redis`, `typesense`

## Known Architectural Constraints

- Role authorization is mostly controller-level condition checks, not dedicated RBAC guards.
- Some services rely on direct `process.env` reads instead of typed centralized config.
- Tests currently cover mostly boilerplate paths; core RAG and auth flows need deeper integration coverage.

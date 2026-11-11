# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Monorepo for a pediatrics app: pediatricians (users) register patients and build questionnaires (forms) that a patient's guardian fills out via a public link.

- `backend/` — NestJS 11 + Prisma 6 (PostgreSQL) REST API. The only implemented part.
- `mobile/`, `web-form/` — placeholders (`.gitkeep` only). `web-form` is intended to be the guardian-facing public form.

Code comments, error messages and commit messages are written in Portuguese (pt-BR); keep that convention.

## Commands (run from `backend/`)

```bash
npm run start:dev          # dev server with watch (port: $PORT or 3000)
npm run build              # nest build -> dist/
npm run lint               # eslint with --fix
npm run format             # prettier (single quotes, trailing commas)
npm test                   # unit tests (*.spec.ts under src/)
npx jest src/forms/forms.service.spec.ts   # single test file
npx jest -t "should be defined"            # tests matching a name
npm run test:e2e           # e2e tests (test/*.e2e-spec.ts, config test/jest-e2e.json)

npx prisma migrate dev --name <name>   # create + apply migration after editing schema.prisma
npx prisma generate                    # regenerate client (needed for new enums/models in TS types)
npx prisma studio
```

`DATABASE_URL` is read from `backend/.env` (loaded by `prisma.config.ts` via `dotenv/config`).

## Architecture

- **Module per domain** in `backend/src/`: `auth`, `users`, `patients`, `forms`, `questions`, `answers`, each with controller/service/dto. Services talk to Prisma directly — no repository layer.
- **PrismaModule is `@Global()`**: `PrismaService` (extends `PrismaClient`) can be injected anywhere without importing the module.
- **Imports use `src/...` absolute paths** (resolved via tsconfig `baseUrl`), mixed with relative imports.
- **Auth**: `POST /auth/register` (bcrypt-hashed password, requires unique `email` and `crm`) and `POST /auth/login` returns `{ access_token }`. JWT payload is `{ sub: userId, email }`; `JwtStrategy.validate` exposes it as `req.user = { userId, email }`. The JWT secret is currently hardcoded as `'jwt-secret-key'` in both `auth.module.ts` and `jwt.strategy.ts` — change both together. Protect routes with `@UseGuards(JwtAuthGuard)` (from `src/auth/guards/jwt-auth.guard`); `patients` and `forms` controllers are guarded, `answers` is not.
- **Questions are created through the forms controller** (`POST/GET /forms/:id/questions`, via `QuestionsService` exported from `QuestionsModule`); `QuestionsController` itself is empty. Answers live at `POST/GET /questions/:id/answers`.
- **No global `ValidationPipe` / class-validator**: DTOs are plain TS classes with `!`/`?` markers, so request bodies are not validated at runtime.
- `patients.create` takes `pediatricianId` from the request body, not from the JWT user.

### Data model (`backend/prisma/schema.prisma`)

`User` (pediatrician) → `Patient` → `Form` → `Question` → `Answer`; `Form` → `FormResponse` → `Answer` (`Answer.formResponseId` is optional, so answers can currently exist without a submission).

- `Form.status`: `DRAFT` → `SENT` → `ANSWERED` → `CLOSED`.
- `Form.publicToken` (unique) backs the guardian's public link. `FormsService.generatePublicLink` (sets token + status `SENT`) and `findByPublicToken` (only returns `SENT` forms, without answers) exist but are **not yet exposed by any controller**; the generated URL points at `/public/forms/:token`.
- `Question.type` is the `QuestionType` enum (`TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `MULTIPLE_CHOICE`); questions are always ordered by `order asc`.
- Note the field is spelled `Form.updateAt` (not `updatedAt`).

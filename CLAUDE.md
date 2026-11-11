# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Monorepo for a pediatrics app (TCC/academic project): pediatricians (users) register patients and build questionnaires (forms); a patient's guardian fills them out via a public link, without an account. Only the pediatrician has an admin area.

- `backend/` — NestJS 11 + Prisma 6.16.2 (PostgreSQL) REST API.
- `web-form/` — React 19 + Vite + TypeScript page the guardian opens from the public link (`/formulario/<token>`). No router: the token is parsed from `window.location.pathname` in `App.tsx`.
- `mobile/` — placeholder; planned React Native app (Expo) for the pediatrician's admin area.

Code comments, UI text, error messages and commit messages are in Portuguese (pt-BR); keep that convention.

## Working agreements (from the user)

- Work incrementally, one step at a time; wait for the user to test in Postman/browser before moving on.
- Never run `prisma migrate reset` or anything that can drop data (including using the main DB as a shadow database). The user runs `prisma migrate dev` themselves.
- Don't upgrade dependency versions or add libraries without justification and the user's approval.

## Commands

Backend (from `backend/`):
```bash
npm run start:dev          # dev server with watch (port: $PORT or 3000)
npm run build              # nest build -> dist/src/ (prisma.config.ts is compiled too, so `start:prod` / `node dist/main` is currently broken)
npm run lint
npm test                   # unit tests (*.spec.ts under src/); single file: npx jest src/forms/forms.service.spec.ts
npm run test:e2e
npx prisma migrate dev --name <name>   # stop the dev server first on Windows (query engine DLL is locked -> EPERM)
npx prisma generate
npx prisma studio
```

Web-form (from `web-form/`): `npm run dev` (http://localhost:5173), `npm run build` (tsc + vite build), `npm run lint` (oxlint). API URL from `VITE_API_URL`, default `http://localhost:3000`.

## Backend architecture

- **Environment**: `main.ts` calls `process.loadEnvFile()` (native Node, no dotenv dependency) before bootstrap. `backend/.env` holds `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_FORM_URL` (base of generated public links, e.g. `http://localhost:5173/formulario`). Because `.env` is loaded at runtime in `main.ts`, anything reading env at module-decoration time must be deferred (that's why `JwtModule.registerAsync` is used).
- **Module per domain** in `src/`: `auth`, `users`, `patients`, `forms`, `questions`, `answers`, `prisma`. Services use Prisma directly. `PrismaModule` is `@Global()`. Imports use `src/...` absolute paths (tsconfig `baseUrl`). Interfaces used in decorated parameters must be imported with `import type` (isolatedModules + emitDecoratorMetadata).
- **Errors**: global `PrismaExceptionFilter` (`src/prisma/prisma-exception.filter.ts`) maps P2002→409, P2003→409, P2025→404, `PrismaClientValidationError`→400. There is no global `ValidationPipe`/class-validator; DTOs are plain classes and validation is done by hand in services (`BadRequestException`/`ConflictException`).
- **Auth & ownership**: JWT payload `{ sub, email }` → `req.user = { userId, email }`, read via `@CurrentUser()` (`src/auth/decorators/current-user.decorator.ts`). Every admin query is scoped by the ownership chain User → Patient → Form → Question/Answer (e.g. `where: { id, patient: { pediatricianId: userId } }`); foreign records return 404, not 403. `FormsService.assertOwner` guards form-level operations, including question routes. `pediatricianId` always comes from the token, never from the body.
- **Routes**: questions are managed under `/forms/:id/questions[/:questionId]` (the `QuestionsController` is empty). Admin history: `GET /forms/:id/responses[/:responseId]`. Legacy `/questions/:id/answers` creates answers without a `FormResponse` (JWT + ownership protected).
- **Public flow** (`PublicFormsController`, no guard, `/public/forms/:token`): `POST /forms/:id/public-link` stores a random `publicToken` and sets status `SENT` (regenerating invalidates the old link). `GET /public/forms/:token` returns only title/description/questions (no patient data, no answers) when status is `SENT` or `ANSWERED`. `POST /public/forms/:token/responses` with `{ answers: [{ questionId, answer }] }` validates everything in `FormsService.submitResponse` and creates one `FormResponse` with its `Answer`s in a transaction, then sets status `ANSWERED`.

### Data model (`backend/prisma/schema.prisma`)

`User` → `Patient` → `Form` → `Question` → `Answer`; `Form` → `FormResponse` → `Answer` (`Answer.formResponseId` is optional for legacy answers).

- `Form.status`: `DRAFT` → `SENT` → `ANSWERED` → `CLOSED` (`CLOSED`/`DRAFT` block the public link). Field is spelled `Form.updateAt`.
- `Answer.answer` is always a String. `parseForType` in `FormsService` normalizes on submit: BOOLEAN accepts true/sim/s/1… and stores `"true"`/`"false"`; NUMBER accepts comma decimals and stores the dot form; DATE requires `YYYY-MM-DD`; MULTIPLE_CHOICE must match `Question.options` (case-insensitive) and stores the canonical option (single choice).
- `Question.options String[]` is required (≥2, unique) for `MULTIPLE_CHOICE` and must be empty otherwise. To preserve history: questions with answers can't be deleted or change type, and options already answered can't be removed (409).
- The VS Code Prisma extension may flag `url = env("DATABASE_URL")` as unsupported — that's a Prisma 7 rule; it is valid on 6.16.2.

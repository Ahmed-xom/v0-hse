# AMNKO HSE Independent MVP

This application is isolated under `independent-mvp/` on branch `amnko-hse-independent-mvp`. It does not modify the existing application root or merge into `main`.

## Database safety
Only `AMNKO_DATABASE_URL` is read. The legacy `DATABASE_URL` is never referenced. Do not set this variable until a new, dedicated Neon project/database has been created and verified.

Apply `db/schema.sql` and then `db/session-table.sql` to that new database only. Create the first user and company through a separately reviewed bootstrap procedure; public registration is intentionally disabled.

Set `APP_SESSION_SECRET` to a random value of at least 32 characters. Copy `.env.example` to a private environment file; never commit secrets.

## Run
```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Current limits
Authentication and persistence require the dedicated database. No database connection or migration is attempted by this repository setup.

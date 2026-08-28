-- Better Auth Tables
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'USER',
    "isSuperAdmin" BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- HSE System Tables
CREATE TABLE IF NOT EXISTS "hse_user" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    "payrollNo" VARCHAR UNIQUE,
    designation TEXT,
    "businessUnit" TEXT,
    "hseRole" TEXT,
    status VARCHAR DEFAULT 'Active',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "password_reset" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "resetBy" TEXT NOT NULL REFERENCES "user"(id),
    "newPassword" TEXT NOT NULL,
    "resetAt" TIMESTAMP NOT NULL DEFAULT now(),
    "ipAddress" TEXT
);

CREATE TABLE IF NOT EXISTS "excel_data" (
    id TEXT PRIMARY KEY,
    source VARCHAR NOT NULL,
    "sheetName" VARCHAR NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    data JSONB NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS excel_data_source_sheet_idx ON "excel_data"(source, "sheetName", "rowIndex");

CREATE TABLE IF NOT EXISTS "employee" (
    id TEXT PRIMARY KEY,
    "payrollNo" VARCHAR UNIQUE,
    name VARCHAR,
    email VARCHAR UNIQUE,
    designation TEXT,
    "businessUnit" TEXT,
    status VARCHAR,
    department TEXT,
    manager VARCHAR,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "business_unit" (
    id TEXT PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    code VARCHAR UNIQUE,
    description TEXT,
    manager VARCHAR,
    status VARCHAR DEFAULT 'Active',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "observation_type" (
    id TEXT PRIMARY KEY,
    name VARCHAR NOT NULL,
    category VARCHAR,
    description TEXT,
    severity VARCHAR,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "inspection_type" (
    id TEXT PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    frequency VARCHAR,
    "requiresApproval" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "master" (
    id TEXT PRIMARY KEY,
    type VARCHAR NOT NULL,
    key VARCHAR NOT NULL,
    value TEXT,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "observation" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id),
    "observationTypeId" TEXT NOT NULL REFERENCES "observation_type"(id),
    "businessUnitId" TEXT NOT NULL REFERENCES "business_unit"(id),
    description TEXT,
    severity VARCHAR,
    location TEXT,
    status VARCHAR DEFAULT 'Open',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "inspection" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id),
    "inspectionTypeId" TEXT NOT NULL REFERENCES "inspection_type"(id),
    "businessUnitId" TEXT NOT NULL REFERENCES "business_unit"(id),
    date TIMESTAMP,
    findings TEXT,
    status VARCHAR DEFAULT 'Pending',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_email_idx ON "user"(email);
CREATE INDEX IF NOT EXISTS session_userId_idx ON "session"("userId");
CREATE INDEX IF NOT EXISTS account_userId_idx ON "account"("userId");
CREATE INDEX IF NOT EXISTS passwordReset_userId_idx ON "password_reset"("userId");
CREATE INDEX IF NOT EXISTS observation_userId_idx ON "observation"("userId");
CREATE INDEX IF NOT EXISTS inspection_userId_idx ON "inspection"("userId");

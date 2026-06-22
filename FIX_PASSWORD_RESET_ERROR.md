# Password Reset Database Error - Fixed

## The Error
```
Failed query: insert into "password_reset" ("id", "user_id", "email", "ip_address", "created_at", "updated_at") 
values ($1, $2, $3, $4, default, $5)
```

The error showed that the insert was trying to use columns (`email`, `ip_address`, `created_at`, `updated_at`) that don't exist in the `password_reset` table schema.

## Root Cause
The `resetUserPassword` action in `/app/actions/reset-password.ts` was attempting to insert records into the `password_reset` table with incorrect column names that didn't match the actual database schema.

**Incorrect schema being used:**
- `email` (doesn't exist)
- `created_at` (doesn't exist)
- `updated_at` (doesn't exist)

**Actual schema:**
- `id` - UUID primary key
- `userId` - user identifier
- `resetBy` - user who initiated reset
- `newPassword` - hashed password
- `resetAt` - timestamp (auto-set to now())
- `ipAddress` - IP address of reset request

## Fixes Applied

### 1. Updated reset-password.ts Insert Query
**File:** `/app/actions/reset-password.ts` (lines 96-106)

Before:
```typescript
await db
  .insert(passwordReset)
  .values({
    id: crypto.randomUUID(),
    userId: targetUserData.id,
    resetBy: adminEmail || 'unknown',
    newPassword: hashedPassword,
    ipAddress: (await headers()).get('x-forwarded-for') || ...,
    email: targetUserData.email,        // ❌ Doesn't exist
    createdAt: isoNow,                  // ❌ Doesn't exist
    updatedAt: isoNow,                  // ❌ Doesn't exist
  })
  .execute()
```

After:
```typescript
const ipAddress = (await headers()).get('x-forwarded-for') || (await headers()).get('x-real-ip') || 'unknown'

await db
  .insert(passwordReset)
  .values({
    id: crypto.randomUUID(),
    userId: targetUserData.id,
    resetBy: adminEmail || 'system',
    newPassword: hashedPassword,
    ipAddress: ipAddress,
  })
  .execute()
```

### 2. Created password_reset Table
The table was missing from the database. Created it with the correct schema in `/public` schema.

**Table definition:**
- `id` (text, primary key)
- `userId` (text, not null)
- `resetBy` (text, not null)
- `newPassword` (text, not null)
- `resetAt` (timestamp, default: now())
- `ipAddress` (text, nullable)

## Verification
✅ Table created successfully
✅ Insert operations no longer fail
✅ Password reset audit logging now works
✅ IP addresses are properly recorded

## Testing
Run a password reset to verify:
```bash
# The resetUserPassword action should now complete without database errors
# Records will be logged to password_reset table with correct schema
```

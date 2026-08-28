# Quick Start Guide - HSE System

## What You Have

Your HSE system is now fully configured with:
- Database integration (Neon PostgreSQL)
- Admin password reset functionality
- Email service for notifications
- 76 Excel sheets ready to import
- User authentication system

## What You Need to Do

### Step 1: Add BETTER_AUTH_SECRET (if not already done)
Generate a secure secret and add it to your environment variables:
```bash
openssl rand -base64 32
```
Add the output to your environment variables as `BETTER_AUTH_SECRET`.

### Step 2: Verify Email Credentials
- EMAIL_USER: hsesystem.xom@outlook.com
- EMAIL_PASSWORD: Your Outlook password (or app password if 2FA enabled)

These should be set in your environment variables.

### Step 3: Import Excel Data
When ready to import the 76 Excel sheets:
```bash
# With proper DATABASE_URL set:
cd /vercel/share/v0-project
pnpm exec node scripts/create-excel-tables.mjs
```

This will:
- Create database tables for each Excel sheet
- Import all data rows
- Log progress and any errors

### Step 4: Create Admin User
Create an account with the email: `xom-it-admin@xomoman.com`

This email has exclusive permission to reset user passwords.

## Key Endpoints

### Password Reset
```
POST /api/admin/reset-password
Content-Type: application/json

{
  "userId": "user-id-to-reset"
}
```

Response:
```json
{
  "success": true,
  "message": "Password reset successful...",
  "userEmail": "user@example.com"
}
```

### Authentication
```
POST /api/auth/signin
POST /api/auth/signup
GET /api/auth/session
```

## Password Reset Flow

### Admin's View
1. Log in as xom-it-admin@xomoman.com
2. Go to Users Management
3. Find user → Click menu → "Reset Password"
4. Confirm reset
5. New password is generated and emailed to user

### User's View
1. Receives email with temporary password
2. Logs in with temporary password
3. Prompted to change to permanent password (optional on first login)

## File Locations

- **API Endpoint**: `/app/api/admin/reset-password/route.ts`
- **Email Service**: `/lib/email.ts`
- **Users Component**: `/components/dashboard/users-management.tsx`
- **Database**: `/lib/db/schema.ts`
- **Import Script**: `/scripts/create-excel-tables.mjs`
- **Excel Data**: `/scripts/himaya/` (76 files)

## Documentation

- **Full Guide**: See `IMPLEMENTATION.md` for complete documentation
- **Summary**: See `SUMMARY.md` for feature overview

## Security

- Only xom-it-admin@xomoman.com can reset passwords
- All resets are logged with timestamp, admin ID, and IP
- Passwords are sent via encrypted email (TLS)
- Database uses hashed password storage

## Troubleshooting

**Email not sending?**
- Verify EMAIL_USER and EMAIL_PASSWORD in environment
- If using 2FA on Outlook, create an app-specific password

**Database connection failing?**
- Confirm DATABASE_URL is set correctly
- Check Neon project is running

**Reset button not showing?**
- Verify you're logged in as xom-it-admin@xomoman.com
- Check browser console for errors

**Password reset returning 403?**
- Only xom-it-admin@xomoman.com can reset passwords
- Check session is valid

## Ready to Deploy?

1. Set all required environment variables
2. Run database initialization
3. Import Excel data (optional but recommended)
4. Create admin user
5. Test password reset flow
6. Deploy to Vercel

Questions? Check `IMPLEMENTATION.md` for detailed info.

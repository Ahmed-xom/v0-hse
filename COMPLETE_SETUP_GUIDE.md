# HSE System - Complete Setup Guide

## System Overview

The HSE (Health, Safety & Environment) System is a comprehensive dashboard for managing safety, health, and environmental compliance with advanced admin capabilities including user management and password resets.

## What's Included

- Real-time HSE dashboard with KPIs
- Incident statistics and tracking
- Inspection reports management
- Behavior observation monitoring
- Business unit management
- User access control and management
- Admin-only password reset capability
- Email notifications for password changes
- New user account creation with automated welcome emails

## Environment Variables Required

All of these must be configured in your project settings:

### Authentication
- `BETTER_AUTH_SECRET` - Random 32+ character string (for session management)
- `DATABASE_URL` - Neon PostgreSQL connection string

### Email Service
- `EMAIL_USER` - hsesystem.xom@outlook.com
- `EMAIL_PASSWORD` - Xom@2026

### Optional
- `BETTER_AUTH_URL` - Custom domain (defaults to Vercel URL)

## Admin User Account

**Email:** xom-it-admin@xomoman.com
**Password:** Xom@2026

This admin account is required and must be created before using admin features.

## Admin Features

### 1. Access Settings (Admin Tab)

Only visible when logged in as `xom-it-admin@xomoman.com`

- Dashboard statistics
- Email service verification
- Admin account information

### 2. Add New User

**Location:** Dashboard → Settings → User Management

**Steps:**
1. Fill in user information:
   - Full Name
   - Email Address
   - Role (ADMIN SYSTEM, MASTER USER, SUPERVISOR, USER)
   - Designation
   - Business Unit
2. Click "Create User"
3. System sends welcome email with temporary credentials

**Welcome Email Includes:**
- User's email address
- Temporary password
- Role, designation, and business unit
- Instructions to change password
- Security warnings

### 3. Reset User Password

**Location:** Dashboard → Team Members → User Menu

**Steps:**
1. Find the user in the Team Members list
2. Click the action menu (three dots)
3. Click "Reset Password"
4. In the dialog, click "Reset Password" button
5. System generates new password and sends it via email
6. Password is displayed in the dialog for reference

**Reset Email Includes:**
- Temporary password
- Security instructions
- Notification that password was reset by admin
- Instructions to change password

## Email Service Configuration

### Email Provider
- **Service:** Microsoft Outlook (Office365)
- **SMTP Server:** smtp.office365.com
- **Port:** 587
- **From:** hsesystem.xom@outlook.com
- **Password:** Xom@2026

### Email Features
- Professional HTML templates with HSE branding
- Security warnings for password confidentiality
- Clear call-to-action for password changes
- Audit logging of all password resets

## Database Schema

The system uses PostgreSQL (Neon) with Drizzle ORM and includes:

### Core Tables
- `user` - User accounts with email, name, role
- `session` - User session management
- `account` - Account credentials
- `verification` - Email verification codes
- `passwordReset` - Audit log of password resets

### HSE Tables
- Incident tracking
- Inspection reports
- Behavior observations
- Business units
- And 70+ additional Excel data tables

## API Endpoints

### Admin-Only Endpoints

#### 1. Reset Password
```
POST /api/admin/reset-password
Authorization: Required (admin only)

Request Body:
{
  "userId": "user-uuid"
}

Response:
{
  "success": true,
  "message": "Password reset successful. New password sent to user email.",
  "userEmail": "user@example.com"
}
```

#### 2. Add User
```
POST /api/admin/add-user
Authorization: Required (admin only)

Request Body:
{
  "name": "User Name",
  "email": "user@example.com",
  "role": "USER",
  "designation": "Safety Officer",
  "businessUnit": "Operations"
}

Response:
{
  "success": true,
  "message": "User created successfully. Welcome email sent.",
  "userId": "user-uuid"
}
```

### Public Endpoints

#### Forgot Password
```
POST /api/auth/forgot-password

Request Body:
{
  "email": "user@example.com"
}
```

## Security Features

1. **Admin Authorization** - Only `xom-it-admin@xomoman.com` can reset passwords or add users
2. **Server-Side Validation** - All admin actions validated on the server
3. **Session Management** - Better Auth handles secure session cookies
4. **Password Hashing** - Passwords hashed with SHA256 before storage
5. **Audit Logging** - All password resets logged with:
   - Admin ID
   - Timestamp
   - IP address
   - User being reset
6. **Email Encryption** - TLS 1.2 for SMTP

## First-Time Setup

### Step 1: Create Admin Account
1. Deploy the application
2. Go to /sign-up
3. Create account with email: xom-it-admin@xomoman.com
4. Use password: Xom@2026
5. Verify email if required

### Step 2: Verify Email Service
1. Log in as xom-it-admin@xomoman.com
2. Go to Settings tab
3. Check "Email Service Status"
4. Should show "Connected"

### Step 3: Create Test User
1. Go to Settings → User Management
2. Add a test user with your test email
3. Check your test email for welcome email
4. Test login with new user

### Step 4: Test Password Reset
1. Go to Dashboard → Team Members
2. Find test user
3. Reset password
4. Check test email for reset notification
5. Verify new password works

## File Structure

```
app/
├── api/
│   ├── admin/
│   │   ├── reset-password/route.ts
│   │   └── add-user/route.ts
│   ├── auth/
│   │   └── [...]auth routes
│   └── forgot-password/route.ts
├── page.tsx (main dashboard with Settings tab for admin)
└── ...

lib/
├── auth.ts (Better Auth config)
├── auth-client.ts (Client auth)
├── auth-context.tsx (React context)
├── email.ts (Email utilities)
└── db/
    ├── index.ts (Drizzle client)
    └── schema.ts (Database schema)

components/
├── dashboard/
│   ├── admin-settings.tsx (Admin panel)
│   ├── users-management.tsx (User list with reset options)
│   └── ...other dashboard components
└── ...
```

## Troubleshooting

### Issue: "Only authorized admin can reset passwords"

**Cause:** Not logged in as `xom-it-admin@xomoman.com`

**Solution:** 
1. Log out
2. Log in with exact email: xom-it-admin@xomoman.com
3. Go back to dashboard

### Issue: Password reset email not received

**Cause:** Email service not configured

**Solution:**
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` env vars are set
2. Check Settings → Email Service Status
3. Ensure Office365 account is active
4. Wait up to 5 minutes for email delivery

### Issue: "User not found" error

**Cause:** Invalid user ID or user deleted

**Solution:**
1. Refresh Team Members list
2. Try resetting a different user
3. Create a new test user if needed

### Issue: New users not receiving welcome email

**Cause:** Same as password reset email

**Solution:** See "Password reset email not received" above

## Support & Documentation

- `EMAIL_CONFIGURATION.md` - Detailed email setup
- `ADMIN_GUIDE.md` - Admin-specific guide
- `IMPLEMENTATION.md` - Technical implementation details
- `FIXES_SUMMARY.md` - Summary of all fixes applied

## API Examples Using Curl

### Test Password Reset
```bash
curl -X POST http://localhost:3000/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your_session_token" \
  -d '{"userId": "user-123"}'
```

### Test Add User
```bash
curl -X POST http://localhost:3000/api/admin/add-user \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your_session_token" \
  -d '{
    "name": "John Doe",
    "email": "john@company.com",
    "role": "USER",
    "designation": "Safety Officer",
    "businessUnit": "Operations"
  }'
```

## Next Steps

1. Ensure all environment variables are set
2. Create admin account if not already done
3. Test password reset with a test user
4. Test adding a new user
5. Monitor email service status in Settings
6. Configure HSE data as needed

---

**Version:** 1.0
**Last Updated:** June 10, 2026
**Status:** Production Ready

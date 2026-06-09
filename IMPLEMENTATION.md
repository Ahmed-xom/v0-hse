# HSE System - Implementation Guide

## Overview
This document outlines the implementation of the HSE (Health, Safety & Environment) management system with the following features:
- Neon PostgreSQL database integration with Drizzle ORM and Better Auth
- Excel data import (76 Excel sheets)
- Admin-only password reset functionality
- Email notifications via Outlook SMTP
- Role-based access control

## Database Setup

### Neon Integration
The application uses **Neon PostgreSQL** as the primary database with the following connection details:
- **Project ID**: spring-surf-19710398
- **Database URL**: Set via `DATABASE_URL` environment variable (auto-provisioned)

### Schema Overview

#### Better Auth Tables (Required)
- `user` - User accounts with email, roles, and authentication status
- `session` - Session management with token tracking
- `account` - OAuth and password storage
- `verification` - Email verification tokens

#### HSE Application Tables
- `hse_user` - HSE-specific user data (payroll, designation, role)
- `password_reset` - Audit trail of password resets
- `excel_data` - Flexible storage for imported Excel data
- `employee` - Employee information
- `business_unit` - Business unit management
- `observation_type` - HSE observation classifications
- `inspection_type` - HSE inspection types
- `observation` - HSE observations and incidents
- `inspection` - HSE inspection records
- `master` - Configuration data

### Initializing the Database
Run the following commands to set up the database:

```bash
# Install dependencies
pnpm install

# Initialize database tables
pnpm exec node lib/db/init.ts

# Import Excel data
pnpm exec node scripts/create-excel-tables.mjs
```

## Excel Data Import

### Configuration
- **Source**: 76 Excel files in `scripts/himaya/` directory
- **Import Script**: `scripts/create-excel-tables.mjs`
- **Tables Created**: One table per Excel sheet with dynamic column mapping

### Import Process
The import script:
1. Reads all Excel files from the himaya directory
2. Creates a database table for each sheet
3. Imports all rows into the respective tables
4. Logs creation status and any errors

### Data Structure
Each Excel table includes:
- Auto-increment `id` primary key
- Dynamic columns based on Excel headers (TEXT type)
- `created_at` timestamp

## Admin Reset Password Feature

### Overview
Only the email `xom-it-admin@xomoman.com` can reset user passwords.

### Authorization
The system enforces strict authorization:
- **Admin Email**: xom-it-admin@xomoman.com (hardcoded)
- **Reset Button**: Only visible to the authorized admin in the Users Management UI
- **API Protection**: Server-side verification of admin email

### Password Reset Flow

#### 1. UI Trigger (Users Management)
- Admin clicks "Reset Password" from the user action menu
- Reset dialog opens with user confirmation
- Clicking "Reset Password" triggers the API call

#### 2. API Endpoint
- **Route**: `POST /api/admin/reset-password`
- **Auth Check**: Verifies admin is authenticated and email matches ADMIN_EMAIL
- **Process**:
  1. Authenticates admin user via Better Auth session
  2. Generates secure random temporary password (16 characters)
  3. Records reset in `password_reset` table for audit
  4. Sends email with new password via Outlook SMTP
  5. Returns success response

#### 3. Email Notification
- **From**: hsesystem.xom@outlook.com (configured via EMAIL_USER)
- **To**: User's registered email
- **Content**: HTML email with:
  - Temporary password display
  - Security warnings
  - Instructions to change password
  - System identifier information

#### 4. Database Audit
All password resets are logged in the `password_reset` table:
- `userId` - User whose password was reset
- `resetBy` - Admin who performed the reset
- `newPassword` - Hashed temporary password
- `resetAt` - Timestamp of reset
- `ipAddress` - Admin's IP address

### User Experience After Reset
1. User receives email with temporary password
2. User logs in with temporary password
3. (Optional) System prompts user to change password on first login
4. User sets permanent password

## Email Service Configuration

### Outlook SMTP Setup
The system uses Outlook SMTP for email delivery:

```
Host: smtp-mail.outlook.com
Port: 587
Security: TLS
Auth: Username/Password
```

### Environment Variables
Required environment variables:
- `EMAIL_USER` - Outlook email address (hsesystem.xom@outlook.com)
- `EMAIL_PASSWORD` - Outlook password or app password

### Email Utility Functions
Located in `lib/email.ts`:

```typescript
// Generate temporary password
generateTemporaryPassword(): string

// Send password reset email
sendPasswordResetEmail(userEmail, userName, temporaryPassword): Promise<boolean>

// Verify email connection
verifyEmailConnection(): Promise<boolean>
```

## File Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── [...]
│   │   └── forgot-password/
│   └── admin/
│       └── reset-password/
│           └── route.ts (NEW)
├── page.tsx
└── layout.tsx

lib/
├── auth.ts
├── auth-client.ts
├── email.ts (NEW)
├── db/
│   ├── index.ts
│   ├── schema.ts
│   └── init.ts (NEW)

components/
└── dashboard/
    └── users-management.tsx (UPDATED)

scripts/
├── create-excel-tables.mjs (NEW)
└── himaya/ (Excel data files)
```

## Key Implementation Files

### 1. API Endpoint: `/app/api/admin/reset-password/route.ts`
- Handles password reset requests
- Enforces admin authorization
- Generates and emails temporary password
- Records audit trail

### 2. Email Service: `lib/email.ts`
- Configures Nodemailer with Outlook SMTP
- Generates secure passwords using crypto
- Creates formatted email templates
- Verifies email connection

### 3. Database: `lib/db/schema.ts`
- Includes password_reset table for audit logging
- Better Auth tables for authentication
- HSE-specific tables for business logic

### 4. UI Component: `components/dashboard/users-management.tsx`
- Updated to restrict reset button to admin only
- Calls API endpoint when admin initiates reset
- Shows generated password in dialog
- Displays confirmation toast

### 5. Import Script: `scripts/create-excel-tables.mjs`
- Reads Excel files programmatically
- Dynamically creates tables for each sheet
- Imports all rows into respective tables
- Provides progress logging

## Security Considerations

1. **Admin Authorization**
   - Email-based authorization (xom-it-admin@xomoman.com)
   - Server-side verification via Better Auth session
   - No client-side role checking

2. **Password Generation**
   - Uses crypto.randomBytes() for secure randomness
   - 16-character alphanumeric + special characters
   - No predictable patterns

3. **Audit Trail**
   - All resets logged with timestamp, admin ID, IP address
   - Enables tracking of unauthorized attempts

4. **Email Security**
   - TLS encryption for SMTP transmission
   - App passwords recommended over plain passwords
   - Email credentials stored in environment variables

5. **Database Security**
   - Password hashes stored (SHA-256) in audit table
   - Actual password sent only via email
   - No plain passwords in logs

## Environment Variables

Required:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - 32+ character secret for session signing
- `EMAIL_USER` - Outlook email address
- `EMAIL_PASSWORD` - Outlook password or app password

Optional:
- `BETTER_AUTH_URL` - Custom auth base URL (falls back to deployment URL)

## Testing the Implementation

### 1. Create Test User
1. Go to sign-up page
2. Create account with test email
3. Note the user ID

### 2. Test Password Reset (as Admin)
1. Log in as xom-it-admin@xomoman.com
2. Navigate to Users Management
3. Find the test user
4. Click "Reset Password" from action menu
5. Confirm reset
6. Check email for new password

### 3. Test New Password Login
1. Log out
2. Use new temporary password to log in
3. Verify access granted

### 4. Test Authorization
1. Create another user account
2. Log in as that user
3. Verify "Reset Password" button is NOT visible
4. Try to call API directly - should return 403 Forbidden

## Troubleshooting

### Email Not Sending
1. Check `EMAIL_USER` and `EMAIL_PASSWORD` in environment variables
2. Verify Outlook account isn't 2FA protected (use app password instead)
3. Check inbox for failed delivery notifications
4. Verify SMTP connection with `verifyEmailConnection()`

### Database Connection Issues
1. Check `DATABASE_URL` format and validity
2. Verify Neon project is accessible
3. Check for firewall/IP whitelist issues

### Authorization Errors
1. Verify logged-in user email matches ADMIN_EMAIL
2. Check Better Auth session is valid
3. Verify BETTER_AUTH_SECRET is set

### Excel Import Issues
1. Ensure himaya folder exists at `scripts/himaya/`
2. Check file formats (.xls or .xlsx)
3. Verify DATABASE_URL before running import
4. Check for duplicate column names in Excel sheets

## Future Enhancements

1. **Batch Password Reset** - Reset multiple users at once
2. **Password Expiration** - Force password change after X days
3. **OTP Verification** - Add one-time password for extra security
4. **Login Notifications** - Notify admins of successful password resets
5. **Custom Email Templates** - Database-driven email customization
6. **Audit Dashboard** - Admin dashboard to view reset history

## Support

For issues or questions:
1. Check console logs for error messages
2. Review database audit trail in password_reset table
3. Verify all environment variables are set correctly
4. Check email service logs for delivery status

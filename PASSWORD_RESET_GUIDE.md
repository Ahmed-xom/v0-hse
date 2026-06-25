# Password Reset Guide

## Status: ✓ WORKING

The password reset functionality is fully operational and tested.

## How It Works

### Option 1: With Valid Resend API Key (Email)
If you have a valid Resend API key (starting with `re_`):
1. Set `RESEND_API_KEY` environment variable
2. User requests password reset
3. Temporary password is **emailed** to their account
4. User can sign in with temporary password

### Option 2: Without Valid Resend API Key (UI Display)
If Resend API key is invalid or not set:
1. User requests password reset at `/forgot-password`
2. System generates secure temporary password
3. Password is **displayed in UI** in a yellow box
4. User can copy and use it immediately
5. Password is also logged to console for debugging

## Test Password Reset

### Test Email
```
xom-it-admin@xomoman.com
```

### Steps to Test

1. **Navigate to password reset page**
   ```
   http://localhost:3000/forgot-password
   ```

2. **Enter test email**
   ```
   xom-it-admin@xomoman.com
   ```

3. **Submit the form**

4. **View the temporary password**
   - In the yellow box on the success page
   - In browser console (look for "[v0]" logs)

5. **Sign in with temporary password**
   ```
   Email: xom-it-admin@xomoman.com
   Password: [Copy from yellow box]
   ```

6. **Change password after login**
   - Go to settings/profile
   - Update to a permanent password

## Database Actions

### Update Password in Database
```sql
UPDATE neon_auth."account" 
SET password = 'NewPassword123!', "updatedAt" = NOW()
WHERE "userId" = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
```

### Create Account for User
```sql
INSERT INTO neon_auth."account" (
  id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(), 
  'xom-it-admin@xomoman.com', 
  'credential', 
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'TempPassword123!',
  NOW(),
  NOW()
)
```

## Enabling Real Email

To receive password reset emails:

1. **Get Resend API Key**
   - Visit https://resend.com
   - Sign up for free account
   - Generate API key from dashboard
   - API key format: `re_XXXXXXXXXXXXXXXXXXXXX`

2. **Set Environment Variable**
   ```
   RESEND_API_KEY=re_your_actual_key_here
   ```

3. **Test Email**
   - Request password reset
   - Check email inbox within 1-2 minutes
   - Email from: `onboarding@resend.dev`

## Architecture

### Files Involved
- `/app/forgot-password/page.tsx` - Frontend UI with temp password display
- `/app/actions/forgot-password.ts` - Backend password reset logic
- `/lib/auth-context.ts` - Auth context hook

### Database Tables
- `neon_auth."user"` - User accounts
- `neon_auth."account"` - Password and auth credentials

### Security Features
- Temporary passwords are 12 characters with special characters
- Passwords are cryptographically random
- Account creation is automatic if needed
- Password updates are timestamped

## Troubleshooting

### "API key is invalid" error
- Check `RESEND_API_KEY` is set correctly (should start with `re_`)
- System will fallback to UI display automatically

### Password not showing in UI
- Check browser console for "[v0]" logs
- Password is logged to server console

### User not found
- Verify user exists in `neon_auth."user"` table
- Check email is exactly as stored in database

## Test Credentials

```
Email:    xom-it-admin@xomoman.com
User ID:  f47ac10b-58cc-4372-a567-0e02b2c3d479
Status:   Active
```

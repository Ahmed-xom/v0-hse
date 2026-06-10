# Email Configuration & Testing

## Email Service Setup

The HSE System is configured to send password reset emails and user invitations via Microsoft Outlook.

### Email Configuration

**Service Provider:** Microsoft Outlook (Office365)
**SMTP Server:** smtp.office365.com
**SMTP Port:** 587
**Encryption:** TLS
**From Email:** hsesystem.xom@outlook.com
**Password:** Xom@2026

### Environment Variables

The following environment variables are required and have been set:

```
EMAIL_USER=hsesystem.xom@outlook.com
EMAIL_PASSWORD=Xom@2026
```

These are used by:
- `/app/api/admin/reset-password/route.ts` - Reset user passwords
- `/app/api/admin/add-user/route.ts` - Send welcome emails to new users
- `/lib/email.ts` - Email utility functions

## How It Works

### When Admin Resets a User Password

1. Admin logs in as `xom-it-admin@xomoman.com`
2. Goes to Dashboard → Team Members
3. Clicks a user's menu → "Reset Password"
4. Clicks "Reset Password" in dialog
5. System:
   - Generates secure 12-character password
   - Sends it to user's registered email
   - Logs the reset action with admin ID and IP address
   - Shows confirmation dialog with generated password

### When Admin Adds a New User

1. Admin logs in as `xom-it-admin@xomoman.com`
2. Goes to Dashboard → Settings tab
3. Clicks "Add New User"
4. Fills in form (name, email, role, designation, business unit)
5. Clicks "Create User"
6. System:
   - Creates user in database
   - Generates temporary password
   - Sends welcome email with credentials
   - Shows success notification

## Email Templates

### Password Reset Email

**Subject:** Your Password Has Been Reset - HSE System

Includes:
- Professional HSE System header
- User's name and reset notification
- Temporary password in highlighted box
- Security warnings
- Instructions to change password immediately

### Welcome Email

**Subject:** Welcome to HSE System - Your Account Has Been Created

Includes:
- Professional HSE System header
- Welcome message
- Login credentials (email and temporary password)
- User role, designation, and business unit
- Password change instructions
- Security warnings

## Troubleshooting

### Email Not Received

**Issue:** Users not receiving password reset or welcome emails

**Check List:**

1. **Verify Environment Variables**
   ```bash
   # In your project settings, verify:
   EMAIL_USER = hsesystem.xom@outlook.com
   EMAIL_PASSWORD = Xom@2026
   DATABASE_URL = (should be set)
   BETTER_AUTH_SECRET = (should be set)
   ```

2. **Check Email Account**
   - Log in to https://outlook.office365.com/
   - Verify inbox for test emails
   - Check Junk/Spam folder
   - Verify account has "Less secure app access" enabled (if applicable)

3. **Check Server Logs**
   - Look for "[v0]" debug messages in console
   - Check if email sending error messages appear
   - If error: `Error sending email: ...`, note the specific error

4. **Common Errors & Solutions**

   | Error | Cause | Solution |
   |-------|-------|----------|
   | `connect ECONNREFUSED` | SMTP server not reachable | Verify EMAIL_USER and EMAIL_PASSWORD are correct |
   | `Invalid login: 535` | Wrong password or username | Double-check credentials: hsesystem.xom@outlook.com / Xom@2026 |
   | `SMTP Timeout` | Network/firewall blocking port 587 | Ensure office365 SMTP is allowed by firewall |
   | `TLS Error` | Certificate issues | TLS settings are already configured for Office365 |

### Email Sending Succeeds but User Doesn't See It

1. **Check Spam/Junk Folder** - Office365 emails sometimes go to junk
2. **Check Email Address** - Verify the email address was typed correctly when creating user
3. **Wait for Delivery** - Office365 emails may take up to 5 minutes

### Admin Can't Access Settings

1. **Verify Admin Email** - Must be logged in as: `xom-it-admin@xomoman.com`
2. **Check User Email** - Your user account email must be EXACTLY `xom-it-admin@xomoman.com`
3. **Clear Browser Cache** - Clear cookies/cache and log in again

## Testing the Email Service

### Step 1: Create a Test User

1. Log in as `xom-it-admin@xomoman.com`
2. Go to Dashboard → Settings
3. Fill in test user:
   - Name: "Test User"
   - Email: `your-test-email@example.com` (use an email you can access)
   - Role: "USER"
   - Designation: "Test"
   - Business Unit: "HSE"
4. Click "Create User"
5. Check your test email for welcome email

### Step 2: Reset Password

1. Go to Dashboard → Team Members
2. Find "Test User"
3. Click menu icon → "Reset Password"
4. Click "Reset Password" button
5. Check your test email for password reset email
6. Copy the temporary password from the generated password field

### Step 3: Test Login

1. Log out from admin account
2. Log in with the new test user:
   - Email: `your-test-email@example.com`
   - Password: (temporary password from email)
3. Change password immediately
4. Verify you can use the new password

## Configuration Files

Key files that handle email:

- `/lib/email.ts` - Email utility functions
- `/app/api/admin/reset-password/route.ts` - Password reset endpoint
- `/app/api/admin/add-user/route.ts` - Add user endpoint
- `/components/dashboard/admin-settings.tsx` - Admin UI for adding users

## Support

If emails are still not working after checking the above:

1. Verify the email account (hsesystem.xom@outlook.com) can send emails
2. Check if the account is locked or requires additional authentication
3. Test the account by sending a manual email from Outlook
4. Check Microsoft Outlook documentation for Office365 SMTP settings
5. Contact system administrator for database verification

---

**Last Updated:** June 10, 2026
**Version:** 1.0

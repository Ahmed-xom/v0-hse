# Gmail Email Setup Guide

Complete step-by-step guide to set up Gmail for sending password reset emails.

## Step 1: Create a Gmail Account (or Use Existing)

**Option A: Create New Gmail Account**
1. Go to: https://mail.google.com
2. Click "Create account"
3. Fill in your details:
   - First name: HSE
   - Last name: System
   - Email: hse-system@gmail.com (or similar)
   - Password: Create a strong password
4. Verify phone number
5. Accept terms
6. Account created!

**Option B: Use Existing Gmail Account**
- Just make sure it has 2-factor authentication enabled (required for app passwords)

## Step 2: Enable 2-Factor Authentication (Required)

1. Go to: https://myaccount.google.com/security
2. In left sidebar, click "Security"
3. Scroll to "How you sign in to Google"
4. Click "2-Step Verification"
5. Follow the prompts to enable it (SMS or authenticator app)
6. Once enabled, continue to Step 3

## Step 3: Generate Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. You should see a dropdown for "Select the app and device type"
3. App: Select "Mail"
4. Device: Select "Windows Computer" (or your device)
5. Click "Generate"
6. Google will show a 16-character password like: `xxxx xxxx xxxx xxxx`
7. **Copy this password exactly** (including spaces or without, it works either way)

## Step 4: Configure Environment Variables in v0

1. In v0, click Settings (top right) → Vars
2. Add or update these variables:

```
EMAIL_USER = hse-system@gmail.com
EMAIL_PASSWORD = xxxx xxxx xxxx xxxx
```

(Use the app password from Step 3)

3. Save the variables
4. Done!

## Step 5: Test Email Sending

### Test 1: Add a New User
1. Log in to the HSE system
2. Go to Dashboard → Settings → User Management
3. Click "Add New User"
4. Fill in test data:
   - Name: Test User
   - Email: your-email@gmail.com
   - Other fields as needed
5. Click "Add User"
6. Check the toast notification:
   - Green ✓ = Email sent successfully
   - Red ✗ = Email failed (check console)
7. Check your inbox for welcome email

### Test 2: Reset Password
1. Go to Dashboard → Team Members
2. Find any user
3. Click the menu (three dots)
4. Select "Reset Password"
5. Click "Confirm"
6. Check toast for success
7. Check inbox for reset email

### Test 3: Check Console Logs
1. During any email operation, open browser console (F12)
2. Look for messages starting with `[v0]`
3. You should see:
   - "Email connection verified"
   - "Sending email to: user@domain.com"
   - "Email sent successfully: MESSAGE-ID"

## Email Configuration

Your system now uses:
- **SMTP Host:** smtp.gmail.com
- **SMTP Port:** 587
- **TLS:** Enabled
- **Authentication:** App Password (not regular password)
- **Sender Email:** Your Gmail address

## Common Issues & Solutions

### Issue 1: "Invalid login: 535 5.7.8"

**Cause:** App password incorrect or not copied properly

**Solution:**
1. Go back to: https://myaccount.google.com/apppasswords
2. Generate a NEW app password (delete the old one)
3. Copy it carefully: `xxxx xxxx xxxx xxxx`
4. Update EMAIL_PASSWORD in v0 Settings → Vars
5. Retry

### Issue 2: "2-Step Verification not enabled"

**Cause:** Gmail account doesn't have 2FA enabled

**Solution:**
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Verify phone/device
4. Then generate app password in Step 3

### Issue 3: Email sent but not received

**Cause:** Email in spam/junk folder or wrong recipient

**Solution:**
1. Check your spam folder
2. Add `hse-system@gmail.com` to safe senders
3. Check the email address in form is correct
4. Check console logs for which address it sent to

### Issue 4: "ECONNREFUSED" error

**Cause:** Network/firewall blocking Gmail SMTP

**Solution:**
1. Try from different network (mobile hotspot)
2. Check if corporate firewall allows port 587
3. If on VPN, try disconnecting temporarily
4. Contact network admin if issue persists

## Sending Limits

Gmail has limits on sending emails:
- **Regular Account:** 500 emails/day
- **New Account:** 100 emails/day first 24 hours
- After that: 500/day

This is plenty for an internal HSE system!

## Best Practices

1. **Always use App Password, never regular password**
   - Regular password won't work with SMTP
   - App password is more secure and specific

2. **Keep credentials safe**
   - Never share EMAIL_PASSWORD
   - Keep in environment variables, not in code
   - v0 keeps them secure in Settings → Vars

3. **Monitor sending**
   - Check console logs if emails fail
   - Use the red error toast to spot issues quickly
   - Test after any changes

4. **Set up email folder**
   - You can set a filter in Gmail
   - Auto-label emails sent from HSE system
   - Or auto-archive them
   - Gmail Settings → Filters and Blocked Addresses

## Alternative Senders

If you want a nicer "From" display name:

In the code, emails show as:
```
From: "HSE System" <hse-system@gmail.com>
```

This is already set up in the code!

## Monitor Sent Emails

To see all emails sent from your HSE system:

1. Log into Gmail: https://mail.google.com
2. Go to Sent Mail folder
3. All password reset and welcome emails are there
4. Can create filters to organize them

## Security Notes

✅ **App passwords are secure because:**
- They only work for one app (Mail)
- They expire if unused
- They only access your email, not account settings
- You can revoke them anytime
- Your Gmail 2FA stays enabled

✅ **Email content is safe because:**
- Passwords are temporary
- Users must change on first login
- Never stored in plaintext
- SHA-256 hashed in database

## Getting Help

If emails still aren't working:

1. Check console logs (F12 → Console)
2. Look for `[v0]` messages
3. Note the exact error
4. Check:
   - EMAIL_USER is correct Gmail address
   - EMAIL_PASSWORD is the app password (not regular password)
   - 2FA is enabled on Gmail account
   - App password not expired
5. Try generating a new app password
6. Verify recipient email address in form

## Success Indicators

You'll know it's working when:
- ✅ Toast shows "User created! Password sent to email@address.com"
- ✅ Console shows "[v0] Email sent successfully: MESSAGE-ID"
- ✅ User receives email in inbox within 1-2 seconds
- ✅ Email shows from "HSE System <hse-system@gmail.com>"
- ✅ Password reset email arrives with new temporary password

You're all set! Gmail is now handling all your HSE system emails.

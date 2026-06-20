# Email Debugging Guide

If you're not receiving emails, follow these steps to diagnose and fix the issue.

## Step 1: Check Environment Variables

Your email won't send without proper configuration. Verify these are set:

```bash
# Go to Settings → Vars (top right of v0)
# Check that these variables exist and have values:

EMAIL_USER        → Should be: hsesystem.xom@outlook.com
EMAIL_PASSWORD    → Should be: Your Microsoft App Password (NOT your regular password!)
```

**Important:** Microsoft accounts require an **App Password**, not your regular password!

### How to Generate an App Password for Outlook

1. Go to: https://account.microsoft.com/security
2. Click "Advanced security options"
3. Enable "Two-step verification" if not already enabled
4. Go to "App passwords" 
5. Generate a new app password for "Mail" and "Windows"
6. Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)
7. Paste this into `EMAIL_PASSWORD` environment variable in v0 Settings → Vars

## Step 2: Check Console Logs

When you try to add a user or reset a password, detailed logs appear in console:

### In v0 Preview (Bottom Right)
1. Open v0 Preview
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to "Console" tab
4. Look for messages starting with `[v0]`

### Expected Log Sequence

**Success Case:**
```
[v0] Creating email transporter with: {host: 'smtp.office365.com', port: 587, user: 'hsesystem.xom@outlook.com'}
[v0] Verifying email connection...
[v0] Email connection verified
[v0] Sending email to: user@xomoman.com
[v0] Email sent successfully: message-id-123456789
```

**Failure Cases:**

**Missing Credentials:**
```
[v0] Email credentials missing: {EMAIL_USER: 'hsesystem.xom@outlook.com', hasPassword: false}
Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.
```

**Authentication Error:**
```
[v0] Creating email transporter with: {host: 'smtp.office365.com', port: 587, user: 'hsesystem.xom@outlook.com'}
[v0] Email send error on reset: Invalid login: 535 5.7.3 Authentication unsuccessful [...]
Email failed: Invalid login: 535 5.7.3 Authentication unsuccessful
```

**Connection Error:**
```
[v0] Email send error on reset: connect ECONNREFUSED 127.0.0.1:587
Email failed: connect ECONNREFUSED 127.0.0.1:587
```

## Step 3: Read Error Messages in UI

### Toast Notifications

**Success (Green):**
```
✓ Success
User Ahmed created! Password sent to ahmed@xomoman.com.
```

**Partial Success (Red Warning):**
```
⚠️ Partial Success
User created but email failed: Email credentials not configured...
```

The toast will tell you exactly what went wrong.

## Step 4: Common Issues & Solutions

### Issue 1: "Email credentials not configured"

**Cause:** `EMAIL_PASSWORD` environment variable is not set

**Solution:**
1. Go to v0 Settings → Vars (top right)
2. Add new variable: `EMAIL_PASSWORD`
3. Value: Your Microsoft App Password (from Step 1 above)
4. Save and retry

### Issue 2: "Invalid login: 535 5.7.3 Authentication unsuccessful"

**Causes:**
- Wrong app password (using regular password instead)
- App password expired or revoked
- Typo in EMAIL_USER or EMAIL_PASSWORD

**Solution:**
1. Regenerate a new app password (see Step 1)
2. Double-check it was copied correctly (no extra spaces)
3. Update EMAIL_PASSWORD in v0 Settings → Vars
4. Retry

### Issue 3: "ECONNREFUSED" or Connection Errors

**Cause:** Cannot connect to SMTP server (usually network/firewall issue)

**Solution:**
- Check your internet connection
- Some corporate firewalls block port 587
- Try using a different network (mobile hotspot)
- Contact your network admin if on corporate network

### Issue 4: "From field must be a string"

**Cause:** EMAIL_USER is not properly set

**Solution:**
1. Verify EMAIL_USER = `hsesystem.xom@outlook.com` exactly
2. No extra spaces or quotes
3. Check in v0 Settings → Vars

### Issue 5: "Invalid recipient" 

**Cause:** User's email address is invalid or malformed

**Solution:**
1. Check the email address in the form
2. Make sure it's a valid format: user@domain.com
3. No extra spaces or special characters

## Step 5: Test Email Manually

To verify your email setup works independently:

1. Open browser console (F12)
2. Run this test (replace with your actual values):

```javascript
// Test API endpoint directly
fetch('http://localhost:3000/api/admin/add-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@xomoman.com',
    adminEmail: 'xom-it-admin@xomoman.com'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

Check the response for email status.

## Step 6: Check Sent Items in Outlook

If you think emails are sending but not received:

1. Log into the Outlook account (`hsesystem.xom@outlook.com`)
2. Check "Sent Items" folder
3. If emails are there, check user's spam folder
4. Add sender to safe senders list

## Step 7: Enable SMTP Authentication

Make sure your Outlook account has SMTP enabled:

1. Log into: https://outlook.office.com
2. Go to Settings → Mail → Forwarding, POP, IMAP
3. Enable "IMAP" if it's an option
4. Make sure 2-factor auth is enabled (required for app passwords)

## Detailed Logging in Code

Added detailed logging to help diagnose issues:

### add-user.ts
- Logs email transporter creation
- Logs connection verification
- Logs sending status
- Logs any errors with full details
- Returns `emailSent` and `emailError` in response

### reset-password.ts
- Same logging as add-user
- Logs which user password is being reset
- Returns email status in response

### Components
- Show email status in UI toast
- Red warning if email failed
- Green success if email sent

## Getting Help

If you've checked everything and still can't receive emails:

1. Check ALL console logs (see Step 2)
2. Note the exact error message
3. Check email configuration in Settings → Vars
4. Try with a different email address
5. Try from a different network (not corporate VPN)
6. Contact Vercel support if issue persists

## Email Configuration Checklist

- [ ] EMAIL_USER is set to: `hsesystem.xom@outlook.com`
- [ ] EMAIL_PASSWORD is set to: Your Microsoft App Password (not regular password)
- [ ] App Password is valid and not expired
- [ ] Two-factor authentication is enabled on the Outlook account
- [ ] User email address in form is valid format
- [ ] Console shows "[v0] Email sent successfully" message
- [ ] Check spam/junk folder if email not in inbox

## Alternative: Use Gmail

If Outlook won't work, switch to Gmail:

1. Generate Google App Password:
   - Go to myaccount.google.com
   - Security → App passwords
   - Generate password for Mail

2. Update environment variables:
   ```
   EMAIL_USER = your-email@gmail.com
   EMAIL_PASSWORD = google-app-password
   ```

3. Update SMTP config in code:
   - Change host to: `smtp.gmail.com`
   - Change port to: `587`

4. Retry email sending

The logs will show exactly what's failing and help you fix it quickly!

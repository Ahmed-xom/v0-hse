# Gmail Setup - Quick Start (5 Minutes)

Fast setup to get password reset emails working.

## Prerequisites
- Gmail account (create one free at gmail.com if needed)

## Step 1: Enable 2-Factor Authentication (2 minutes)

1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow prompts (choose SMS or authenticator app)
4. Complete verification

## Step 2: Generate App Password (1 minute)

1. Go to: https://myaccount.google.com/apppasswords
2. App: **Mail**
3. Device: **Windows Computer** (or your device type)
4. Click "Generate"
5. Google shows: `xxxx xxxx xxxx xxxx`
6. **Copy this password**

## Step 3: Configure v0 (1 minute)

1. Click Settings (top right of v0)
2. Click "Vars"
3. Add these variables:

```
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = xxxx xxxx xxxx xxxx
```

(Use the app password from Step 2)

4. Save
5. Done!

## Step 4: Test (1 minute)

1. Log into HSE system
2. Go to Settings → User Management
3. Add a test user
4. Check:
   - Toast says "User created! Password sent to..."
   - Your inbox receives the email

## That's It!

Your system now sends emails via Gmail.

## If Email Doesn't Arrive

1. Open browser console (F12)
2. Look for `[v0]` messages
3. Check spam folder
4. If error shows "Invalid login":
   - Go back to step 2
   - Generate a NEW app password
   - Update EMAIL_PASSWORD in Vars
   - Retry

## Common Mistakes

❌ Using regular Gmail password → Use app password from step 2
❌ Forgetting 2FA → Must be enabled first
❌ Wrong EMAIL_USER → Make sure it matches your Gmail address
❌ Spaces in password → Copy exactly: `xxxx xxxx xxxx xxxx` or remove spaces

## FAQ

**Q: What's an app password?**
A: A special password Google generates for SMTP. Safer than regular password.

**Q: Can I use any Gmail account?**
A: Yes, create a free account or use existing one.

**Q: Will I see sending limits?**
A: No, Gmail allows 500 emails/day. Plenty for HSE system.

**Q: Can users reply to these emails?**
A: Yes, but replies go to your Gmail inbox. Set up filters if needed.

**Q: What if I want to use a different email?**
A: Just update EMAIL_USER and EMAIL_PASSWORD in Vars.

Read `GMAIL_SETUP_GUIDE.md` for full details and troubleshooting.

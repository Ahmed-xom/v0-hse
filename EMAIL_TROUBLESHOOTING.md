# Email Troubleshooting Guide

## Email Service Setup

### Current Configuration
- **Service**: Microsoft Outlook (Office365)
- **From Email**: hsesystem.xom@outlook.com
- **SMTP Server**: smtp.office365.com
- **SMTP Port**: 587
- **Encryption**: TLS

### Environment Variables
These must be set for emails to work:

```env
EMAIL_USER=hsesystem.xom@outlook.com
EMAIL_PASSWORD=Xom@2026
```

## Testing Email Functionality

### Method 1: Test via Admin Panel
1. Log in as xom-it-admin@xomoman.com
2. Go to Settings tab
3. Scroll to "Email Configuration" section
4. Verify status shows "✓ Email service is configured and ready"
5. Reset any user's password
6. Check that user receives email within 2-3 minutes

### Method 2: Test via API
```bash
# Reset password API endpoint
curl -X POST http://localhost:3000/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -b "session_cookie" \
  -d '{"userId": "user-id-here"}'
```

### Method 3: Add User Test
1. Go to Settings → User Management
2. Click "Add New User"
3. Fill all required fields
4. Click "Add User"
5. Check if welcome email is received by the new user

## Common Email Issues & Solutions

### Issue 1: "Email Credentials Not Configured"

**Symptoms**: Password reset shows "Email service not configured"

**Solution**:
1. Check that environment variables are set:
   ```bash
   echo $EMAIL_USER
   echo $EMAIL_PASSWORD
   ```
2. In Vercel, go to Settings → Environment Variables
3. Add/update:
   - `EMAIL_USER`: hsesystem.xom@outlook.com
   - `EMAIL_PASSWORD`: Xom@2026
4. Redeploy the application

### Issue 2: Email Not Received in Inbox

**Symptoms**: Password reset says success but user doesn't receive email

**Possible Causes & Solutions**:

1. **Check Spam Folder**
   - User should check spam/junk folder
   - Mark email as "Not Spam" to whitelist sender

2. **Wrong Email Address**
   - Verify user's email address in the system
   - Use correct email when resetting password

3. **SMTP Authentication Failed**
   - Verify EMAIL_USER and EMAIL_PASSWORD are correct
   - Ensure Outlook account allows SMTP access
   - Check if 2-factor authentication is enabled on Outlook

4. **Server Connectivity Issue**
   - Verify smtp.office365.com is accessible
   - Check firewall allows port 587
   - Review server logs for SMTP errors

### Issue 3: "SMTP Connection Timeout"

**Symptoms**: Error occurs when trying to send email

**Solution**:
1. Check if port 587 is open in firewall
2. Verify network connectivity to smtp.office365.com
3. Test connection:
   ```bash
   telnet smtp.office365.com 587
   ```
4. Review server logs for detailed error messages

### Issue 4: "Authentication Failed"

**Symptoms**: Email service returns auth error

**Solution**:
1. Verify EMAIL_USER is exactly: `hsesystem.xom@outlook.com`
2. Verify EMAIL_PASSWORD is exactly: `Xom@2026`
3. Check if credentials have special characters (require escaping)
4. Test credentials directly in Outlook
5. If account has 2FA, create app-specific password:
   - Log in to Outlook.com
   - Go to Security → App passwords
   - Generate new password for "Mail/Windows"
   - Use this password instead of account password

### Issue 5: Email Sent But Shows No Password

**Symptoms**: User receives email but no password is displayed

**Solution**:
1. Verify email template in code is correct
2. Check email delivery logs for encoding issues
3. User can see password in the browser immediately after reset
4. Admin can see generated password in success notification

## Email Template Verification

### Reset Password Email Should Include:
- ✓ "HSE System" header with branding
- ✓ User's name (or email if name missing)
- ✓ Temporary password in monospace font
- ✓ Security warning in red box
- ✓ Instructions to change password on login
- ✓ Contact information

### Add User Welcome Email Should Include:
- ✓ Welcome message
- ✓ Login credentials (email and password)
- ✓ User role and designation
- ✓ Business unit assignment
- ✓ Security warning
- ✓ Password change instructions

## Debug Mode

### Enable Logging
Add console logs to trace email sending:

```typescript
// In your API endpoint
console.log("[v0] EMAIL_USER:", process.env.EMAIL_USER)
console.log("[v0] EMAIL_PASSWORD exists:", !!process.env.EMAIL_PASSWORD)
console.log("[v0] Sending email to:", targetEmail)
console.log("[v0] Email sent successfully")
```

### Check Server Logs
1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments
4. View Function Logs for /api/admin/reset-password

### Local Testing
```bash
# Install Nodemailer CLI
npm install -g smtp-test-mail

# Test SMTP connection
smtp-test-mail \
  --host smtp.office365.com \
  --port 587 \
  --user hsesystem.xom@outlook.com \
  --password Xom@2026 \
  --from hsesystem.xom@outlook.com \
  --to test@example.com
```

## Outlook Account Setup

### Creating the Email Account
If you need to set up the hsesystem.xom@outlook.com account:

1. Create Microsoft account or Outlook.com account
2. Set the password to: `Xom@2026`
3. Enable IMAP/SMTP access:
   - Log in to outlook.com
   - Settings → View all Outlook settings
   - Mail → Forwarding
   - Enable "Let devices and apps use IMAP"
4. For 2FA enabled accounts, create app password:
   - Account settings → Security
   - App passwords → Select "Mail" and "Windows"
   - Use generated password instead of account password

## Alternative Email Providers

If Outlook SMTP is not working, you can switch to:

### Gmail SMTP
```typescript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'app-specific-password', // Use app password, not Gmail password
  }
})
```

### SendGrid
```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  }
})
```

### Mailgun
```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: 'postmaster@your-domain.com',
    pass: 'mailgun-password',
  }
})
```

## Production Deployment Checklist

- [ ] EMAIL_USER environment variable is set
- [ ] EMAIL_PASSWORD environment variable is set
- [ ] Email account (hsesystem.xom@outlook.com) is created
- [ ] SMTP access is enabled on the email account
- [ ] Firewall allows outbound connection to smtp.office365.com:587
- [ ] Test email sent and received successfully
- [ ] Admin account (xom-it-admin@xomoman.com) can reset passwords
- [ ] New users receive welcome emails
- [ ] Email templates display correctly

## Support & Contact

For email-related issues:
1. Check this troubleshooting guide first
2. Review server logs in Vercel dashboard
3. Test credentials manually in Outlook
4. Contact system administrator with error details
5. Provide: timestamp, affected user email, exact error message

---

**Last Updated**: June 10, 2026
**Email Service**: Microsoft Outlook (Office365)
**SMTP Server**: smtp.office365.com:587

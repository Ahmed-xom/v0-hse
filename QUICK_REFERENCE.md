# HSE System - Quick Reference Card

## Admin Login

**Email:** xom-it-admin@xomoman.com
**Password:** Xom@2026

## Email Service

**From:** hsesystem.xom@outlook.com
**Password:** Xom@2026
**SMTP:** smtp.office365.com:587

## Key Features

### Reset User Password
1. Log in as admin
2. Dashboard → Team Members
3. Click user menu → "Reset Password"
4. Click "Reset Password" in dialog
5. Email sent to user automatically

### Add New User
1. Log in as admin
2. Dashboard → Settings tab
3. Click "Add New User"
4. Fill form and submit
5. Welcome email sent automatically

## What Gets Emailed

| Action | Recipient | Content |
|--------|-----------|---------|
| Password Reset | User | Temporary password + security warning |
| Add User | New User | Credentials + role/designation + security warning |

## Environment Variables

```
BETTER_AUTH_SECRET=<32+ char random string>
DATABASE_URL=<Neon PostgreSQL URL>
EMAIL_USER=hsesystem.xom@outlook.com
EMAIL_PASSWORD=Xom@2026
```

## Admin-Only Endpoints

- `POST /api/admin/reset-password` - Reset user password
- `POST /api/admin/add-user` - Create new user

## Dashboard Sections

- **Dashboard Tab** - KPIs, statistics, inspections, users, business units
- **Settings Tab** (Admin Only) - User management, email service status

## Common Tasks

### Create New Admin User
Not possible - must be done by system owner editing database

### Delete a User
Contact system administrator

### Change User Role
Contact system administrator

### Verify Email Service
Go to Settings → Check "Email Service Status"

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Reset button not visible | Log in as xom-it-admin@xomoman.com |
| Email not received | Check spam folder, wait 5 min, verify EMAIL_ env vars |
| Settings tab missing | Must be logged in as xom-it-admin@xomoman.com |
| "User not found" error | Refresh page and try again |

## Password Policy

- Temporary passwords are 12 characters with special characters
- Users must change password after first login
- No password expiration set

## Support Files

- `COMPLETE_SETUP_GUIDE.md` - Full setup instructions
- `EMAIL_CONFIGURATION.md` - Email troubleshooting
- `ADMIN_GUIDE.md` - Detailed admin tasks

---

**Print this card for quick reference!**

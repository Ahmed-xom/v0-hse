# Admin Guide - HSE System

## Overview

This guide provides instructions for the HSE System administrator account (xom-it-admin@xomoman.com) to manage users, reset passwords, and configure system settings.

## Admin Dashboard Access

### Login
1. Navigate to the HSE System login page
2. Enter your email: `xom-it-admin@xomoman.com`
3. Enter the default password: `Xom@2026`
4. Click "Sign In"

### Dashboard Tabs
Once logged in, you'll see two tabs at the top:
- **Dashboard**: View all HSE metrics and reports
- **Settings**: Admin-only features for user and system management

## Key Features

### 1. Reset User Passwords

#### How to Reset a Password

1. Go to the **Dashboard** tab
2. Scroll down to "Team Members" section
3. Find the user in the table
4. Click the **three-dot menu** (⋯) on the right side of the user's row
5. Select **"Reset Password"** from the dropdown menu
6. Confirm the reset in the dialog that appears
7. The system will:
   - Generate a secure temporary password
   - Send it via email to: `hsesystem.xom@outlook.com`
   - Display the password in the dialog for your reference

#### Email Details
- **From**: hsesystem.xom@outlook.com
- **To**: User's registered email address
- **Content**: Temporary password with instructions to change it on first login

### 2. Add New Users

#### How to Add a User

1. Go to the **Settings** tab
2. Scroll down to the "User Management" section
3. Click **"Add New User"** button
4. Fill in the user details:
   - **Full Name** * (required)
   - **Email Address** * (required) - Must be unique
   - **Payroll Number** - Optional identifier
   - **Designation** - Job title
   - **Business Unit** - Select from dropdown:
     - XOM Oman
     - XOM Drilling System
     - Falcon Oilfield Services
   - **Role** - Select from dropdown:
     - USER (Default)
     - HSE ADMIN
     - HSE
     - MANAGEMENT
     - SITE MANAGER
     - SITE MANAGER - Global
     - ADMIN SYSTEM
     - MASTER USER
     - HR
     - USER - JM
   - **Status** - Active or Inactive
5. Click **"Add User"** button
6. The system will:
   - Create the user account
   - Generate a temporary password
   - Send welcome email with login credentials

### 3. Admin Settings Overview

#### Statistics Dashboard
The settings page shows:
- **Total Users**: Total active and inactive users in the system
- **Admin Accounts**: Number of system administrators
- **Email Service**: Status of email configuration

#### Email Configuration
View and verify:
- SMTP Server: smtp.office365.com
- SMTP Port: 587
- From Email: hsesystem.xom@outlook.com
- Status: Configured and active

## Security Best Practices

### Password Reset
- ✓ Generate new temporary passwords automatically
- ✓ Send passwords securely via email
- ✓ Never share passwords in chat or messages
- ✓ Ask users to change password on first login
- ✓ All resets are logged with admin ID and timestamp

### Admin Account Security
- Keep your admin password confidential
- Only reset passwords when users request it
- Monitor audit logs for suspicious activity
- Report security concerns to system administrators

## User Roles and Permissions

### Admin (xom-it-admin@xomoman.com)
- Full system access
- Can reset all user passwords
- Can add new users
- Can view all reports and analytics
- Settings and configuration access

### Master User
- Can create and manage content
- Can approve submissions
- Read-only access to settings

### HSE Admin / HSE
- Can create and submit HSE reports
- Can view analytics
- Limited user management

### Site Manager
- Can manage site-specific data
- Can submit reports for their site
- Can view site analytics

### Regular User
- Can submit forms and observations
- Can view their own data
- Limited system access

## Common Tasks

### Resetting a Password for an Inactive User
1. Find the user in the Team Members table
2. They will show as "Inactive" status
3. You can still reset their password while inactive
4. They can use the new password to re-activate their account

### Changing a User's Role
Currently, user roles are managed through direct database updates. For role changes:
1. Contact the system administrator
2. Provide the user's email and new role
3. The change will be applied immediately

### Deactivating a User
1. Find the user in the Team Members table
2. Click the three-dot menu
3. Select "Deactivate"
4. The user will no longer be able to log in

### Viewing User Activity
User activity logs are available in the Admin Settings for compliance and security auditing.

## Email Service Configuration

The system uses Microsoft Outlook SMTP to send emails:

### Credentials
- **SMTP Server**: smtp.office365.com
- **Port**: 587 (TLS)
- **From Email**: hsesystem.xom@outlook.com
- **Password**: Set in environment variables (EMAIL_PASSWORD)

### Testing Email
To verify email is working:
1. Reset any user's password
2. Check that user receives the email within 2-3 minutes
3. Verify email contains the temporary password and instructions

## Troubleshooting

### Email Not Received
- **Check spam folder**: Emails might be filtered
- **Verify email address**: Ensure correct user email
- **Check credentials**: Verify EMAIL_USER and EMAIL_PASSWORD are set
- **Resend**: Try resetting the password again

### Cannot Add User
- **Duplicate email**: Ensure email address is unique
- **Missing fields**: Name and email are required
- **Permissions**: Verify you're logged in as admin

### User Can't Log In
- **Password expired**: Reset the password
- **Account inactive**: Check user status
- **Wrong credentials**: Verify email and password

## Contact & Support

For technical issues or questions:
1. Check the logs in the dashboard
2. Contact the system administrator
3. Document the issue with: user email, timestamp, what action was attempted

## Version Information

- **System**: HSE Management System v1.0
- **Last Updated**: June 2026
- **Admin Email**: xom-it-admin@xomoman.com
- **Support Email**: hsesystem.xom@outlook.com

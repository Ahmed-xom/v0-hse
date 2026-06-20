# Setting Up Default Admin User

The user add system now has improved error handling and a setup script to create default users.

## What Was Fixed

✅ **Error Handling** - Now catches duplicate email errors and shows friendly messages
✅ **Default User Script** - Creates admin user automatically
✅ **Better Debugging** - Improved console logging for troubleshooting

## Option 1: Using the Setup Script (Recommended)

This automatically creates the default admin user in your database.

### Step 1: Run the Setup Script

```bash
node scripts/setup-default-user.js
```

This will:
- Connect to your Neon database (using DATABASE_URL)
- Check if admin user already exists
- Create admin user if it doesn't exist
- Show the created user details

### Step 2: Expected Output

```
✓ Admin user already exists: xom-it-admin@xomoman.com
```

Or if creating new:

```
✓ Created default admin user:
  ID: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
  Email: xom-it-admin@xomoman.com
  Name: XOM IT Admin

Next steps:
  1. Use the forgot password flow to set a password
  2. Or use the login page and set password there
  3. Email will be sent to the configured admin email
```

## Option 2: Manual Database Insert

If you prefer to insert manually via Neon console:

```sql
INSERT INTO "user" (id, name, email, "emailVerified", role, banned, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'XOM IT Admin',
  'xom-it-admin@xomoman.com',
  true,
  'ADMIN',
  false,
  NOW(),
  NOW()
)
RETURNING id, email, name;
```

## Troubleshooting

### Issue: Email already exists
**Error:** "A user with email xom-it-admin@xomoman.com already exists"
**Solution:** Use a different email address or delete the existing user first

### Issue: Script says "Admin user already exists"
**Solution:** That's good! Your admin user is already set up. Try logging in.

### Issue: Cannot connect to database
**Error:** "DATABASE_URL environment variable not set"
**Solution:** Make sure DATABASE_URL is in your environment variables (v0 Settings → Vars)

## Next Steps After Setup

### 1. Set Admin Password

Go to the forgot password page:
```
/forgot-password
```

Enter the admin email:
```
xom-it-admin@xomoman.com
```

You'll receive an email with a temporary password reset link.

### 2. Log In

Once password is set, log in to:
```
/sign-in
```

With credentials:
- Email: xom-it-admin@xomoman.com
- Password: (the one you just set)

### 3. Start Adding Users

Once logged in as admin:
1. Go to Settings → User Management
2. Click "Add New User"
3. Fill in user details
4. User receives welcome email with temporary password

## Database Schema

The setup script only inserts these columns which exist in the user table:
- **id** - UUID primary key (auto-generated)
- **name** - User display name
- **email** - User email (must be unique)
- **emailVerified** - Boolean (set to true for admin)
- **role** - User role (ADMIN or USER)
- **banned** - Boolean (false for active users)
- **createdAt** - Timestamp (auto-set)
- **updatedAt** - Timestamp (auto-set)

## Testing the System

After setup, test these flows:

### Test 1: Add User
1. Log in as admin
2. Go to Settings → User Management
3. Add a test user
4. User should receive welcome email

### Test 2: Reset Password
1. Find a user in Team Members
2. Click reset password
3. User should receive reset email

### Test 3: Forgot Password
1. Go to /forgot-password
2. Enter user email
3. User should receive reset email

## Environment Variables Required

For the system to work end-to-end:

```
DATABASE_URL = (your Neon database URL)
BETTER_AUTH_SECRET = (32+ char secret)
EMAIL_USER = hse-system@gmail.com
EMAIL_PASSWORD = (gmail app password)
```

All should be in v0 Settings → Vars

## Common Issues

| Issue | Solution |
|-------|----------|
| "No such file or directory: scripts/setup-default-user.js" | Run from project root: `cd /vercel/share/v0-project && node scripts/setup-default-user.js` |
| Cannot add users - emails keep failing | Check EMAIL_USER and EMAIL_PASSWORD in environment |
| Login page not working | Ensure BETTER_AUTH_SECRET is set |
| Cannot connect to database | Verify DATABASE_URL is correct in Neon console |

## Support

If you still have issues:
1. Check console logs (F12 → Console)
2. Look for `[v0]` prefixed messages
3. Verify all environment variables are set
4. Check Neon database directly for data

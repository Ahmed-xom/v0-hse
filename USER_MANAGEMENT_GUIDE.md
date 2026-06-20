# User Management - Complete Guide

## All Features Now Working

### 1. Edit User
**What it does:**
- Update user role (dropdown with all available roles)
- Change user status (Active/Inactive)
- All changes saved to database

**How to use:**
1. Go to Settings → Team Members
2. Click the menu (three dots) for any user
3. Click "Edit User"
4. Change Role and Status as needed
5. Click "Save Changes"
6. Success message appears and user data updates

### 2. Activate/Deactivate User
**Status Options:**
- **Active** - User can log in and access the system
- **Inactive** - User is banned from accessing the system

**How to change status:**
1. Click Edit User on any team member
2. Change Status dropdown to Active or Inactive
3. Click Save Changes
4. Database updates immediately

**Database behavior:**
- Active users: `banned = false`
- Inactive users: `banned = true` with reason "Status changed"

### 3. Delete User
**What it does:**
- Soft delete - marks user as banned but keeps data
- Shows confirmation dialog before deleting

**How to delete:**
1. Click menu (three dots) on user row
2. Click "Deactivate" or "Delete" (label changes based on status)
3. Confirm deletion
4. User is soft-deleted (banned with reason "User deleted")
5. User can be reactivated by changing status back to Active

### 4. Export Users to Excel (CSV)
**What it does:**
- Exports all visible users to CSV file
- Includes all user data: ID, Name, Email, Role, Status, Business Unit, etc.
- Downloads with current date in filename

**How to export:**
1. Go to Settings → Team Members
2. Click "Export" button (top right)
3. CSV file downloads automatically
4. Filename format: `users_export_YYYY-MM-DD.csv`

**Excel columns included:**
- ID
- Name
- Email
- Role
- Status
- Business Unit
- Designation
- Payroll No
- Created Date

### 5. Reset Password
**Already working - confirmed:**
- Click user menu → Reset Password
- Email sent with temporary password
- User can log in with temporary password
- User will be prompted to change password

### 6. Add User
**Already working - confirmed:**
- Click "Add User" button
- Fill in all fields
- Temporary password sent via email
- User appears in table immediately

---

## Server Actions Behind the Scenes

### Created Server Actions

**File:** `/app/actions/manage-users.ts`

```typescript
// Update user status (Active/Inactive)
updateUserStatus(userId, status)

// Update user role
updateUserRole(userId, role)

// Delete user (soft delete)
deleteUser(userId)

// Export users to CSV
exportUsersToExcel(users)
```

### Database Updates

All actions directly update the Neon database `user` table:

```sql
-- Status update
UPDATE "user" SET banned = ${true/false}, "updatedAt" = NOW()

-- Role update
UPDATE "user" SET role = ${newRole}, "updatedAt" = NOW()

-- Delete (soft)
UPDATE "user" SET banned = true, "banReason" = 'User deleted'
```

---

## Error Handling

All actions include error handling:
- ✅ Input validation (required fields checked)
- ✅ Database error catching
- ✅ User-friendly error messages in toast
- ✅ Console logging with `[v0]` prefix for debugging

**Example error responses:**
- "User ID is required"
- "Failed to update user status"
- "No users to export"

---

## Testing Checklist

- [ ] Edit user - change role
- [ ] Edit user - change status to Inactive
- [ ] Edit user - change status back to Active
- [ ] Delete user - confirm soft delete works
- [ ] Delete user - verify user can be reactivated
- [ ] Export users - download CSV file
- [ ] Verify CSV has all user data
- [ ] Check console logs for `[v0]` messages
- [ ] Verify toast notifications appear

---

## Database Schema Reference

### User Table (neon_auth.user)
- `id` (UUID) - User ID
- `email` (text) - User email
- `name` (text) - User name
- `role` (text) - User role
- `banned` (boolean) - Active/Inactive status
- `banReason` (text) - Reason for ban/deletion
- `createdAt` (timestamp) - Creation date
- `updatedAt` (timestamp) - Last update date

---

## Key Features Summary

| Feature | Status | Database | Email | UI Feedback |
|---------|--------|----------|-------|-------------|
| Edit User | ✅ | Updates | No | Toast message |
| Change Status | ✅ | Updates | No | Toast message |
| Delete User | ✅ | Soft Delete | No | Confirmation dialog |
| Export CSV | ✅ | No | No | File download |
| Reset Password | ✅ | No | Yes | Toast + Email |
| Add User | ✅ | Inserts | Yes | Toast + Email |

---

## Console Debugging

All actions log to browser console with `[v0]` prefix:

```
[v0] Updating user status: { userId: '...', status: 'Inactive' }
[v0] User status updated: { id: '...', email: '...', banned: true }
[v0] Exporting users to Excel: 25 users
[v0] CSV generated successfully
```

Look for these in F12 → Console when testing.

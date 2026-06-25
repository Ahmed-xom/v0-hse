# Fix: "User not found" Error When Resetting Password

## Problem
When attempting to reset a password for a user in the admin panel, the application returned a "User not found" error. This occurred because:

1. The users-management component was displaying **mock/static user data** from `lib/users-data.ts`
2. The `resetUserPassword` action was searching for users in the real `neon_auth.user` table
3. These mock users (like "Abdullah Said Salim Al Hinai") don't exist in the database, so the lookup failed

### Example Scenario
- Admin tries to reset password for mock user "Abdullah Said Salim Al Hinai (L-FWM-0050)"
- Action queries `neon_auth.user` table for that email
- User doesn't exist in real database
- Returns: "User not found"

## Solution
The fix connects the users-management component to the real authentication database instead of mock data:

### Changes Made

1. **Created `app/actions/get-users.ts`** 
   - New server action that fetches real users from `neon_auth.user` table
   - Transforms the data to match the UI's expected User type
   - Returns users sorted by name

2. **Updated `components/dashboard/users-management.tsx`**
   - Replaced static import of mock users with dynamic database fetch
   - Added `useEffect` hook to load real users on component mount
   - Uses state management to display loading state
   - Falls back with error toast if loading fails

3. **Enhanced `app/actions/reset-password.ts`**
   - Added detailed console logging for debugging
   - Improved error messages to show which email/ID failed
   - Better UUID validation

## Real Users in Database
The system now uses the following real authentication users:
1. `test-user-1781971247678@xomoman.com` - Test User
2. `xom-it-admin@xomoman.com` - Admin User  
3. `ab9144123r@gmail.com` - ahmedd

## Testing
To test the fix:
1. Open the admin panel
2. The users list should now show real database users (not mock data)
3. Click "Reset Password" on any user
4. The password reset should succeed without "User not found" errors

## Technical Notes
- Mock users from `users-data.ts` are still used in other parts of the app (they serve as template/reference data)
- The users-management component now fetches fresh data on each mount
- New users added via the admin panel are stored in `neon_auth.user` and will appear immediately
- Password reset records are logged to the `password_reset` audit table with IP address and reset timestamp

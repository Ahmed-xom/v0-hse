# Database Integration Plan - XOM HSE Dashboard

## Current Status
- ✓ Database connected (Neon PostgreSQL)
- ✓ User management functions working (status, role updates)
- ✓ Basic schema established
- ⚠ Some pages still using hardcoded data

## Pages & Features to Connect

### 1. Main Dashboard (`/app/page.tsx`)
**Current**: Uses hardcoded `users` data from `@/lib/users-data`
**To Connect**:
- KPI Cards: Fetch incident statistics from database
- Incident Statistics: Query incident records
- Inspection Reports: Query inspection data  
- Users Management: Fetch from `neon_auth."user"` table
- Business Units: Create and query business_units table
- Behaviour Observations: Query observations table

**Action Required**: Create server action `getIncidentStatistics()` to fetch data

### 2. Settings Page (`/app/settings/page.tsx`)
**Current**: Manages users via `MasterSettings` component
**Status**: ✓ Users update working (fixed)
**To Connect**:
- User list: Fetch all users from database
- Add user: Insert into `neon_auth."user"` table (done)
- Edit user: Update user details
- Delete user: Soft delete with banned flag (done)

### 3. Sign-In (`/app/sign-in/page.tsx`)
**Status**: ✓ Using Better Auth (connected)

### 4. Forgot Password (`/app/forgot-password/page.tsx`)
**Status**: ✓ Using Better Auth (connected)

## Database Schema Updates Needed

### Current Tables
```sql
neon_auth.user              -- ✓ Working
neon_auth.session           -- ✓ Working
neon_auth.account           -- ✓ Working
neon_auth.verification      -- ✓ Working
```

### Tables to Create
```sql
1. incidents
   - id (UUID, PK)
   - type (VARCHAR) - LTI, Medical, First Aid, Near Miss
   - severity (VARCHAR) - Minor, Moderate, Serious, Critical
   - date (TIMESTAMP)
   - description (TEXT)
   - userId (UUID, FK)
   - businessUnitId (UUID, FK)
   - createdAt (TIMESTAMP)
   - updatedAt (TIMESTAMP)

2. business_units
   - id (UUID, PK)
   - name (VARCHAR) - e.g., "Operations", "Engineering"
   - description (TEXT)
   - location (VARCHAR)
   - createdAt (TIMESTAMP)
   - updatedAt (TIMESTAMP)

3. inspections
   - id (UUID, PK)
   - title (VARCHAR)
   - type (VARCHAR)
   - date (TIMESTAMP)
   - findings (TEXT)
   - status (VARCHAR) - Pending, In Progress, Completed
   - userId (UUID, FK)
   - createdAt (TIMESTAMP)
   - updatedAt (TIMESTAMP)

4. behaviour_observations
   - id (UUID, PK)
   - title (VARCHAR)
   - observation (TEXT)
   - positive (BOOLEAN)
   - date (TIMESTAMP)
   - userId (UUID, FK)
   - createdAt (TIMESTAMP)
   - updatedAt (TIMESTAMP)
```

## Server Actions to Create

```typescript
// incidents
- getIncidentStatistics()
- addIncident()
- updateIncident()
- deleteIncident()
- getIncidentsByUser()

// business_units
- getBusinessUnits()
- addBusinessUnit()

// inspections
- getInspections()
- addInspection()
- updateInspectionStatus()

// behaviour_observations
- getBehaviourObservations()
- addObservation()
```

## Implementation Roadmap

### Phase 1: Fix User Management (DONE)
- ✓ Fix manage-users.ts queries
- ✓ Test user status/role updates
- ✓ Verify database operations

### Phase 2: Create Database Tables (TODO)
- Create incidents table
- Create business_units table
- Create inspections table
- Create behaviour_observations table

### Phase 3: Create Server Actions (TODO)
- Implement data fetching functions
- Implement CRUD operations
- Add proper error handling

### Phase 4: Update Components (TODO)
- Replace hardcoded data with database queries
- Update dashboard components
- Add real-time refresh

### Phase 5: Testing (TODO)
- Test all CRUD operations
- Test data relationships
- Test performance

## File Changes Required

### New Files to Create
- `/app/actions/incidents.ts` - Incident operations
- `/app/actions/business-units.ts` - Business unit operations
- `/app/actions/inspections.ts` - Inspection operations
- `/app/actions/behaviour-observations.ts` - Observation operations

### Files to Modify
- `/app/page.tsx` - Replace hardcoded data
- `/lib/users-data.ts` - Replace with database queries
- `/components/dashboard/users-management.tsx` - Use database

## Query Examples

### Fetch users by business unit
```typescript
const result = await pool.query(
  'SELECT * FROM neon_auth."user" WHERE "businessUnit" = $1 ORDER BY name',
  [businessUnitId]
)
```

### Fetch incidents for dashboard
```typescript
const result = await pool.query(
  `SELECT type, severity, COUNT(*) as count 
   FROM incidents 
   WHERE date >= NOW() - INTERVAL '6 months'
   GROUP BY type, severity
   ORDER BY date DESC`
)
```

## Next Steps

1. **Immediate**: Test user management fix is working
2. **Short-term**: Create database tables
3. **Mid-term**: Implement server actions
4. **Long-term**: Replace all hardcoded data with dynamic queries


# Training Data Setup

## Overview
Training records have been successfully imported into the HSE Dashboard database. The system now tracks employee training courses, completion dates, and results.

## Database Changes

### New Table: `public.training`
A new table has been created to store training records with the following schema:

```sql
CREATE TABLE "public"."training" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employee_name" text NOT NULL,
  "employee_code" text,
  "course_name" text NOT NULL,
  "status" text NOT NULL,
  "result" text NOT NULL,
  "completed_date" date NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
)
```

### Columns
- **id**: Unique identifier for each training record
- **employee_name**: Full name of the employee who completed the training
- **employee_code**: Employee code (e.g., L-FWM-0050)
- **course_name**: Name of the course completed
- **status**: Training status (e.g., APPEAR)
- **result**: Training result (PASSED/FAILED)
- **completed_date**: Date when the training was completed
- **created_at**: Timestamp when the record was created
- **updated_at**: Timestamp of last update

## Data Imported
- **Total Records**: 3+ training records have been imported from the CSV export
- **Data Source**: Himaya - Search Training Detail export
- **Employee Coverage**: Multiple employees from various departments

### Sample Records
- Abdullah Said Salim Al Hinai - (OPAL HSEI) HSE Induction - PASSED - 1994-11-17
- Gibi John - (OPAL HSEI) HSE Induction - PASSED - 1997-03-12
- Fouad Ibrahim - (OPAL HSEI) HSE Induction - PASSED - 2003-01-09

## API Endpoints

### GET /api/training
Retrieves all training records from the database.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "uuid",
      "employee_name": "Name",
      "employee_code": "L-FWM-0050",
      "course_name": "Course Name",
      "status": "APPEAR",
      "result": "PASSED",
      "completed_date": "1994-11-17",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/training
Creates a new training record.

**Request Body:**
```json
{
  "employeeName": "Employee Name",
  "employeeCode": "L-FWM-0050",
  "courseName": "Course Name",
  "status": "APPEAR",
  "result": "PASSED",
  "completedDate": "2024-01-01"
}
```

## Dashboard Components

### TrainingRecords Component
A new component `TrainingRecords` has been added to display training records on the HSE Dashboard.

**Location**: `/components/dashboard/training-records.tsx`

**Features**:
- Displays training records in a table format
- Shows employee name, code, course name, status, result, and completion date
- Color-coded result badges (green for PASSED, red for FAILED)
- Responsive design with horizontal scrolling for mobile
- Loading and error states

### Integration
The `TrainingRecords` component has been integrated into:
- **Admin Dashboard Tab** (Settings tab for admin users)
- **Main Dashboard** (visible to all users)

## Usage

### Viewing Training Records
1. Navigate to the HSE Dashboard
2. Training records are displayed at the bottom of the dashboard
3. Records are sorted by completion date (most recent first)
4. Click to view employee details and course information

### Adding New Training Records
Use the API endpoint:
```bash
curl -X POST http://localhost:3000/api/training \
  -H "Content-Type: application/json" \
  -d '{
    "employeeName": "Employee Name",
    "employeeCode": "L-FWM-0050",
    "courseName": "Course Name",
    "status": "APPEAR",
    "result": "PASSED",
    "completedDate": "2024-01-15"
  }'
```

## Files Created/Modified

### New Files
- `/scripts/setup-training-table.ts` - Database setup and import script
- `/app/api/training/route.ts` - API endpoints for training records
- `/components/dashboard/training-records.tsx` - Training records display component
- `TRAINING_DATA_SETUP.md` - This documentation file

### Modified Files
- `/app/page.tsx` - Added TrainingRecords component to dashboard

## Next Steps

1. **Bulk Import More Data**: Run the setup script to import additional training records from the full CSV export
2. **Add Filters**: Implement filters for course name, status, and date range
3. **Export Reports**: Add functionality to export training records to CSV/Excel
4. **Analytics**: Create charts showing training completion rates by department
5. **Compliance Tracking**: Add features to track training compliance and expiration dates

## Troubleshooting

### Records Not Displaying
1. Verify the training table exists: `SELECT * FROM "public"."training" LIMIT 1;`
2. Check API response: `curl http://localhost:3000/api/training`
3. Review browser console for errors

### API Errors
1. Ensure all required fields are provided in POST requests
2. Check that date format is YYYY-MM-DD
3. Verify database connection is active

## Support
For issues or questions about the training data system, please contact the HSE System Administrator.

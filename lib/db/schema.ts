import { pgTable, pgSchema, text, varchar, timestamp, boolean, integer, decimal, jsonb, index, uuid, date } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Point Better Auth tables at the neon_auth schema where they actually live
const neonAuthSchema = pgSchema('neon_auth')

export const user = neonAuthSchema.table('user', {
  id: uuid('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
  banned: boolean('banned').default(false),
  banReason: text('banReason'),
  banExpires: timestamp('banExpires'),
  role: text('role').default('USER'),
  journeyAccess: boolean('journey_access').notNull().default(false),
  journeyApprover: boolean('journey_approver').notNull().default(false),
})

export const session = neonAuthSchema.table('session', {
  id: uuid('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: uuid('userId').notNull(),
})

export const account = neonAuthSchema.table('account', {
  id: uuid('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: uuid('userId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

export const verification = neonAuthSchema.table('verification', {
  id: uuid('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

// HSE System Users Table - stores app-specific user data
export const hseUser = pgTable('hse_user', {
  id: text('id').primaryKey(),
  userId: uuid('userId').notNull(),
  payrollNo: varchar('payrollNo').unique(),
  designation: text('designation'),
  businessUnit: text('businessUnit'),
  hseRole: text('hseRole'),
  status: varchar('status').default('Active'),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

// Password reset tracking
export const passwordReset = pgTable('password_reset', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  resetBy: text('resetBy').notNull(),
  newPassword: text('newPassword').notNull(),
  resetAt: timestamp('resetAt').notNull().default(sql`now()`),
  ipAddress: text('ipAddress'),
})

// Generic table for Excel data - will be used for flexible data storage
export const excelData = pgTable('excel_data', {
  id: text('id').primaryKey(),
  source: varchar('source').notNull(),
  sheetName: varchar('sheetName').notNull(),
  rowIndex: integer('rowIndex').notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
}, (table) => ({
  sourceSheetIdx: index('excel_data_source_sheet_idx').on(table.source, table.sheetName, table.rowIndex),
}))

// Employees Table
export const employee = pgTable('employee', {
  id: text('id').primaryKey(),
  payrollNo: varchar('payrollNo').unique(),
  name: varchar('name'),
  email: varchar('email').unique(),
  designation: text('designation'),
  businessUnit: text('businessUnit'),
  status: varchar('status'),
  department: text('department'),
  manager: varchar('manager'),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

// Business Units Table
export const businessUnit = pgTable('business_unit', {
  id: text('id').primaryKey(),
  name: varchar('name').unique().notNull(),
  code: varchar('code').unique(),
  description: text('description'),
  manager: varchar('manager'),
  status: varchar('status').default('Active'),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

// Observation Types Table
export const observationType = pgTable('observation_type', {
  id: text('id').primaryKey(),
  name: varchar('name').notNull(),
  category: varchar('category'),
  description: text('description'),
  severity: varchar('severity'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

// Inspection Types Table
export const inspectionType = pgTable('inspection_type', {
  id: text('id').primaryKey(),
  name: varchar('name').notNull().unique(),
  description: text('description'),
  frequency: varchar('frequency'),
  requiresApproval: boolean('requiresApproval').default(false),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

// Masters Table - for general configuration data
export const master = pgTable('master', {
  id: text('id').primaryKey(),
  type: varchar('type').notNull(),
  key: varchar('key').notNull(),
  value: text('value'),
  description: text('description'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

// Observations Table
export const observation = pgTable('observation', {
  id: text('id').primaryKey(),
  number: text('number'),
  userId: uuid('userId').notNull(),
  observer: text('observer'),
  position: text('position'),
  observationTypeId: text('observationTypeId'),
  businessUnitId: text('businessUnitId'),
  description: text('description'),
  severity: varchar('severity'),
  location: text('location'),
  category: text('category'),
  nearMiss: boolean('nearMiss').default(false),
  correctiveActions: text('correctiveActions'),
  status: varchar('status').default('Open'),
  date: timestamp('date').default(sql`now()`),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

// Training Matrix Table
export const training = pgTable('training', {
  id: text('id').primaryKey(),
  employeeName: text('employee_name').notNull(),
  employeeCode: text('employee_code').notNull(),
  courseName: text('course_name').notNull(),
  status: text('status').notNull().default('Pending'),
  result: text('result'),
  completedDate: date('completed_date'),
  expiryDate: date('expiry_date'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
})

// Training Notifications Table
export const trainingNotification = pgTable('training_notification', {
  id: text('id').primaryKey(),
  trainingId: text('training_id').notNull().references(() => training.id, { onDelete: 'cascade' }),
  recipientEmail: text('recipient_email').notNull(),
  recipientRole: text('recipient_role').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
})

// Vehicle Register Table
export const vehicle = pgTable('vehicle', {
  id:            integer('id').primaryKey().generatedAlwaysAsIdentity(),
  plateNo:       text('plate_no').notNull().unique(),
  vehicleType:   text('vehicle_type').notNull(),
  expiryDate:    date('expiry_date'),
  allowableLoad: text('allowable_load'),
  kmReading:     text('km_reading'),
  description:   text('description'),
  isActive:      boolean('is_active').notNull().default(true),
  createdAt:     timestamp('created_at').notNull().default(sql`now()`),
})

// Journey Tracker Table
export const journey = pgTable('journey', {
  id: text('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  purpose: text('purpose').notNull(),
  vehicleType: text('vehicle_type').notNull(),
  vehiclePlate: text('vehicle_plate'),
  departureDate: date('departure_date').notNull(),
  departureTime: text('departure_time').notNull(),
  estimatedReturn: text('estimated_return'),
  passengers: integer('passengers').notNull().default(0),
  status: text('status').notNull().default('Planned'),
  notes: text('notes'),
  attachmentUrl: text('attachment_url'),
  attachmentName: text('attachment_name'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
})

// Inspections Table
// Incident Management Table
export const incident = pgTable('incident', {
  id:               text('id').primaryKey(),
  referenceNo:      text('reference_no').notNull().unique(),
  title:            text('title').notNull(),
  incidentType:     text('incident_type').notNull(),
  severity:         text('severity').notNull().default('Minor'),
  status:           text('status').notNull().default('Open'),
  date:             timestamp('date', { withTimezone: true }).notNull(),
  location:         text('location'),
  businessUnit:     text('business_unit'),
  reportedBy:       text('reported_by'),
  reportedByEmail:  text('reported_by_email'),
  injuredPerson:    text('injured_person'),
  injuryType:       text('injury_type'),
  description:      text('description'),
  immediateAction:  text('immediate_action'),
  rootCause:        text('root_cause'),
  correctiveAction: text('corrective_action'),
  lostTimeDays:     integer('lost_time_days').default(0),
  nearMiss:         boolean('near_miss').notNull().default(false),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
})

// Password Reset OTP Table
export const passwordResetOtp = pgTable('password_reset_otp', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email:     text('email').notNull(),
  otpHash:   text('otp_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used:      boolean('used').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const inspection = pgTable('inspection', {
  id: text('id').primaryKey(),
  userId: uuid('userId').notNull(),
  inspectionTypeId: text('inspectionTypeId').notNull().references(() => inspectionType.id),
  businessUnitId: text('businessUnitId').notNull().references(() => businessUnit.id),
  date: timestamp('date'),
  findings: text('findings'),
  status: varchar('status').default('Pending'),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

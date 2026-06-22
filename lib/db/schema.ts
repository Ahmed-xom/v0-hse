import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb, index, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Better Auth Tables (in neon_auth schema)
export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
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
}, (table) => ({
  emailIdx: index('user_email_idx').on(table.email),
}))

export const session = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: uuid('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: uuid('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
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

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
})

// HSE System Users Table - stores app-specific user data
export const hseUser = pgTable('hse_user', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
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
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  resetBy: text('resetBy').notNull().references(() => user.id),
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
  userId: text('userId').notNull().references(() => user.id),
  observationTypeId: text('observationTypeId').notNull().references(() => observationType.id),
  businessUnitId: text('businessUnitId').notNull().references(() => businessUnit.id),
  description: text('description'),
  severity: varchar('severity'),
  location: text('location'),
  status: varchar('status').default('Open'),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

// Inspections Table
export const inspection = pgTable('inspection', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id),
  inspectionTypeId: text('inspectionTypeId').notNull().references(() => inspectionType.id),
  businessUnitId: text('businessUnitId').notNull().references(() => businessUnit.id),
  date: timestamp('date'),
  findings: text('findings'),
  status: varchar('status').default('Pending'),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
})

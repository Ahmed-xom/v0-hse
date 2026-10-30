import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core'

// Runtime mappings of existing tables only; no DDL or migrations.
export const libraryDocument = pgTable('document', {
  id: text('id').primaryKey(),
  doc_no: text('doc_no'),
  title: text('title').notNull(),
  category: text('category').notNull(),
  sub_category: text('sub_category'),
  description: text('description'),
  version: text('version').notNull(),
  status: text('status').notNull(),
  file_url: text('file_url'),
  file_name: text('file_name'),
  file_size: text('file_size'),
  file_type: text('file_type'),
  blob_pathname: text('blob_pathname'),
  business_unit: text('business_unit'),
  owner: text('owner'),
  owner_email: text('owner_email'),
  uploaded_by: text('uploaded_by'),
  uploaded_by_email: text('uploaded_by_email'),
  review_date: timestamp('review_date', { withTimezone: true, mode: 'string' }),
  expiry_date: timestamp('expiry_date', { withTimezone: true, mode: 'string' }),
  tags: text('tags').array(),
  is_public: boolean('is_public'),
  allowed_emails: text('allowed_emails').array(),
  company_id: text('company_id'),
  folder_id: text('folder_id'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
})

export const libraryFolder = pgTable('document_folder', {
  id: text('id').primaryKey(),
  company_id: text('company_id').notNull(),
  parent_id: text('parent_id'),
  name: text('name').notNull(),
  description: text('description'),
  created_by: uuid('created_by'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
})

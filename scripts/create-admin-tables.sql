-- Create business_units table
CREATE TABLE IF NOT EXISTS business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  email TEXT,
  type TEXT NOT NULL CHECK (type IN ('Group', 'Business Unit')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  manager TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create inspection_types table
CREATE TABLE IF NOT EXISTS inspection_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  frequency TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create master_categories table
CREATE TABLE IF NOT EXISTS master_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create master_sections table
CREATE TABLE IF NOT EXISTS master_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES master_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create master_items table
CREATE TABLE IF NOT EXISTS master_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES master_sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inspection_types_category ON inspection_types(category);
CREATE INDEX IF NOT EXISTS idx_business_units_status ON business_units(status);
CREATE INDEX IF NOT EXISTS idx_master_sections_category ON master_sections(category_id);
CREATE INDEX IF NOT EXISTS idx_master_items_section ON master_items(section_id);

-- Insert sample data if tables are empty
INSERT INTO business_units (name, description, email, type, status)
SELECT 'XOM Oman', 'Main business unit for Oman operations', 'ops@xomoman.com', 'Business Unit', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM business_units WHERE name = 'XOM Oman');

INSERT INTO business_units (name, description, email, type, status)
SELECT 'Falcon Oilfield Services', 'Falcon services division', 'falcon@xom.com', 'Group', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM business_units WHERE name = 'Falcon Oilfield Services');

INSERT INTO business_units (name, description, email, type, status)
SELECT 'XOM Drilling System', 'Drilling operations', 'drilling@xom.com', 'Business Unit', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM business_units WHERE name = 'XOM Drilling System');

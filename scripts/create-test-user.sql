-- Create test user for password reset testing
INSERT INTO neon_auth."user" (id, email, name, "emailVerified", role, "createdAt", "updatedAt")
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'xom-it-admin@xomoman.com',
  'Admin User',
  true,
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = 'Admin User',
  "emailVerified" = true,
  role = 'ADMIN'
RETURNING id, email, name;

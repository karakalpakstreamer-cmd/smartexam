-- SQL script to create test user R002
-- Password: admin@2025
-- Role: registrator

INSERT INTO users (
  user_id,
  role,
  full_name,
  email,
  password_hash,
  is_active,
  created_at
) VALUES (
  'R002',
  'registrator',
  'Test Admin',
  NULL,
  '$2b$10$U4d0hl4WL7aFC5o2vBuWeuQ2ofVZYcXEtjkvlSIeTn1eNO0b7Gjue',
  true,
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  is_active = true;

-- Verify the user was created
SELECT id, user_id, role, full_name, is_active, created_at 
FROM users 
WHERE user_id = 'R002';



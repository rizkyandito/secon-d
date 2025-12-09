-- =====================================================
-- SETUP ADMIN AUTHENTICATION DI SUPABASE
-- =====================================================
-- Jalankan SQL ini di Supabase Dashboard:
-- 1. Buka https://supabase.com/dashboard
-- 2. Pilih project: kbmvomavvehrteslnjmh
-- 3. Pergi ke SQL Editor
-- 4. Paste dan jalankan script ini
-- =====================================================

-- 1. Buat tabel admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Tidak ada yang bisa SELECT password_hash dari frontend
-- (hanya bisa diakses via function)
CREATE POLICY "No direct access to admins" ON admins
  FOR SELECT USING (false);

-- 4. Buat function untuk login (menggunakan pgcrypto untuk hash)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION admin_login(input_username TEXT, input_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  result JSON;
BEGIN
  -- Cari admin berdasarkan username
  SELECT id, username, password_hash, display_name
  INTO admin_record
  FROM admins
  WHERE username = input_username;

  -- Jika tidak ditemukan
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'message', 'Username tidak ditemukan');
  END IF;

  -- Verifikasi password dengan crypt
  IF admin_record.password_hash = crypt(input_password, admin_record.password_hash) THEN
    RETURN json_build_object(
      'ok', true,
      'user', json_build_object(
        'id', admin_record.id,
        'username', admin_record.username,
        'display_name', admin_record.display_name
      )
    );
  ELSE
    RETURN json_build_object('ok', false, 'message', 'Password salah');
  END IF;
END;
$$;

-- 5. Insert admin accounts dengan password yang di-hash
-- PENTING: Ganti password ini dengan password baru yang lebih aman!
INSERT INTO admins (username, password_hash, display_name) VALUES
  ('admin_dito', crypt('GantiPasswordIni123!', gen_salt('bf')), 'Dito (CEO)'),
  ('admin_luqman', crypt('GantiPasswordIni123!', gen_salt('bf')), 'Luqman (NOE)'),
  ('admin_hazqir', crypt('GantiPasswordIni123!', gen_salt('bf')), 'Hazqir (UIM)'),
  ('admin_melly', crypt('GantiPasswordIni123!', gen_salt('bf')), 'Melly (GOH)'),
  ('admin_kanaya', crypt('GantiPasswordIni123!', gen_salt('bf')), 'Kanaya (AKK)'),
  ('admin_adel', crypt('GantiPasswordIni123!', gen_salt('bf')), 'Adel (EKA)')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- SETELAH MENJALANKAN SCRIPT INI:
-- 1. Ganti password default di atas dengan password yang aman
-- 2. Atau update password dengan query:
--    UPDATE admins SET password_hash = crypt('PasswordBaruAnda', gen_salt('bf')) WHERE username = 'admin_dito';
-- =====================================================

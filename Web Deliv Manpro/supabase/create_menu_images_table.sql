-- Script untuk membuat tabel menu_images dan RLS policies
-- Jalankan script ini di Supabase SQL Editor
-- 
-- CARA MENGGUNAKAN:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Copy-paste script di bawah ini
-- 3. Klik "Run" untuk menjalankan
-- 4. Refresh aplikasi Anda

-- Buat tabel menu_images jika belum ada
CREATE TABLE IF NOT EXISTS public.menu_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  image_url text NOT NULL
);

-- Aktifkan RLS untuk menu_images
ALTER TABLE public.menu_images ENABLE ROW LEVEL SECURITY;

-- Hapus SEMUA policy lama jika ada (untuk menghindari konflik)
DO $$ 
BEGIN
  -- Drop semua policy yang mungkin ada
  DROP POLICY IF EXISTS "Allow read menu_images for everyone" ON public.menu_images;
  DROP POLICY IF EXISTS "Allow write menu_images for anon" ON public.menu_images;
  DROP POLICY IF EXISTS "Allow delete menu_images for anon" ON public.menu_images;
  DROP POLICY IF EXISTS "Allow update menu_images for anon" ON public.menu_images;
END $$;

-- Policy untuk membaca menu_images (semua orang bisa baca)
-- Konsisten dengan policy tabel lain seperti merchants dan menu_items
CREATE POLICY "Allow read menu_images for everyone"
  ON public.menu_images
  FOR SELECT
  USING (true);

-- Policy untuk menambah menu_images (anon bisa insert)
-- Konsisten dengan policy tabel lain
CREATE POLICY "Allow write menu_images for anon"
  ON public.menu_images
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk menghapus menu_images (anon bisa delete)
CREATE POLICY "Allow delete menu_images for anon"
  ON public.menu_images
  FOR DELETE
  USING (true);

-- Policy untuk update menu_images (anon bisa update)
CREATE POLICY "Allow update menu_images for anon"
  ON public.menu_images
  FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- Script PERBAIKAN RLS untuk tabel menu_images
-- Jalankan script ini di Supabase SQL Editor untuk memperbaiki error RLS
-- 
-- CARA MENGGUNAKAN:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Copy-paste script di bawah ini
-- 3. Klik "Run" untuk menjalankan
-- 4. Refresh aplikasi Anda

-- Hapus SEMUA policy lama untuk menu_images
DROP POLICY IF EXISTS "Allow read menu_images for everyone" ON public.menu_images;
DROP POLICY IF EXISTS "Allow write menu_images for anon" ON public.menu_images;
DROP POLICY IF EXISTS "Allow delete menu_images for anon" ON public.menu_images;
DROP POLICY IF EXISTS "Allow update menu_images for anon" ON public.menu_images;

-- Buat ulang policy dengan format yang sama seperti tabel merchants dan menu_items
-- Policy untuk membaca (SELECT)
CREATE POLICY "Allow read menu_images for everyone"
  ON public.menu_images
  FOR SELECT
  USING (true);

-- Policy untuk menambah (INSERT) - INI YANG PENTING UNTUK FIX ERROR!
CREATE POLICY "Allow write menu_images for anon"
  ON public.menu_images
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk menghapus (DELETE)
CREATE POLICY "Allow delete menu_images for anon"
  ON public.menu_images
  FOR DELETE
  USING (true);

-- Policy untuk update (UPDATE)
CREATE POLICY "Allow update menu_images for anon"
  ON public.menu_images
  FOR UPDATE
  USING (true)
  WITH CHECK (true);


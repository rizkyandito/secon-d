-- Supabase schema setup for Web Delivery Manpro
-- Jalankan script ini di Supabase SQL Editor sebelum menghubungkan aplikasi

-- Pastikan extension untuk UUID aktif
create extension if not exists "pgcrypto";

-- 1. Tabel merchants
create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  name text not null,
  category text not null,
  logo text,
  phone text,
  whatsapp text
);

-- 2. Tabel menu_items
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  price numeric not null default 0
);

-- 3. Tabel recommendations
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  name text,
  contact text,
  message text not null,
  done boolean not null default false
);

-- 4. Contoh policy RLS agar aplikasi publik bisa mengakses (opsional, sesuaikan keamanan)
-- Mengaktifkan RLS
alter table public.merchants enable row level security;
alter table public.menu_items enable row level security;
alter table public.recommendations enable row level security;

-- Policy baca untuk semua pengguna (anon key)
create policy "Allow read merchants for everyone"
  on public.merchants
  for select
  using (true);

create policy "Allow read menu items for everyone"
  on public.menu_items
  for select
  using (true);

create policy "Allow read recommendations for everyone"
  on public.recommendations
  for select
  using (true);

-- Policy tulis untuk anon (perlu jika belum ada autentikasi). Jika ingin lebih aman, ganti dengan authenticated role
create policy "Allow write merchants for anon"
  on public.merchants
  for insert
  with check (true);

create policy "Allow update merchants for anon"
  on public.merchants
  for update
  using (true)
  with check (true);

create policy "Allow delete merchants for anon"
  on public.merchants
  for delete
  using (true);

create policy "Allow write menu items for anon"
  on public.menu_items
  for insert
  with check (true);

create policy "Allow update menu items for anon"
  on public.menu_items
  for update
  using (true)
  with check (true);

create policy "Allow delete menu items for anon"
  on public.menu_items
  for delete
  using (true);

create policy "Allow write recommendations for anon"
  on public.recommendations
  for insert
  with check (true);

create policy "Allow update recommendations for anon"
  on public.recommendations
  for update
  using (true)
  with check (true);

create policy "Allow delete recommendations for anon"
  on public.recommendations
  for delete
  using (true);

-- 5. Seed data awal
insert into public.merchants (id, name, category, logo, phone, whatsapp)
values
  ('550e8400-e29b-41d4-a716-446655440100', 'Mororejo', 'Makanan', '/images/Product1.png', '081234567890', '6281234567890'),
  ('550e8400-e29b-41d4-a716-446655440101', 'Podomoro', 'Minuman', '/images/Product2.png', '082233445566', '6282233445566'),
  ('550e8400-e29b-41d4-a716-446655440102', 'Laundry Express', 'Laundry', '/images/Product3.png', '081998877665', '6281998877665')
on conflict (id) do nothing;

insert into public.menu_items (merchant_id, name, price)
values
  ('550e8400-e29b-41d4-a716-446655440100', 'Nasi Goreng', 25000),
  ('550e8400-e29b-41d4-a716-446655440100', 'Sate Ayam', 30000),
  ('550e8400-e29b-41d4-a716-446655440101', 'Milkshake', 18000),
  ('550e8400-e29b-41d4-a716-446655440101', 'Thai Tea', 15000),
  ('550e8400-e29b-41d4-a716-446655440102', 'Cuci Kering', 7000),
  ('550e8400-e29b-41d4-a716-446655440102', 'Cuci Setrika', 12000);

-- Rekomendasi kosong saat awal, tidak perlu seed

-- 6. Tabel menu_images
create table if not exists public.menu_images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  image_url text not null
);

-- 7. Policy untuk menu_images
alter table public.menu_images enable row level security;

create policy "Allow read menu_images for everyone"
  on public.menu_images
  for select
  using (true);

create policy "Allow write menu_images for anon"
  on public.menu_images
  for insert
  with check (true);

create policy "Allow delete menu_images for anon"
  on public.menu_images
  for delete
  using (true);



import { supabase, isSupabaseConfigured } from './supabaseClient';

export const uploadImage = async (file) => {
  if (!file) return null;

  // Cek apakah Supabase sudah dikonfigurasi
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase belum dikonfigurasi. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diatur di file .env.local');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `menu-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    // Tampilkan error yang lebih detail
    console.error('Upload error:', uploadError);
    
    if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
      throw new Error('Bucket "menu-images" tidak ditemukan. Pastikan bucket sudah dibuat di Supabase Storage dan memiliki policy yang benar.');
    } else if (uploadError.message?.includes('new row violates row-level security policy') || uploadError.message?.includes('RLS')) {
      throw new Error('Akses ditolak oleh Row Level Security. Pastikan storage policy sudah dikonfigurasi dengan benar di Supabase.');
    } else if (uploadError.message?.includes('JWT')) {
      throw new Error('Error autentikasi. Pastikan VITE_SUPABASE_ANON_KEY sudah benar.');
    } else {
      throw new Error(`Gagal mengunggah gambar: ${uploadError.message || 'Error tidak diketahui'}`);
    }
  }

  const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
  }

  return urlData.publicUrl;
};

import { supabase, isSupabaseConfigured } from './supabaseClient';
import imageCompression from 'browser-image-compression';

export const uploadImage = async (file, customFileName) => {
  if (!file) return null;

  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase belum dikonfigurasi. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diatur di file .env.local');
  }

  const options = {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    initialQuality: 0.7,
  };

  let compressedFile;
  try {
    // The library returns a File object which is a Blob, but we might lose the name.
    const originalFileForName = file;
    compressedFile = await imageCompression(file, options);
    console.log(`Gambar berhasil dikompresi. Ukuran asli: ${(originalFileForName.size / 1024).toFixed(2)} KB, Ukuran setelah kompresi: ${(compressedFile.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('Gagal melakukan kompresi gambar:', error);
    throw new Error('Gagal melakukan kompresi gambar.');
  }

  // Determine the file extension. Fallback to 'jpg' if name is not available.
  const fileNameFromNameProp = compressedFile.name || file.name;
  let fileExt;
  if (fileNameFromNameProp) {
    fileExt = fileNameFromNameProp.split('.').pop();
  } else if (file.type) {
    fileExt = file.type.split('/')[1];
  } else {
    fileExt = 'jpg';
  }

  // Use the custom file name if provided, otherwise generate a new one.
  const finalFileName = customFileName ? `${customFileName}.${fileExt}` : `${Date.now()}.${fileExt}`;
  const filePath = finalFileName;

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    if (uploadError.message?.includes('Bucket not found')) {
      throw new Error('Bucket "menu-images" tidak ditemukan. Pastikan bucket sudah dibuat di Supabase Storage.');
    } else if (uploadError.message?.includes('RLS')) {
      throw new Error('Akses ditolak oleh Row Level Security. Pastikan storage policy sudah benar.');
    } else {
      throw new Error(`Gagal mengunggah gambar: ${uploadError.message}`);
    }
  }

  const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik untuk gambar yang diunggah.');
  }

  return urlData.publicUrl;
};

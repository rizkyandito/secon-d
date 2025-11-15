import { supabase } from './supabaseClient';

export const uploadImage = async (file) => {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `menu-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error('Gagal mengunggah gambar.');
  }

  const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath);

  return data.publicUrl;
};

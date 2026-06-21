import { supabase } from './supabase';

export async function uploadAudio(file, { language, wpm }, onProgress) {
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const path = `${language}/${wpm}/${filename}`;

  const { data, error } = await supabase.storage
    .from('audio')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('audio')
    .getPublicUrl(data.path);

  if (onProgress) onProgress(100);

  return {
    url: urlData.publicUrl,
    path: data.path,
    filename,
  };
}

export async function deleteAudio(path) {
  const { error } = await supabase.storage
    .from('audio')
    .remove([path]);

  if (error) throw error;
}

export async function getAudioURL(path) {
  const { data } = supabase.storage
    .from('audio')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function listAudioFiles(language, wpm) {
  const { data, error } = await supabase.storage
    .from('audio')
    .list(`${language}/${wpm}`);

  if (error) throw error;

  const files = await Promise.all(
    (data || []).map(async item => ({
      name: item.name,
      path: `${language}/${wpm}/${item.name}`,
      url: getAudioURL(`${language}/${wpm}/${item.name}`),
    }))
  );

  return files;
}

// src/firebase/storage.js
// Audio file upload / download for dictation passages

import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll
} from 'firebase/storage';
import { storage } from './config';

// ─── Upload audio file with progress callback ────────────────────
// path format: audio/{language}/{wpm}/{filename}
export function uploadAudio(file, { language, wpm }, onProgress) {
  const ext      = file.name.split('.').pop();
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const path     = `audio/${language}/${wpm}/${filename}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'audio/mpeg',
    });

    task.on('state_changed',
      snapshot => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path, filename });
      }
    );
  });
}

// ─── Delete audio file ───────────────────────────────────────────
export async function deleteAudio(path) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

// ─── Get download URL by path ────────────────────────────────────
export async function getAudioURL(path) {
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
}

// ─── List all audio files in a folder ───────────────────────────
export async function listAudioFiles(language, wpm) {
  const folderRef = ref(storage, `audio/${language}/${wpm}`);
  const result    = await listAll(folderRef);
  const files     = await Promise.all(
    result.items.map(async item => ({
      name: item.name,
      path: item.fullPath,
      url:  await getDownloadURL(item),
    }))
  );
  return files;
}

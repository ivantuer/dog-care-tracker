import { get, set } from 'idb-keyval';
import { deletePhoto, downloadPhoto, uploadPhoto } from './sync-core';
import { vault } from './sync';

/** Crops an image to a centred square and shrinks it to a small JPEG data URL (about 15 to 30 KB), so it can ride along in the synced data. */
export async function toAvatar(file: File, size = 256): Promise<string> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size);
  bmp.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

/** The full picture for viewing: at most 1600 px on the long side, JPEG. Much smaller than a camera original, still sharp on a phone. */
export async function toFull(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.85));
}

const cacheKey = (id: string) => `dog-care-photo:${id}`;

/** Keeps the picture on this phone, so it opens instantly and offline. */
export const cachePhoto = (id: string, blob: Blob) => set(cacheKey(id), blob);

/** A displayable address for a full photo: from this phone if it is there, otherwise downloaded, decrypted and kept. Null if unavailable. */
export async function fullPhotoUrl(id: string): Promise<string | null> {
  let blob = await get<Blob>(cacheKey(id));
  if (!blob && vault.value) {
    try {
      const bytes = await downloadPhoto(vault.value, id);
      if (bytes) { blob = new Blob([bytes as BlobPart], { type: 'image/jpeg' }); await cachePhoto(id, blob); }
    } catch { /* offline or not synced yet: the thumbnail will do */ }
  }
  return blob ? URL.createObjectURL(blob) : null;
}

/** Uploads a new full photo (if given) and removes the one it replaces. Throws if the upload fails, so nothing half-saved is recorded. */
export async function storeFullPhoto(id: string | undefined, blob: Blob | undefined, oldId: string | undefined): Promise<void> {
  const v = vault.value;
  if (!v) return;
  if (id && blob) await uploadPhoto(v, id, new Uint8Array(await blob.arrayBuffer()));
  if (oldId && oldId !== id) await deletePhoto(v, oldId);
}

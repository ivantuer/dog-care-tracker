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

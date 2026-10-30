const LONGEST_SIDE = 1024;

export async function shrinkPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONGEST_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.88);
}

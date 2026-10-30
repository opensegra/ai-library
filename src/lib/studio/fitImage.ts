function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    if (!source.startsWith('data:')) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('A reference image could not be read.'));
    image.src = source;
  });
}

export async function fitImage(source: string, longestSide: number): Promise<string> {
  const image = await loadImage(source);
  const scale = Math.min(1, longestSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');

  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.9);
}

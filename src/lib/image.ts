/**
 * Komprimerer et foto i browseren før upload:
 * - skalerer ned til maks. 1280 px på den længste led
 * - gemmer som JPEG (kvalitet 0,8)
 * - tegning via canvas fjerner ALLE metadata, inkl. EXIF og GPS-position
 */
export async function compressImage(file: File, maxDim = 1280, quality = 0.8): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas understøttes ikke");
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ("close" in bitmap) bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kunne ikke komprimere billedet"))), "image/jpeg", quality),
  );
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      // Respekterer kameraets rotation, så billedet vender rigtigt.
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // falder tilbage til <img> nedenfor
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Komprimerer et foto i browseren før upload:
 * - skalerer ned til maks. 1280 px på den længste led
 * - gemmer som JPEG (kvalitet 0,8)
 * - tegning via canvas fjerner ALLE metadata, inkl. EXIF og GPS-position
 */
export async function compressImage(file: Blob, maxDim = 1280, quality = 0.8, quarterTurns = 0): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const turns = ((quarterTurns % 4) + 4) % 4;
  const sideways = turns % 2 === 1;

  const canvas = document.createElement("canvas");
  canvas.width = sideways ? h : w;
  canvas.height = sideways ? w : h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas understøttes ikke");
  // Drejer om midten (kvarte omgange med uret)
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((turns * Math.PI) / 2);
  ctx.drawImage(bitmap, -w / 2, -h / 2, w, h);
  if ("close" in bitmap) bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kunne ikke komprimere billedet"))), "image/jpeg", quality),
  );
}

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
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

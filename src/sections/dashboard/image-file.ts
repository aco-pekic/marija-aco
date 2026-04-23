export const IMAGE_UPLOAD_MAX_BYTES = 300 * 1024; // 300KB
export const IMAGE_UPLOAD_MAX_INPUT_BYTES = 25 * 1024 * 1024; // 25MB safety cap

export const IMAGE_UPLOAD_ACCEPT_ATTR = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.heic',
  '.heif',
].join(',');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.avif'];
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
]);
const HEIC_TYPES = new Set(['image/heic', 'image/heif']);

type Heic2AnyResult = Blob | Blob[];
type HeicToFn = (args: {
  blob: Blob;
  type: 'image/jpeg' | 'image/png';
  quality?: number;
}) => Promise<Blob>;

export type PreparedImage = {
  file: File;
  warning?: string;
};

function hasImageExtension(fileName: string) {
  const lowered = fileName.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lowered.endsWith(ext));
}

export function isImageCandidate(file: File) {
  const mime = file.type.toLowerCase();
  return (mime ? ALLOWED_MIME_TYPES.has(mime) : false) || hasImageExtension(file.name);
}

function isHeicOrHeif(file: File) {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  return HEIC_TYPES.has(fileType) || fileName.endsWith('.heic') || fileName.endsWith('.heif');
}

function isGif(file: File) {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  return fileType === 'image/gif' || fileName.endsWith('.gif');
}

function getErrorReason(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  const fallback = String(error ?? '');
  return fallback && fallback !== '[object Object]' ? fallback : 'nepoznata greška pri konverziji';
}

function fileWithExtension(file: File, blob: Blob, extension: 'jpg' | 'png') {
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'memory';
  const mimeType = extension === 'jpg' ? 'image/jpeg' : 'image/png';
  return new File([blob], `${baseName}.${extension}`, { type: mimeType });
}

function fileWithWebpExtension(file: File, blob: Blob) {
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'memory';
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
}

async function convertWithHeic2Any(file: File, format: 'image/jpeg' | 'image/png') {
  const { default: heic2any } = await import('heic2any');
  const converted = (await heic2any({
    blob: file,
    toType: format,
    quality: format === 'image/jpeg' ? 0.92 : undefined,
  })) as Heic2AnyResult;

  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error('converter returned empty image');
  }

  return format === 'image/jpeg' ? fileWithExtension(file, blob, 'jpg') : fileWithExtension(file, blob, 'png');
}

async function convertWithHeicTo(file: File, format: 'image/jpeg' | 'image/png') {
  const heicToModule = await import('heic-to');
  const heicTo = (heicToModule.heicTo ??
    (heicToModule.default as unknown as HeicToFn | undefined)) as HeicToFn;

  if (typeof heicTo !== 'function') {
    throw new Error('heic-to converter function not found');
  }

  const blob = await heicTo({
    blob: file,
    type: format,
    quality: format === 'image/jpeg' ? 0.92 : undefined,
  });

  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error('heic-to returned empty image');
  }

  return format === 'image/jpeg' ? fileWithExtension(file, blob, 'jpg') : fileWithExtension(file, blob, 'png');
}

async function convertWithNativeDecoder(file: File, format: 'image/jpeg' | 'image/png') {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('createImageBitmap is not available');
  }

  const bitmap = await createImageBitmap(file);

  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context is not available');

    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (nextBlob) => {
          if (nextBlob) {
            resolve(nextBlob);
            return;
          }
          reject(new Error('canvas conversion produced empty output'));
        },
        format,
        format === 'image/jpeg' ? 0.92 : undefined
      );
    });

    return format === 'image/jpeg'
      ? fileWithExtension(file, blob, 'jpg')
      : fileWithExtension(file, blob, 'png');
  } finally {
    bitmap.close();
  }
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function supportsCanvasMimeType(mimeType: string) {
  try {
    const canvas = document.createElement('canvas');
    const dataUrl = canvas.toDataURL(mimeType);
    return dataUrl.startsWith(`data:${mimeType}`);
  } catch {
    return false;
  }
}

async function createBitmapWithOrientation(file: File) {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('createImageBitmap is not available');
  }

  try {
    // `imageOrientation` is supported in modern browsers; TS libdom typing may not include it everywhere.
    return await createImageBitmap(file, { imageOrientation: 'from-image' } as unknown as ImageBitmapOptions);
  } catch {
    return await createImageBitmap(file);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('canvas encoding produced empty output'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

type CompressResult = { file: File; warning?: string };

async function compressImageToMaxBytes(file: File, maxBytes: number): Promise<CompressResult> {
  if (file.size <= maxBytes) return { file };

  if (isGif(file)) {
    throw new Error(`GIF images must be ≤ ${Math.round(maxBytes / 1024)}KB (can't auto-compress GIFs).`);
  }

  const supportsWebp = typeof document !== 'undefined' && supportsCanvasMimeType('image/webp');

  const inputLikelyPng = file.type.toLowerCase() === 'image/png' || file.name.toLowerCase().endsWith('.png');
  const outputMimeType = inputLikelyPng && supportsWebp ? 'image/webp' : 'image/jpeg';
  const outputExt = outputMimeType === 'image/webp' ? 'webp' : 'jpg';

  const bitmap = await createBitmapWithOrientation(file);

  try {
    const MAX_DIMENSION_START = 1920;
    const MIN_DIMENSION = 240;
    const QUALITY_STEPS = [0.88, 0.82, 0.76, 0.7, 0.64, 0.58, 0.52, 0.46, 0.4, 0.34];

    const originalMaxDimension = Math.max(bitmap.width, bitmap.height);
    const startMaxDimension = Math.min(originalMaxDimension, MAX_DIMENSION_START);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context is not available');

    for (let targetMaxDimension = startMaxDimension; ; targetMaxDimension = Math.floor(targetMaxDimension * 0.85)) {
      const scale = targetMaxDimension / originalMaxDimension;
      const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
      const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      for (const quality of QUALITY_STEPS) {
        const blob = await canvasToBlob(
          canvas,
          outputMimeType,
          outputMimeType === 'image/jpeg' || outputMimeType === 'image/webp' ? quality : undefined
        );

        if (blob.size <= maxBytes) {
          const nextFile =
            outputExt === 'webp' ? fileWithWebpExtension(file, blob) : fileWithExtension(file, blob, 'jpg');

          const warningParts: string[] = [];
          warningParts.push(`Compressed to ${formatBytes(blob.size)} (max ${formatBytes(maxBytes)}).`);

          if (nextFile.type !== file.type || nextFile.name !== file.name) {
            warningParts.push(`Format: ${nextFile.type}.`);
          }

          if (bitmap.width !== targetWidth || bitmap.height !== targetHeight) {
            warningParts.push(`Size: ${targetWidth}×${targetHeight}.`);
          }

          warningParts.push(`Was ${formatBytes(file.size)}.`);

          const needsTransparencyNotice = inputLikelyPng && !supportsWebp;
          if (needsTransparencyNotice) {
            warningParts.push('Note: PNG transparency may be lost in JPEG.');
          }

          return { file: nextFile, warning: warningParts.join(' ') };
        }
      }

      if (targetMaxDimension <= MIN_DIMENSION) break;
    }

    throw new Error(`Could not compress image to ≤ ${Math.round(maxBytes / 1024)}KB. Try a smaller image.`);
  } finally {
    bitmap.close();
  }
}

export async function prepareImageForDisplayAndUpload(file: File): Promise<PreparedImage> {
  if (!isImageCandidate(file)) {
    throw new Error('Izaberi JPG, PNG, WebP, AVIF, HEIC/HEIF ili GIF sliku.');
  }

  if (file.size > IMAGE_UPLOAD_MAX_INPUT_BYTES) {
    throw new Error(
      `Slika je prevelika (maksimalno ${formatBytes(IMAGE_UPLOAD_MAX_INPUT_BYTES)} pre obrade).`
    );
  }

  if (!isHeicOrHeif(file)) {
    const compressed = await compressImageToMaxBytes(file, IMAGE_UPLOAD_MAX_BYTES);
    return compressed.warning ? { file: compressed.file, warning: compressed.warning } : { file: compressed.file };
  }

  const attempts: Array<{ label: string; run: () => Promise<File> }> = [
    { label: 'heic-to jpeg', run: () => convertWithHeicTo(file, 'image/jpeg') },
    { label: 'heic-to png', run: () => convertWithHeicTo(file, 'image/png') },
    { label: 'heic2any jpeg', run: () => convertWithHeic2Any(file, 'image/jpeg') },
    { label: 'heic2any png', run: () => convertWithHeic2Any(file, 'image/png') },
    { label: 'native decode jpeg', run: () => convertWithNativeDecoder(file, 'image/jpeg') },
    { label: 'native decode png', run: () => convertWithNativeDecoder(file, 'image/png') },
  ];

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const converted = await attempt.run();
      const compressed = await compressImageToMaxBytes(converted, IMAGE_UPLOAD_MAX_BYTES);
      return compressed.warning ? { file: compressed.file, warning: compressed.warning } : { file: compressed.file };
    } catch (error) {
      errors.push(`${attempt.label}: ${getErrorReason(error)}`);
    }
  }

  const warning = errors.length
    ? `HEIC konverzija nije bila moguća (${errors.join(' | ')}). I dalje možeš da sačuvaš, ali prikaz možda neće raditi svuda.`
    : 'HEIC konverzija nije bila moguća u ovom pregledaču. I dalje možeš da sačuvaš, ali prikaz možda neće raditi svuda.';

  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error(
      `Ova HEIC slika je ${formatBytes(file.size)}; ne mogu da je konvertujem/kompresujem na ≤ ${formatBytes(
        IMAGE_UPLOAD_MAX_BYTES
      )} u ovom pregledaču.`
    );
  }

  return { file, warning };
}

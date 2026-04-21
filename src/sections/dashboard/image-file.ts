const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.avif'];
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
  return file.type.startsWith('image/') || hasImageExtension(file.name);
}

function isHeicOrHeif(file: File) {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  return HEIC_TYPES.has(fileType) || fileName.endsWith('.heic') || fileName.endsWith('.heif');
}

function getErrorReason(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  const fallback = String(error ?? '');
  return fallback && fallback !== '[object Object]' ? fallback : 'unknown conversion error';
}

function fileWithExtension(file: File, blob: Blob, extension: 'jpg' | 'png') {
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'memory';
  const mimeType = extension === 'jpg' ? 'image/jpeg' : 'image/png';
  return new File([blob], `${baseName}.${extension}`, { type: mimeType });
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

export async function prepareImageForDisplayAndUpload(file: File): Promise<PreparedImage> {
  if (!isHeicOrHeif(file)) return { file };

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
      return { file: await attempt.run() };
    } catch (error) {
      errors.push(`${attempt.label}: ${getErrorReason(error)}`);
    }
  }

  return {
    file,
    warning: errors.length
      ? `HEIC conversion wasn't possible (${errors.join(' | ')}). You can still save, but preview/display may not work everywhere.`
      : "HEIC conversion wasn't possible in this browser. You can still save, but preview/display may not work everywhere.",
  };
}

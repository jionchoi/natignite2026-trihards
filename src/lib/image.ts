export interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

export async function fileToDataUrl(file: File): Promise<LoadedImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const { width, height } = await new Promise<{
    width: number;
    height: number;
  }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = dataUrl;
  });

  return { dataUrl, width, height };
}

export function dataUrlToBase64(dataUrl: string): {
  base64: string;
  mimeType: string;
} {
  if (!dataUrl.startsWith("data:")) throw new Error("Invalid data URL");
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) throw new Error("Invalid data URL");
  const header = dataUrl.slice(5, commaIdx);
  if (!header.endsWith(";base64")) throw new Error("Invalid data URL");
  const mimeType = header.slice(0, -";base64".length);
  const base64 = dataUrl.slice(commaIdx + 1);
  return { mimeType, base64 };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

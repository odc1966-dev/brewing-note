// 사진을 긴 변 1280px JPEG 로 줄인다(휴대폰 사진 3~10MB → 보통 200~400KB).
const MAX = 1280;
const QUALITY = 0.82;

export async function shrinkPhoto(file: Blob): Promise<Blob> {
  let src: CanvasImageSource & { width: number; height: number };
  let close = () => {};
  try {
    // imageOrientation: 휴대폰 사진의 회전(EXIF) 정보를 반영
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    src = bmp;
    close = () => bmp.close();
  } catch {
    // createImageBitmap 이 안 되는 브라우저(구형 사파리 등)
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    URL.revokeObjectURL(url);
    src = img;
  }
  const k = Math.min(1, MAX / Math.max(src.width, src.height));
  const w = Math.round(src.width * k);
  const h = Math.round(src.height * k);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(src, 0, 0, w, h);
  close();
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("사진 변환 실패"))), "image/jpeg", QUALITY));
}

export function loadImage(url: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

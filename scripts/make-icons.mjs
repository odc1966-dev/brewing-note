// 앱 아이콘 PNG 생성 (외부 라이브러리 없이 zlib 로 PNG 인코딩)
// 에스프레소색 바탕 + 크림색 원두. node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(size, px) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const BG = [58, 42, 32];
const BEAN = [239, 228, 212];
const SLIT = [181, 101, 43];

/** 단위 좌표(-1..1)에서 색을 돌려준다. rounded: 모서리를 둥글게(일반 아이콘) / false: 꽉 채움(maskable) */
function shade(u, v, rounded, scale) {
  if (rounded) {
    const r = 0.36;
    const qx = Math.max(Math.abs(u) - (1 - r), 0);
    const qy = Math.max(Math.abs(v) - (1 - r), 0);
    if (qx * qx + qy * qy > r * r) return null;
  }
  // 원두: 기울어진 타원
  const a = -0.6;
  const x = (u * Math.cos(a) - v * Math.sin(a)) / scale;
  const y = (u * Math.sin(a) + v * Math.cos(a)) / scale;
  const ex = x / 0.42;
  const ey = y / 0.6;
  if (ex * ex + ey * ey <= 1) {
    // 가운데 S자 홈
    const cx = 0.09 * Math.sin((y / 0.6) * Math.PI);
    if (Math.abs(x - cx) < 0.045 && Math.abs(y) < 0.5) return SLIT;
    return BEAN;
  }
  return BG;
}

function render(size, { rounded, scale }) {
  const px = Buffer.alloc(size * size * 4);
  const S = 4; // 슈퍼샘플링
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy++)
        for (let sx = 0; sx < S; sx++) {
          const u = ((x + (sx + 0.5) / S) / size) * 2 - 1;
          const v = ((y + (sy + 0.5) / S) / size) * 2 - 1;
          const c = shade(u, v, rounded, scale);
          if (c) (r += c[0]), (g += c[1]), (b += c[2]), (a += 1);
        }
      const i = (y * size + x) * 4;
      const n = S * S;
      px[i] = a ? r / a : 0;
      px[i + 1] = a ? g / a : 0;
      px[i + 2] = a ? b / a : 0;
      px[i + 3] = (a / n) * 255;
    }
  return png(size, px);
}

const out = new URL("../public/", import.meta.url);
writeFileSync(new URL("icon-192.png", out), render(192, { rounded: true, scale: 1 }));
writeFileSync(new URL("icon-512.png", out), render(512, { rounded: true, scale: 1 }));
// maskable: 안전 영역(가운데 80%) 안에 들어가도록 작게, 배경은 꽉 채움
writeFileSync(new URL("icon-maskable-512.png", out), render(512, { rounded: false, scale: 0.72 }));
writeFileSync(new URL("apple-touch-icon.png", out), render(180, { rounded: false, scale: 0.85 }));
console.log("icons written");

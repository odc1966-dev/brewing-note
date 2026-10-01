// 공유용 카드 이미지(1080×1350, 인스타 세로 비율)를 캔버스로 그린다.
import { FLAVOR_AXES, gearKindLabel, tagColor, tagLabel } from "./constants";
import type { Bean, Brew, CafeLog, Flavor, Gear } from "./types";
import { fmtDate, fmtTime, ratio } from "./util";

const W = 1080;
const H = 1350;
const FONT = `"Pretendard","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif`;
const C = {
  bg: "#f5efe6",
  card: "#fffdf9",
  ink: "#2e211a",
  sub: "#8a7867",
  line: "#e7dccd",
  accent: "#b5652b",
  espresso: "#3a2a20",
  star: "#e0a23a",
};

type Ctx = CanvasRenderingContext2D;

const font = (ctx: Ctx, size: number, weight = 500) => (ctx.font = `${weight} ${size}px ${FONT}`);

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: Ctx, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function wrap(ctx: Ctx, text: string, maxW: number, maxLines: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const ch of para) {
      if (ctx.measureText(line + ch).width > maxW) {
        lines.push(line);
        line = ch;
      } else line += ch;
    }
    lines.push(line);
  }
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = fitText(ctx, cut[maxLines - 1] + "…", maxW);
    return cut;
  }
  return lines;
}

function star(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

function stars(ctx: Ctx, x: number, cy: number, value: number, r = 22) {
  for (let i = 0; i < 5; i++) {
    const cx = x + r + i * r * 2.3;
    star(ctx, cx, cy, r);
    ctx.fillStyle = C.line;
    ctx.fill();
    const fill = Math.max(0, Math.min(1, value - i));
    if (fill > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - r, cy - r, r * 2 * fill, r * 2);
      ctx.clip();
      star(ctx, cx, cy, r);
      ctx.fillStyle = C.star;
      ctx.fill();
      ctx.restore();
    }
  }
}

function radar(ctx: Ctx, flavor: Flavor, cx: number, cy: number, r: number) {
  const n = FLAVOR_AXES.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  ctx.lineWidth = 2;
  for (let k = 1; k <= 5; k++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) ctx.lineTo(cx + Math.cos(ang(i)) * r * (k / 5), cy + Math.sin(ang(i)) * r * (k / 5));
    ctx.closePath();
    ctx.strokeStyle = C.line;
    ctx.stroke();
  }
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r);
    ctx.stroke();
  }
  ctx.beginPath();
  FLAVOR_AXES.forEach((a, i) => {
    const v = (flavor[a.key] ?? 0) / 5;
    ctx.lineTo(cx + Math.cos(ang(i)) * r * v, cy + Math.sin(ang(i)) * r * v);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(181,101,43,0.22)";
  ctx.fill();
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();
  font(ctx, 26, 700);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  FLAVOR_AXES.forEach((a, i) => {
    ctx.fillStyle = C.ink;
    ctx.fillText(a.label, cx + Math.cos(ang(i)) * (r + 38), cy + Math.sin(ang(i)) * (r + 32));
  });
}

function chips(ctx: Ctx, tags: string[], x: number, y: number, maxW: number) {
  font(ctx, 26, 600);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  let cx = x;
  for (const t of tags) {
    const label = tagLabel(t);
    const w = ctx.measureText(label).width + 36;
    if (cx + w > x + maxW) break;
    const col = tagColor(t);
    rr(ctx, cx, y, w, 50, 25);
    ctx.fillStyle = col + "1f";
    ctx.fill();
    ctx.strokeStyle = col + "88";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.fillText(label, cx + 18, y + 26);
    cx += w + 12;
  }
}

function frame(ctx: Ctx) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  rr(ctx, 60, 60, W - 120, H - 120, 48);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function footer(ctx: Ctx, date: string, nickname: string) {
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, H - 170);
  ctx.lineTo(W - 120, H - 170);
  ctx.stroke();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  font(ctx, 30, 800);
  ctx.fillStyle = C.espresso;
  ctx.fillText("Brewing note", 120, H - 118);
  font(ctx, 26, 500);
  ctx.fillStyle = C.sub;
  ctx.textAlign = "right";
  ctx.fillText([nickname, fmtDate(date)].filter(Boolean).join(" · "), W - 120, H - 118);
}

function header(ctx: Ctx, kicker: string, title: string, sub: string, rating: number, y0 = 168, titleSize = 60) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  font(ctx, 28, 700);
  ctx.fillStyle = C.accent;
  ctx.fillText(kicker, W / 2, y0);
  font(ctx, titleSize, 800);
  ctx.fillStyle = C.ink;
  ctx.fillText(fitText(ctx, title, W - 260), W / 2, y0 + 80);
  font(ctx, 30, 500);
  ctx.fillStyle = C.sub;
  ctx.fillText(fitText(ctx, sub, W - 260), W / 2, y0 + 128);
  if (rating > 0) stars(ctx, W / 2 - 22 * 2.3 * 2.5 + 2, y0 + 180, rating);
}

/** 카드 위쪽에 사진을 꽉 채워(가운데 기준 잘라) 그린다. 위 모서리만 둥글게 */
function photoTop(ctx: Ctx, img: CanvasImageSource & { width: number; height: number }, h: number) {
  const x = 60, y = 60, w = W - 120, r = 48;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.clip();
  const k = Math.max(w / img.width, h / img.height);
  const dw = img.width * k, dh = img.height * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function cellsGrid(ctx: Ctx, cells: [string, string][], gy: number, ch: number, gap: number) {
  const gx = 120;
  const gw = (W - 240 - 2 * 20) / 3;
  cells.forEach(([k, v], i) => {
    const x = gx + (i % 3) * (gw + 20);
    const y = gy + Math.floor(i / 3) * (ch + gap);
    rr(ctx, x, y, gw, ch, 22);
    ctx.fillStyle = C.bg;
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    font(ctx, 24, 600);
    ctx.fillStyle = C.sub;
    ctx.fillText(k, x + gw / 2, y + ch * 0.37);
    font(ctx, 40, 800);
    ctx.fillStyle = C.ink;
    ctx.fillText(fitText(ctx, v, gw - 24), x + gw / 2, y + ch * 0.81);
  });
}

function centeredChips(ctx: Ctx, tags: string[], y: number) {
  font(ctx, 26, 600);
  const total = tags.reduce((s, t) => s + ctx.measureText(tagLabel(t)).width + 48, -12);
  chips(ctx, tags, Math.max(120, W / 2 - total / 2), y, W - 240);
}

function memoLines(ctx: Ctx, memo: string, y: number, maxLines: number, size = 28) {
  if (!memo || maxLines < 1) return;
  font(ctx, size, 500);
  ctx.fillStyle = C.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const lh = Math.round(size * 1.38);
  wrap(ctx, memo, W - 280, maxLines).forEach((l, i) => ctx.fillText(l, W / 2, y + i * lh));
}

type Img = (CanvasImageSource & { width: number; height: number }) | null | undefined;

export function drawBrewCard(canvas: HTMLCanvasElement, brew: Brew, bean: Bean | undefined, gear: Gear[], nickname: string, photo?: Img) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  frame(ctx);
  const beanSub = [bean?.roaster, bean?.origin, bean?.process, bean?.roast].filter(Boolean).join(" · ");
  const cells: [string, string][] = [
    ["원두", brew.dose != null ? `${brew.dose}g` : "–"],
    ["물", brew.water != null ? `${brew.water}g` : "–"],
    ["수온", brew.temp != null ? `${brew.temp}°C` : "–"],
    ["분쇄도", brew.grind || "–"],
    ["시간", brew.time != null ? fmtTime(brew.time) : "–"],
    ["비율", ratio(brew.dose, brew.water) ?? "–"],
  ];

  if (photo) {
    // 사진형: 사진 → 제목 → 변수 → 컵노트 → 메모 (레이더 대신 사진)
    photoTop(ctx, photo, 500);
    header(ctx, brew.method.toUpperCase(), bean?.name || "이름 없는 원두", beanSub || " ", brew.rating, 616, 52);
    cellsGrid(ctx, cells, 830, 100, 16);
    let y = 1064;
    if (brew.tags.length) {
      centeredChips(ctx, brew.tags, y);
      y += 84;
    } else y += 30;
    memoLines(ctx, brew.memo, y, y > 1120 ? 1 : 2, 26);
    footer(ctx, brew.date, nickname);
    return;
  }

  header(ctx, brew.method.toUpperCase(), bean?.name || "이름 없는 원두", beanSub || " ", brew.rating);
  cellsGrid(ctx, cells, 410, 108, 20);
  radar(ctx, brew.flavor, W / 2, 872, 150);

  // 아래쪽 내용(장비 · 컵노트 · 메모)은 구분선(H-170) 위까지만
  let y = 1062;
  const used = gear.filter((g) => brew.gearIds.includes(g.id));
  if (used.length) {
    font(ctx, 24, 500);
    ctx.fillStyle = C.sub;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(fitText(ctx, used.map((g) => `${gearKindLabel(g.kind)} ${g.name}`).join(" · "), W - 240), W / 2, y + 8);
    y += 34;
  }
  if (brew.tags.length) {
    centeredChips(ctx, brew.tags, y);
    y += 72;
  }
  memoLines(ctx, brew.memo, y + 22, Math.max(1, Math.min(2, Math.floor((H - 200 - y) / 38))));
  footer(ctx, brew.date, nickname);
}

export function drawCafeCard(canvas: HTMLCanvasElement, log: CafeLog, nickname: string, photo?: Img) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  frame(ctx);
  const extra = [log.beanInfo, log.price != null ? `${log.price.toLocaleString()}원` : ""].filter(Boolean).join(" · ");

  if (photo) {
    photoTop(ctx, photo, 600);
    header(ctx, "CAFE", log.menu || "메뉴", [log.cafe, extra].filter(Boolean).join(" · ") || " ", log.rating, 718, 56);
    let y = 950;
    if (log.tags.length) {
      centeredChips(ctx, log.tags, y);
      y += 100;
    } else y += 40;
    memoLines(ctx, log.memo, y, y > 1060 ? 2 : 3, 28);
    footer(ctx, log.date, nickname);
    return;
  }

  header(ctx, "CAFE", log.menu || "메뉴", log.cafe || " ", log.rating);
  if (extra) {
    font(ctx, 28, 500);
    ctx.fillStyle = C.sub;
    ctx.textAlign = "center";
    ctx.fillText(fitText(ctx, extra, W - 260), W / 2, 420);
  }
  radar(ctx, log.flavor, W / 2, 700, 190);
  let y = 960;
  if (log.tags.length) {
    centeredChips(ctx, log.tags, y);
    y += 90;
  }
  memoLines(ctx, log.memo, y, 3, 30);
  footer(ctx, log.date, nickname);
}

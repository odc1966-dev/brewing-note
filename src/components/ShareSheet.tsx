"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { GhostButton, Modal, PrimaryButton, Segment } from "./ui";
import { photoURL } from "@/lib/store";
import { loadImage } from "@/lib/photo";

/** draw(canvas) 로 카드를 그려 미리 보여 주고, 공유 또는 PNG 저장 */
export default function ShareSheet({
  open,
  onClose,
  draw,
  fileName,
  photoId,
}: {
  open: boolean;
  onClose: () => void;
  draw: (c: HTMLCanvasElement, photo?: HTMLImageElement | null) => void;
  fileName: string;
  photoId?: string; // 있으면 "사진 넣기" 선택지를 보여 준다(첫 번째 사진)
}) {
  const [withPhoto, setWithPhoto] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setMsg("");
    const c = document.createElement("canvas");
    canvasRef.current = c;
    // 웹폰트가 늦게 오면 대체 글꼴로 그려지므로 fonts.ready 를 기다린다
    setUrl("");
    let alive = true;
    (async () => {
      await (document.fonts?.ready ?? Promise.resolve());
      let img: HTMLImageElement | null = null;
      if (photoId && withPhoto) {
        const u = await photoURL(photoId);
        if (u) img = await loadImage(u).catch(() => null);
      }
      if (!alive) return;
      draw(c, img);
      setUrl(c.toDataURL("image/png"));
    })();
    return () => {
      alive = false;
    };
  }, [open, draw, photoId, withPhoto]);

  const blob = () => new Promise<Blob | null>((res) => canvasRef.current?.toBlob(res, "image/png"));

  async function share() {
    const b = await blob();
    if (!b) return;
    const file = new File([b], fileName, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Brewing note" });
      } catch {
        /* 사용자가 취소 */
      }
    } else {
      save();
      setMsg("이 브라우저는 바로 공유를 지원하지 않아 이미지로 저장했어요.");
    }
  }

  function save() {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="mb-3 text-center text-[17px] font-bold">레시피 카드</h2>
      {url ? (
        <img src={url} alt="공유 카드 미리보기" className="mx-auto w-full max-w-[360px] rounded-2xl shadow" />
      ) : (
        <div className="mx-auto aspect-[4/5] w-full max-w-[360px] animate-pulse rounded-2xl bg-cream" />
      )}
      {photoId && (
        <div className="mx-auto mt-3 max-w-[360px]">
          <Segment
            options={[
              { id: "photo", label: "사진 넣기" },
              { id: "chart", label: "맛 차트" },
            ]}
            value={withPhoto ? "photo" : "chart"}
            onChange={(v) => setWithPhoto(v === "photo")}
          />
        </div>
      )}
      {msg && <p className="mt-3 text-center text-sm text-sub">{msg}</p>}
      <div className="mt-4 space-y-2">
        <PrimaryButton onClick={share} disabled={!url}>
          <Share2 size={20} /> 공유하기
        </PrimaryButton>
        <div className="grid grid-cols-2 gap-2">
          <GhostButton onClick={save} disabled={!url}>
            <Download size={18} /> 이미지 저장
          </GhostButton>
          <GhostButton onClick={onClose}>닫기</GhostButton>
        </div>
      </div>
    </Modal>
  );
}

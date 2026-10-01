"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { asset } from "@/lib/base";
import { WHEEL } from "@/lib/flavorWheel";
import { GhostButton, Modal } from "./ui";

const PMC = "https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420/";
const LICENSE = "https://creativecommons.org/licenses/by-nc-nd/4.0/";

/** 공식 플레이버 휠 이미지(원본 그대로) + 읽는 법 */
export default function FlavorWheelSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [zoom, setZoom] = useState(false);
  const [broken, setBroken] = useState(false);
  // 선명도를 높인 2배 해상도 판(scripts/upscale-wheel.ps1). 못 불러오면 원본으로
  const [src, setSrc] = useState(asset("/flavor-wheel-hd.jpg"));

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-center text-[17px] font-bold">커피 플레이버 휠</h2>
      <p className="mt-0.5 text-center text-xs text-sub">SCA·WCR Coffee Taster&apos;s Flavor Wheel (2016)</p>

      {broken ? (
        <div className="mt-3 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-sub">
          휠 이미지 파일이 아직 없어요.
          <br />
          <a href={PMC} target="_blank" rel="noreferrer" className="text-accent underline">
            논문 Figure 5에서 보기
          </a>
        </div>
      ) : (
        <div className={`mt-3 rounded-2xl bg-white ${zoom ? "overflow-auto" : "overflow-hidden"}`} style={{ maxHeight: "62dvh" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="SCA·WCR 커피 테이스터 플레이버 휠. 안쪽에서 바깥쪽으로 9개 범주, 2단계, 3단계 용어가 배열되어 있다."
            onError={() => (src.includes("-hd") ? setSrc(asset("/flavor-wheel.jpg")) : setBroken(true))}
            className="block"
            style={zoom ? { width: "300%", maxWidth: "none" } : { width: "100%" }}
          />
        </div>
      )}
      {!broken && (
        <button type="button" onClick={() => setZoom((z) => !z)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-card py-2.5 text-sm font-semibold">
          {zoom ? <ZoomOut size={17} /> : <ZoomIn size={17} />} {zoom ? "한눈에 보기" : "크게 보기 (밀어서 이동)"}
        </button>
      )}
      <p className="mt-2 text-[11px] leading-snug text-sub">
        © 2016 SCAA(현 SCA) &amp; World Coffee Research.{" "}
        <a href={LICENSE} target="_blank" rel="noreferrer" className="underline">
          CC BY-NC-ND 4.0
        </a>
        . 출처: Spencer M 외, J Food Sci 2016;81(12):S2997–S3005, Figure 5 (
        <a href={PMC} target="_blank" rel="noreferrer" className="underline">
          PMC5215420
        </a>
        ). 내용은 수정하지 않았고, 화면 표시를 위해 해상도만 2배로 변환했습니다.
      </p>

      <section className="mt-4 space-y-2 text-[14px] leading-relaxed">
        <h3 className="font-bold">읽는 법</h3>
        <p>
          <b>가운데에서 바깥으로</b> 읽어요. 먼저 안쪽 9개 큰 범주 중 느껴지는 쪽(예: 과일)을 찾고, 더 구체적으로 느껴지면 바깥으로
          나가(베리 → 블루베리) 고르면 돼요. 확실하지 않으면 큰 범주에서 멈춰도 괜찮아요.
        </p>
        <p>비슷한 맛은 가까이, 다른 맛은 멀리 놓여 있어요. 예를 들어 과일 옆에 꽃·새콤·발효가 있고, 로스티 옆에 향신료·견과·코코아가 있어요.</p>
        <p className="text-sub">
          ‘기타’의 종이·퀴퀴함·화학적 노트나 ‘탄 향’은 흔히 보관·로스팅 문제의 신호로 봐요(업계 경험칙). 기록해 두면 원인을 찾을 때 도움이 돼요.
        </p>

        <h3 className="pt-2 font-bold">어떻게 만들어졌나</h3>
        <p>
          WCR 감각 용어집(Sensory Lexicon, 약 110개 속성)의 맛 용어 99개를 전문가 72명이 맛보지 않고 비슷한 것끼리 묶었고(single free sorting),
          그 결과를 계층적 군집분석(AHC)으로 9개 범주·3단계로, 다차원척도법(MDS)으로 휠 위의 배치로 정했어요. 이후 SCA·WCR 전문가가 일부 상위 용어를
          보완했어요.
        </p>
        <p className="text-xs text-sub">근거: Spencer, Sage, Velez, Guinard (2016), Journal of Food Science — 전문가 분류 데이터를 통계로 정리한 방법론 연구</p>

        <h3 className="pt-2 font-bold">9개 큰 범주</h3>
        <div className="flex flex-wrap gap-1.5">
          {WHEEL.map((t) => (
            <span key={t.en} className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: t.color }}>
              {t.ko} <span className="opacity-80">{t.en}</span>
            </span>
          ))}
        </div>
        <p className="text-xs text-sub">앱의 범주 색과 한국어 이름은 앱에서 정한 것이고, 공식 휠의 색·번역과 다를 수 있어요.</p>
      </section>

      <GhostButton className="mt-4 w-full" onClick={onClose}>
        닫기
      </GhostButton>
    </Modal>
  );
}

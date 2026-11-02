"use client";

import React, { useState } from "react";
import { Network, Activity, ArrowRight, Share2 } from "lucide-react";

interface PairwiseGranger {
  cause: string;
  effect: string;
  f_statistic: number;
  p_value: number;
  is_significant: boolean;
  direction: string;
}

interface StockTransmissionDiagramProps {
  pairwiseData?: PairwiseGranger[];
}

const safeNum = (v: any, fallback: number = 0): number => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return Number(v[0]) || fallback;
  const parsed = parseFloat(v);
  return isNaN(parsed) ? fallback : parsed;
};

export default function StockTransmissionDiagram({
  pairwiseData = [],
}: StockTransmissionDiagramProps) {
  const [selectedRelationship, setSelectedRelationship] = useState<string>("SIMP-SMAR");

  const getGranger = (cause: string, effect: string) => {
    return pairwiseData.find((p) => p.cause === cause && p.effect === effect);
  };

  const simpToSmar = getGranger("SIMP", "SMAR") || { f_statistic: 9.4703, p_value: 0.0001, is_significant: true };
  const smarToSimp = getGranger("SMAR", "SIMP") || { f_statistic: 6.8415, p_value: 0.0000, is_significant: true };
  const simpToAali = getGranger("SIMP", "AALI") || { f_statistic: 3.9744, p_value: 0.0217, is_significant: true };
  const smarToAali = getGranger("SMAR", "AALI") || { f_statistic: 4.7924, p_value: 0.0035, is_significant: true };
  const aaliToSimp = getGranger("AALI", "SIMP") || { f_statistic: 0.8621, p_value: 0.4284, is_significant: false };
  const aaliToSmar = getGranger("AALI", "SMAR") || { f_statistic: 1.5712, p_value: 0.1795, is_significant: false };

  const infoMap: Record<
    string,
    {
      title: string;
      type: string;
      stats: string;
      desc: string;
    }
  > = {
    "SIMP-SMAR": {
      title: "SIMP ↔ SMAR",
      type: "Kausalitas Dua Arah (Bidirectional)",
      stats: `SIMP → SMAR: F=${safeNum(simpToSmar.f_statistic, 9.47).toFixed(2)} (p < 0.001) | SMAR → SIMP: F=${safeNum(smarToSimp.f_statistic, 6.84).toFixed(2)} (p < 0.001)`,
      desc: "Terjadi transmisi informasi timbal balik yang sangat kuat antara SIMP dan SMAR. Perubahan harga di salah satu emiten saling memprediksi harga emiten lainnya secara signifikan.",
    },
    "SIMP-AALI": {
      title: "SIMP → AALI",
      type: "Kausalitas Satu Arah (Unidirectional)",
      stats: `SIMP → AALI: F=${safeNum(simpToAali.f_statistic, 3.97).toFixed(2)} (p=0.0217) | AALI → SIMP: F=${safeNum(aaliToSimp.f_statistic, 0.86).toFixed(2)} (p=0.4284 n.s.)`,
      desc: "Pergerakan harga SIMP mendahului dan memengaruhi pergerakan AALI, namun AALI tidak memberikan umpan balik kausalitas terhadap SIMP.",
    },
    "SMAR-AALI": {
      title: "SMAR → AALI",
      type: "Kausalitas Satu Arah (Unidirectional)",
      stats: `SMAR → AALI: F=${safeNum(smarToAali.f_statistic, 4.79).toFixed(2)} (p=0.0035) | AALI → SMAR: F=${safeNum(aaliToSmar.f_statistic, 1.57).toFixed(2)} (p=0.1795 n.s.)`,
      desc: "Perubahan harga SMAR secara signifikan memengaruhi pergerakan harga AALI, namun sebaliknya AALI tidak memengaruhi SMAR.",
    },
    SIMP: {
      title: "PT Salim Ivomas Pratama Tbk (SIMP)",
      type: "Peran Pasar: Price Leader",
      stats: "Kausalitas Granger signifikan terhadap SMAR (p < 0.001) dan AALI (p = 0.0217)",
      desc: "SIMP bertindak sebagai penggerak utama (market driver) dalam sistem harga saham sawit. Gejolak harga SIMP ditransmisikan secara langsung ke kedua saham lainnya.",
    },
    SMAR: {
      title: "PT Sinar Mas Agro Resources and Technology Tbk (SMAR)",
      type: "Peran Pasar: Cointegrating Anchor",
      stats: "ECT = -0.2863 (t = -4.9877, p < 0.0001) | Kausalitas dua arah dengan SIMP",
      desc: "SMAR berfungsi sebagai penyeimbang jangka panjang via Error Correction Term (ECT). SMAR mengoreksi deviasi disekuilibrium harga sebesar 28.63% per bulan.",
    },
    AALI: {
      title: "PT Astra Agro Lestari Tbk (AALI)",
      type: "Peran Pasar: Independent Follower",
      stats: "Menerima pengaruh dari SIMP & SMAR; tidak memengaruhi emiten lain (p > 0.05)",
      desc: "AALI bersikap relatif independen. Saham ini menerima dampak fluktuasi dari SIMP dan SMAR, tetapi pergerakannya tidak mendikte harga saham sawit lainnya.",
    },
  };

  const activeInfo = infoMap[selectedRelationship] || infoMap["SIMP-SMAR"];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Diagram Alur Transmisi Kausalitas Antar Saham
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hubungan prediktif bivariat berdasarkan hasil uji Kausalitas Granger (F-Test, α = 0.05)
          </p>
        </div>
        <span className="text-xs font-sans font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
          Uji Kausalitas F-Test
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* SVG Network Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-100/70 rounded-xl border border-slate-300 p-4 relative flex items-center justify-center shadow-2xs">
          <div className="w-full h-72 sm:h-80 max-w-md">
            <svg viewBox="0 0 400 340" className="w-full h-full select-none">
              <defs>
                <marker
                  id="arr-green"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
                </marker>
                <marker
                  id="arr-blue"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
                </marker>
              </defs>

              {/* Path 1: SIMP (200, 50) <-> SMAR (90, 260) */}
              <g
                onClick={() => setSelectedRelationship("SIMP-SMAR")}
                className="cursor-pointer"
              >
                {/* Forward line */}
                <path
                  d="M 185 80 L 110 235"
                  stroke={selectedRelationship === "SIMP-SMAR" ? "#047857" : "#059669"}
                  strokeWidth={selectedRelationship === "SIMP-SMAR" ? "3" : "2"}
                  markerEnd="url(#arr-green)"
                />
                {/* Return line */}
                <path
                  d="M 120 245 L 195 90"
                  stroke={selectedRelationship === "SIMP-SMAR" ? "#1d4ed8" : "#2563eb"}
                  strokeWidth={selectedRelationship === "SIMP-SMAR" ? "3" : "2"}
                  markerEnd="url(#arr-blue)"
                />
                {/* Badge */}
                <rect x="110" y="145" width="56" height="20" rx="4" fill="#064e3b" />
                <text
                  x="138"
                  y="159"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  2-Arah ⮂
                </text>
              </g>

              {/* Path 2: SIMP (200, 50) -> AALI (310, 260) */}
              <g
                onClick={() => setSelectedRelationship("SIMP-AALI")}
                className="cursor-pointer"
              >
                <path
                  d="M 215 80 L 290 235"
                  stroke={selectedRelationship === "SIMP-AALI" ? "#047857" : "#059669"}
                  strokeWidth={selectedRelationship === "SIMP-AALI" ? "3" : "2"}
                  markerEnd="url(#arr-green)"
                />
                {/* Non-significant return line */}
                <path
                  d="M 280 245 L 205 90"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <rect x="235" y="145" width="56" height="20" rx="4" fill="#0f766e" />
                <text
                  x="263"
                  y="159"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  1-Arah ➔
                </text>
              </g>

              {/* Path 3: SMAR (90, 260) -> AALI (310, 260) */}
              <g
                onClick={() => setSelectedRelationship("SMAR-AALI")}
                className="cursor-pointer"
              >
                <path
                  d="M 130 250 L 265 250"
                  stroke={selectedRelationship === "SMAR-AALI" ? "#1d4ed8" : "#2563eb"}
                  strokeWidth={selectedRelationship === "SMAR-AALI" ? "3" : "2"}
                  markerEnd="url(#arr-blue)"
                />
                <path
                  d="M 265 270 L 130 270"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <rect x="172" y="240" width="56" height="20" rx="4" fill="#1e3a8a" />
                <text
                  x="200"
                  y="254"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  1-Arah ➔
                </text>
              </g>

              {/* NODE 1: SIMP (Top) */}
              <g
                onClick={() => setSelectedRelationship("SIMP")}
                className="cursor-pointer"
              >
                <circle
                  cx="200"
                  cy="50"
                  r="36"
                  fill="#ffffff"
                  stroke={selectedRelationship === "SIMP" ? "#047857" : "#059669"}
                  strokeWidth="2.5"
                />
                <text
                  x="200"
                  y="46"
                  textAnchor="middle"
                  fill="#065f46"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  SIMP
                </text>
                <text
                  x="200"
                  y="60"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8"
                  fontWeight="600"
                >
                  LEADER
                </text>
              </g>

              {/* NODE 2: SMAR (Bottom Left) */}
              <g
                onClick={() => setSelectedRelationship("SMAR")}
                className="cursor-pointer"
              >
                <circle
                  cx="90"
                  cy="260"
                  r="36"
                  fill="#ffffff"
                  stroke={selectedRelationship === "SMAR" ? "#1d4ed8" : "#2563eb"}
                  strokeWidth="2.5"
                />
                <text
                  x="90"
                  y="256"
                  textAnchor="middle"
                  fill="#1e40af"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  SMAR
                </text>
                <text
                  x="90"
                  y="270"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8"
                  fontWeight="600"
                >
                  ANCHOR
                </text>
              </g>

              {/* NODE 3: AALI (Bottom Right) */}
              <g
                onClick={() => setSelectedRelationship("AALI")}
                className="cursor-pointer"
              >
                <circle
                  cx="310"
                  cy="260"
                  r="36"
                  fill="#ffffff"
                  stroke={selectedRelationship === "AALI" ? "#b45309" : "#d97706"}
                  strokeWidth="2.5"
                />
                <text
                  x="310"
                  y="256"
                  textAnchor="middle"
                  fill="#92400e"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  AALI
                </text>
                <text
                  x="310"
                  y="270"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8"
                  fontWeight="600"
                >
                  MANDIRI
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Details Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{activeInfo.title}</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase font-sans bg-white px-2 py-0.5 rounded border border-slate-200">
                {activeInfo.type}
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-300 font-sans text-[11px] text-slate-900 font-bold shadow-2xs">
              {activeInfo.stats}
            </div>

            <p className="text-slate-700 leading-relaxed font-sans text-xs">
              {activeInfo.desc}
            </p>
          </div>

          {/* Quick Click Buttons */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: "SIMP-SMAR", label: "SIMP ↔ SMAR" },
              { id: "SIMP-AALI", label: "SIMP → AALI" },
              { id: "SMAR-AALI", label: "SMAR → AALI" },
              { id: "SIMP", label: "SIMP" },
              { id: "SMAR", label: "SMAR" },
              { id: "AALI", label: "AALI" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSelectedRelationship(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  selectedRelationship === btn.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs font-bold"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

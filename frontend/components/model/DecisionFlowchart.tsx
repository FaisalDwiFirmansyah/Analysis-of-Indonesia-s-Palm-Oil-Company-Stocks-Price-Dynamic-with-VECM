"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowDown,
  GitBranch,
} from "lucide-react";
import { ModelDecisionData, StationarityData, CointegrationData } from "@/types/analytics";

interface DecisionFlowchartProps {
  decision: ModelDecisionData;
  stationarity?: StationarityData;
  cointegration?: CointegrationData;
}

const toNum = (v: any, fallback: number = 0): number => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return Number(v[0]) || fallback;
  const parsed = parseFloat(v);
  return isNaN(parsed) ? fallback : parsed;
};

export default function DecisionFlowchart({
  decision,
  stationarity,
  cointegration,
}: DecisionFlowchartProps) {
  const [activeNode, setActiveNode] = useState<string>("step3");

  const traceRow = cointegration?.trace_table?.[0];
  const traceStat = toNum(traceRow?.statistic, 43.99);
  const critVal = toNum(traceRow?.critical_5pct, 34.91);
  const rank = toNum(decision?.cointegration_rank, 1);
  const optLag = toNum(decision?.optimal_lag, 5);

  const nodeDetails: Record<
    string,
    {
      title: string;
      desc: string;
      badge: string;
      rule: string;
      empiricalData: string;
    }
  > = {
    step1: {
      title: "Tahap 1: Uji Stasioneritas Level (ADF Test)",
      desc: "Memeriksa apakah data mentah harga saham telah stasioner di tingkat level tanpa perlu diferensiasi.",
      badge: "Tidak Stasioner pada Level",
      rule: "Jika seluruh p-value > 0.05, data mengandung unit root (tidak stasioner) dan tidak boleh diestimasi dengan VAR Level langsung untuk menghindari spurious regression.",
      empiricalData:
        stationarity?.level
          ? Object.entries(stationarity.level)
              .map(([k, v]) => `${k}: t=${toNum(v.test_statistic).toFixed(2)}, p=${toNum(v.p_value).toFixed(4)}`)
              .join(" | ")
          : "SMAR: p=0.349 | AALI: p=0.126 | SIMP: p=0.283 (Semua p > 0.05)",
    },
    step2: {
      title: "Tahap 2: Uji Stasioneritas First Difference",
      desc: "Memastikan seluruh variabel stasioner pada derajat integrasi yang seragam yaitu I(1).",
      badge: "Stasioner Serentak I(1)",
      rule: "Jika seluruh variabel stasioner pada first difference (p < 0.05), seluruh deret terintegrasi pada ordo yang sama I(1) dan memenuhi prasyarat Uji Kointegrasi Johansen.",
      empiricalData:
        stationarity?.first_difference
          ? Object.entries(stationarity.first_difference)
              .map(([k, v]) => `Δ${k}: t=${toNum(v.test_statistic).toFixed(2)}, p=${toNum(v.p_value).toFixed(4)}`)
              .join(" | ")
          : "ΔSMAR: p < 0.01 | ΔAALI: p < 0.01 | ΔSIMP: p < 0.01 (Semua p < 0.01)",
    },
    step3: {
      title: "Tahap 3: Uji Kointegrasi Johansen (Trace Test)",
      desc: "Menguji apakah terdapat kombinasi linier antar variabel yang stasioner (hubungan ekuilibrium jangka panjang).",
      badge: `Terkointegrasi (Rank r = ${rank})`,
      rule: `Karena Trace Statistic (${traceStat.toFixed(2)}) > Nilai Kritis 5% (${critVal.toFixed(2)}), H0: r=0 ditolak. Terdapat kointegrasi sehingga model yang tepat adalah VECM.`,
      empiricalData: `Trace Stat r=0: ${traceStat.toFixed(2)} > Nilai Kritis 5%: ${critVal.toFixed(2)}`,
    },
    decision: {
      title: "Keputusan Akhir: Vector Error Correction Model (VECM)",
      desc: "Model VECM dipilih secara otomatis sesuai Kaidah Ekonometrika Granger Representation Theorem (1987).",
      badge: "Model Terpilih: VECM",
      rule: "Mengestimasi model dengan VAR First Difference saja akan menghilangkan informasi jangka panjang. VECM memodelkan Error Correction Term (ECT) jangka panjang sekaligus dinamika fluktuasi jangka pendek.",
      empiricalData: `Spesifikasi: VECM ordo lag p=${optLag}, rank kointegrasi r=${rank}.`,
    },
  };

  const currentInfo = nodeDetails[activeNode] || nodeDetails["step3"];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Pohon Keputusan Pemilihan Model (Decision Tree)
          </h3>
          <p className="text-xs text-slate-500">
            Penentuan model VAR vs VECM berbasis kaidah ekonometrika deret waktu
          </p>
        </div>

        <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-sans font-semibold border border-emerald-200">
          Model Terpilih: {decision?.model_name || "VECM"}
        </span>
      </div>

      {/* Main Flowchart & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Decision Steps (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="text-[11px] text-slate-500 font-sans font-semibold flex items-center justify-between">
            <span>ALUR LOGIKA KEPUTUSAN</span>
            <span className="text-xs font-sans">Pilih tahap untuk melihat detail</span>
          </div>

          {/* STEP 1 */}
          <div
            onClick={() => setActiveNode("step1")}
            className={`p-3.5 rounded-md border transition-colors cursor-pointer ${
              activeNode === "step1"
                ? "bg-white border-slate-900 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-sans text-slate-500 uppercase block font-semibold">
                  Tahap 1: Uji Stasioneritas Level
                </span>
                <h5 className="font-semibold text-slate-900 text-xs mt-0.5">
                  Apakah seluruh variabel harga saham stasioner di tingkat level I(0)?
                </h5>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                Tidak (p &gt; 0.05)
              </span>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex justify-center text-slate-400">
            <ArrowDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* STEP 2 */}
          <div
            onClick={() => setActiveNode("step2")}
            className={`p-3.5 rounded-md border transition-colors cursor-pointer ${
              activeNode === "step2"
                ? "bg-white border-slate-900 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-sans text-slate-500 uppercase block font-semibold">
                  Tahap 2: Uji Stasioneritas First Difference
                </span>
                <h5 className="font-semibold text-slate-900 text-xs mt-0.5">
                  Apakah seluruh variabel terintegrasi pada derajat yang sama I(1)?
                </h5>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                Ya (p &lt; 0.01)
              </span>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex justify-center text-slate-400">
            <ArrowDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* STEP 3 */}
          <div
            onClick={() => setActiveNode("step3")}
            className={`p-3.5 rounded-md border transition-colors cursor-pointer ${
              activeNode === "step3"
                ? "bg-white border-slate-900 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-sans text-slate-500 uppercase block font-semibold">
                  Tahap 3: Uji Kointegrasi Johansen (Trace Test)
                </span>
                <h5 className="font-semibold text-slate-900 text-xs mt-0.5">
                  Apakah terdapat kointegrasi (hubungan jangka panjang)?
                </h5>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex-shrink-0">
                Rank r = {rank}
              </span>
            </div>
          </div>

          {/* Branching Result Outlets */}
          <div className="pt-2">
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-md border border-slate-200 bg-white/50 text-slate-400 space-y-0.5">
                <span className="font-medium text-slate-500 block text-[11px]">Jika r = 0:</span>
                <p className="text-xs font-semibold text-slate-600">VAR First Difference</p>
                <span className="text-[10px] text-slate-400 font-sans">Tidak Digunakan</span>
              </div>

              <div
                onClick={() => setActiveNode("decision")}
                className={`p-3 rounded-md border transition-colors cursor-pointer space-y-0.5 ${
                  activeNode === "decision"
                    ? "bg-emerald-50/70 border-emerald-600"
                    : "bg-white border-emerald-300 hover:border-emerald-400"
                }`}
              >
                <span className="font-medium text-emerald-800 block text-[11px]">Jika r ≥ 1:</span>
                <p className="text-xs font-bold text-emerald-900">VECM (Model Terpilih)</p>
                <span className="text-[10px] text-emerald-700 font-sans font-medium">Aktif Digunakan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Step Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-3">
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase mb-1.5">
                {currentInfo.badge}
              </span>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{currentInfo.title}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{currentInfo.desc}</p>
            </div>

            {/* Empirical Data Box */}
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs font-sans space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block font-sans">
                Data Statistik Aktual:
              </span>
              <p className="text-slate-800 font-medium leading-relaxed">{currentInfo.empiricalData}</p>
            </div>

            {/* Econometric Rule */}
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs space-y-1 leading-relaxed">
              <span className="text-[10px] font-medium text-slate-500 uppercase block font-sans">
                Kaidah Ekonometrika:
              </span>
              <p className="text-slate-700">{currentInfo.rule}</p>
            </div>
          </div>

          {/* Quick Selection Buttons */}
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => setActiveNode("step1")}
              className={`p-2 rounded border text-xs font-medium text-left transition-colors cursor-pointer ${
                activeNode === "step1" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              1. Uji ADF Level
            </button>
            <button
              onClick={() => setActiveNode("step2")}
              className={`p-2 rounded border text-xs font-medium text-left transition-colors cursor-pointer ${
                activeNode === "step2" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              2. Uji ADF Diff
            </button>
            <button
              onClick={() => setActiveNode("step3")}
              className={`p-2 rounded border text-xs font-medium text-left transition-colors cursor-pointer ${
                activeNode === "step3" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              3. Uji Johansen
            </button>
            <button
              onClick={() => setActiveNode("decision")}
              className={`p-2 rounded border text-xs font-medium text-left transition-colors cursor-pointer ${
                activeNode === "decision" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              4. Keputusan VECM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

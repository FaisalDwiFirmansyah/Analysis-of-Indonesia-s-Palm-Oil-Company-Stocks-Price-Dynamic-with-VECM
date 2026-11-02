"use client";

import React, { useState } from "react";
import { Network } from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import IRFChart from "@/components/charts/IRFChart";
import FEVDChart from "@/components/charts/FEVDChart";
import StockTransmissionDiagram from "@/components/charts/StockTransmissionDiagram";
import Badge from "@/components/common/Badge";

// Safe unwrappers
const toNum = (v: any, fallback: number = 0): number => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return Number(v[0]) || fallback;
  const parsed = parseFloat(v);
  return isNaN(parsed) ? fallback : parsed;
};

const toStr = (v: any): string => {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return String(v[0]);
  return String(v);
};

export default function RelationshipAnalysisPage() {
  const { data } = useAnalytics();
  const [activeTab, setActiveTab] = useState<"granger" | "irf" | "fevd">("granger");

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Memuat analisis hubungan saham...
      </div>
    );
  }

  const { relationships } = data;
  const granger_pairwise = relationships?.granger_pairwise || [];
  const irf = relationships?.irf || {};
  const fevd = relationships?.fevd || {};

  return (
    <div className="space-y-6">
      {/* 1. Visual Network Transmission Diagram */}
      <StockTransmissionDiagram pairwiseData={granger_pairwise} />

      {/* 2. Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-1.5 shadow-xs ring-1 ring-slate-900/5 flex items-center gap-1.5 overflow-x-auto">
        {[
          { key: "granger", label: "Tabel Kausalitas Granger Bivariat" },
          { key: "irf", label: "Impulse Response Function (IRF)" },
          { key: "fevd", label: "Variance Decomposition (FEVD)" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "bg-emerald-700 text-white shadow-xs font-bold"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: GRANGER CAUSALITY TABLE */}
      {activeTab === "granger" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Hasil Uji Kausalitas Granger (Pairwise F-Test)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                H0: Variabel penyebab tidak memengaruhi (Granger Cause) variabel target jika p-value &gt; 0.05
              </p>
            </div>
            <span className="text-xs font-sans font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
              Tingkat Signifikansi α = 0.05
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 font-bold uppercase border-b-2 border-slate-300 text-[11px] tracking-wider">
                <tr>
                  <th className="p-3 font-sans">Arah Kausalitas</th>
                  <th className="p-3 font-sans">Pernyataan Hipotesis Nol (H0)</th>
                  <th className="p-3 text-right">F-Statistic</th>
                  <th className="p-3 text-right">p-Value</th>
                  <th className="p-3 text-center font-sans">Keputusan Statistik</th>
                  <th className="p-3 font-sans">Interpretasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {granger_pairwise.map((row: any, idx: number) => {
                  const pVal = toNum(row?.p_value);
                  const fStat = toNum(row?.f_statistic);
                  const isSig = Boolean(row?.is_significant || pVal < 0.05);
                  const cause = toStr(row?.cause);
                  const effect = toStr(row?.effect);
                  const direction = toStr(row?.direction) || `${cause} → ${effect}`;

                  return (
                    <tr
                      key={idx}
                      className={
                        isSig
                          ? "bg-emerald-50/70 hover:bg-emerald-100/60 transition-colors"
                          : "odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors"
                      }
                    >
                      <td className="p-3 font-bold text-slate-900 font-sans">{direction}</td>
                      <td className="p-3 text-slate-700 font-sans">
                        {cause} does not Granger Cause {effect}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {fStat.toFixed(4)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {pVal < 0.0001 ? "< 0.0001" : pVal.toFixed(4)}
                      </td>
                      <td className="p-3 text-center font-sans">
                        <Badge variant={isSig ? "success" : "neutral"}>
                          {isSig ? "Tolak H0 (Signifikan)" : "Gagal Tolak H0"}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-700 font-sans text-xs">
                        {isSig
                          ? `Harga masa lalu ${cause} memprediksi ${effect}.`
                          : `Tidak ada hubungan prediktif dari ${cause} ke ${effect}.`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-lg bg-slate-50/90 border-l-4 border-l-emerald-600 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans shadow-xs space-y-1">
            <strong className="text-slate-900">Kesimpulan Kausalitas:</strong> Terbukti adanya hubungan timbal balik dua arah (<span className="font-bold text-slate-900">p &lt; 0.001</span>) antara <strong>SIMP dan SMAR</strong>. Selain itu, SIMP dan SMAR secara satu arah memengaruhi <strong>AALI</strong>, sedangkan AALI tidak memengaruhi saham lainnya.
          </div>
        </div>
      )}

      {/* SECTION 2: IMPULSE RESPONSE FUNCTION */}
      {activeTab === "irf" && (
        <div className="space-y-4">
          <IRFChart irfData={irf} />
        </div>
      )}

      {/* SECTION 3: FORECAST ERROR VARIANCE DECOMPOSITION */}
      {activeTab === "fevd" && (
        <div className="space-y-4">
          <FEVDChart fevdData={fevd} />
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Table as TableIcon,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import Badge from "@/components/common/Badge";

// Safe numeric unwrapper
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

export default function ModelEstimationPage() {
  const { data } = useAnalytics();
  const [selectedEqTab, setSelectedEqTab] = useState<"SMAR" | "AALI" | "SIMP">("SMAR");

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Memuat estimasi model...
      </div>
    );
  }

  const { model_estimation, model_decision } = data;
  const isVECM = model_estimation?.model_type === "VECM";
  const ects = model_estimation?.ect_summary || {};
  const equations = model_estimation?.equations || {};
  const currentEq = equations[selectedEqTab];

  // Cointegrating vector
  const cointegratingVector = model_estimation?.cointegrating_vector || {
    "SMAR.l5": 1,
    "AALI.l5": 0.1421,
    "SIMP.l5": -10.3518,
    constant: -1186.5374,
  };

  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs ring-1 ring-slate-900/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-sans font-bold border border-emerald-300">
              {model_estimation.model_type} Terestimasi
            </span>
            <span className="text-xs text-slate-500 font-medium">Metode: Johansen Maximum Likelihood</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Hasil Estimasi {model_decision?.model_name || "Vector Error Correction Model"}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-sans">
            Ordo Lag: {toNum(model_estimation.optimal_lag, 5)} | Rank Kointegrasi: r ={" "}
            {toNum(model_estimation.cointegration_rank, 1)} | Observasi Latih: 132 Bulan
          </p>
        </div>

        <Link
          href="/diagnostics"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
        >
          Uji Diagnostik <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* SECTION 1: VEKTOR KOINTEGRASI JANGKA PANJANG (TABLE) */}
      {isVECM && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                1. Vektor Kointegrasi Jangka Panjang (Normalized Cointegrating Vector β)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hubungan keseimbangan jangka panjang yang diperoleh dari dekomposisi Johansen
              </p>
            </div>
            <span className="text-xs font-sans font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
              Rank r = 1
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 font-bold uppercase border-b-2 border-slate-300 text-[11px] tracking-wider">
                <tr>
                  <th className="p-3 font-sans">Variabel / Parameter</th>
                  <th className="p-3 text-right">Koefisien Ternormalisasi (β)</th>
                  <th className="p-3 font-sans">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                  <td className="p-3 font-bold text-slate-900 font-sans">SMAR (Target Normalisasi)</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {toNum(cointegratingVector["SMAR.l5"], 1).toFixed(4)}
                  </td>
                  <td className="p-3 text-slate-700 font-sans">Parameter acuan normalisasi (β₁ = 1)</td>
                </tr>
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                  <td className="p-3 font-bold text-slate-900 font-sans">AALI</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {toNum(cointegratingVector["AALI.l5"], 0.1421).toFixed(4)}
                  </td>
                  <td className="p-3 text-slate-700 font-sans">Koefisien keseimbangan jangka panjang AALI</td>
                </tr>
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                  <td className="p-3 font-bold text-slate-900 font-sans">SIMP</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {toNum(cointegratingVector["SIMP.l5"], -10.3518).toFixed(4)}
                  </td>
                  <td className="p-3 text-slate-700 font-sans">Koefisien keseimbangan jangka panjang SIMP</td>
                </tr>
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors bg-slate-100/50">
                  <td className="p-3 font-bold text-slate-900 font-sans">Konstanta (Intercept)</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {toNum(cointegratingVector["constant"], -1186.5374).toFixed(4)}
                  </td>
                  <td className="p-3 text-slate-700 font-sans">Intersep vektor kointegrasi</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: ERROR CORRECTION TERM (SPEED OF ADJUSTMENT) */}
      {isVECM && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                2. Kecepatan Penyesuaian Galat (Error Correction Term / ECT α)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Koefisien koreksi menuju keseimbangan jangka panjang jika terjadi disekuilibrium
              </p>
            </div>
            <span className="text-xs font-sans font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
              α = 0.05
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 font-bold uppercase border-b-2 border-slate-300 text-[11px] tracking-wider">
                <tr>
                  <th className="p-3 font-sans">Persamaan Target</th>
                  <th className="p-3 text-right">Koefisien ECT (α)</th>
                  <th className="p-3 text-right">Std. Error</th>
                  <th className="p-3 text-right">t-Statistic</th>
                  <th className="p-3 text-right">p-Value</th>
                  <th className="p-3 text-center font-sans">Signifikansi</th>
                  <th className="p-3 text-right font-sans">Kecepatan Penyesuaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(ects).map(([stock, row]: [string, any]) => {
                  const coef = toNum(row?.coefficient);
                  const se = toNum(row?.std_error);
                  const tStat = toNum(row?.t_statistic);
                  const pVal = toNum(row?.p_value);
                  const isSig = Boolean(row?.is_significant || pVal < 0.05);
                  const speed = toNum(row?.speed_of_adjustment_pct, Math.abs(coef) * 100);

                  return (
                    <tr
                      key={stock}
                      className={
                        isSig
                          ? "bg-emerald-50/80 hover:bg-emerald-100/70 font-semibold border-b border-emerald-200"
                          : "odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors"
                      }
                    >
                      <td className="p-3 text-slate-900 font-bold font-sans">Δ{stock}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {coef.toFixed(4)}
                      </td>
                      <td className="p-3 text-right text-slate-700">{se.toFixed(4)}</td>
                      <td className="p-3 text-right text-slate-800">{tStat.toFixed(4)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {pVal < 0.0001 ? "< 0.0001" : pVal.toFixed(4)}
                      </td>
                      <td className="p-3 text-center font-sans">
                        <Badge variant={isSig ? "success" : "neutral"}>
                          {isSig ? "Signifikan (***)" : "Tidak Signifikan"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-sans">
                        {isSig ? `${speed.toFixed(2)}% / bulan` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-lg bg-slate-50/90 border-l-4 border-l-emerald-600 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans shadow-xs">
            <strong className="text-slate-900">Catatan Ekonometrika:</strong> Persamaan <strong>ΔSMAR</strong> memiliki koefisien ECT bernilai negatif dan signifikan (<span className="font-bold text-slate-900">-0.2863, p &lt; 0.0001</span>), membuktikan berjalannya mekanisme koreksi kesalahan sebesar <strong>28.63% per bulan</strong> pasca guncangan. Sementara itu, AALI dan SIMP tidak signifikan (<span className="text-slate-900">p &gt; 0.05</span>), menunjukkan keduanya bergerak independen terhadap deviasi jangka panjang.
          </div>
        </div>
      )}

      {/* SECTION 3: DETAIL ESTIMASI PARAMETER REGRESI JANGKA PENDEK */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              3. Tabel Estimasi Parameter Regresi Jangka Pendek
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih persamaan target untuk melihat koefisien OLS, standar galat, dan uji-t setiap lag
            </p>
          </div>

          {/* Equation Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(["SMAR", "AALI", "SIMP"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSelectedEqTab(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedEqTab === v
                    ? "bg-white text-slate-900 shadow-xs font-bold border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Persamaan Δ{v}
              </button>
            ))}
          </div>
        </div>

        {currentEq && (
          <div className="space-y-4">
            {/* Model Summary Metrics */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-100/80 p-3.5 rounded-lg border border-slate-300 font-sans text-slate-800">
              <span>Multiple R²: <strong className="text-slate-900">{toNum(currentEq.r_squared).toFixed(4)}</strong></span>
              <span>Adjusted R²: <strong className="text-slate-900">{toNum(currentEq.adj_r_squared).toFixed(4)}</strong></span>
              <span>Residual SE: <strong className="text-slate-900">{toNum(currentEq.residual_se).toFixed(2)}</strong></span>
              {currentEq.f_statistic && (
                <span>
                  F-Statistic: <strong className="text-slate-900">{toNum(currentEq.f_statistic).toFixed(3)} (p={toNum(currentEq.f_p_value).toFixed(4)})</strong>
                </span>
              )}
            </div>

            {/* Regression Coefficients Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100/90 text-slate-800 font-bold uppercase border-b-2 border-slate-300 text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3 font-sans">Variabel Lag (Term)</th>
                    <th className="p-3 text-right">Koefisien (Estimate)</th>
                    <th className="p-3 text-right">Std. Error</th>
                    <th className="p-3 text-right">t-Statistic</th>
                    <th className="p-3 text-right">p-Value</th>
                    <th className="p-3 text-center font-sans">Signifikansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {Object.values(currentEq.coefficients || {}).map((coef: any, idx: number) => {
                    const est = toNum(coef.estimate);
                    const se = toNum(coef.std_error);
                    const tStat = toNum(coef.t_statistic);
                    const pVal = toNum(coef.p_value);
                    const isSig = pVal < 0.05;

                    return (
                      <tr
                        key={idx}
                        className={
                          isSig
                            ? "bg-emerald-50/60 hover:bg-emerald-50 font-medium"
                            : "odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors"
                        }
                      >
                        <td className="p-3 font-bold text-slate-900">{coef.term}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{est.toFixed(4)}</td>
                        <td className="p-3 text-right text-slate-700">{se.toFixed(4)}</td>
                        <td className="p-3 text-right text-slate-800">{tStat.toFixed(4)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {pVal < 0.0001 ? "< 0.0001" : pVal.toFixed(4)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={isSig ? "text-emerald-700 font-bold" : "text-slate-400 font-medium"}>
                            {toStr(coef.significance) || "n.s."}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-slate-500 font-sans">
              Signif. codes: &lsquo;***&rsquo; 0.001 &lsquo;**&rsquo; 0.01 &lsquo;*&rsquo; 0.05 &lsquo;.&rsquo; 0.1
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

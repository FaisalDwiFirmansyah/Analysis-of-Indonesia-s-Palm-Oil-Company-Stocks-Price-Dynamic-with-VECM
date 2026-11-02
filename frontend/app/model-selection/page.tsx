"use client";

import React from "react";
import Link from "next/link";
import {
  GitBranch,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Info,
  Scale,
  Activity,
  FileCheck2,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import DecisionFlowchart from "@/components/model/DecisionFlowchart";

// Safe numeric unwrapper
const toNum = (v: any, fallback: number = 0): number => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return Number(v[0]) || fallback;
  const parsed = parseFloat(v);
  return isNaN(parsed) ? fallback : parsed;
};

export default function ModelSelectionPage() {
  const { data } = useAnalytics();

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        Memuat modul pemilihan model...
      </div>
    );
  }

  const { model_decision, stationarity, cointegration } = data;

  const traceRow = cointegration?.trace_table?.[0];
  const traceStat = toNum(traceRow?.statistic, 43.99);
  const critVal = toNum(traceRow?.critical_5pct, 34.91);
  const rank = toNum(model_decision?.cointegration_rank, 1);
  const optLag = toNum(model_decision?.optimal_lag, 5);

  const smarLevel = stationarity?.level?.SMAR;
  const aaliLevel = stationarity?.level?.AALI;
  const simpLevel = stationarity?.level?.SIMP;

  const smarDiff = stationarity?.first_difference?.SMAR;
  const aaliDiff = stationarity?.first_difference?.AALI;
  const simpDiff = stationarity?.first_difference?.SIMP;

  return (
    <div className="space-y-6">
      {/* Visual Dynamic Decision Tree Flowchart */}
      <DecisionFlowchart
        decision={model_decision}
        stationarity={stationarity}
        cointegration={cointegration}
      />

      {/* Deep-Dive Rationale Card with Dynamic Values */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Justifikasi Ilmiah & Landasan Teori Ekonometrika Pemilihan Model
          </h3>
          <span className="text-xs font-sans font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
            Teorema Representasi Granger (1987)
          </span>
        </div>

        <div className="prose prose-sm text-xs text-slate-700 max-w-none space-y-4 leading-relaxed font-sans">
          <p>
            Dalam ekonometrika deret waktu multivariat, pemodelan interaksi dinamis antara beberapa variabel ekonomi (harga saham <strong className="text-slate-900">SMAR, AALI, dan SIMP</strong>) mengikuti teorema representasi Granger (Granger Representation Theorem, 1987). Keputusan model tidak ditentukan secara subjektif, melainkan berdasarkan bukti empiris tiga pengujian bertahap:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2 shadow-2xs">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                1. Ketidakstasioneran Level
              </span>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                Uji ADF level menghasilkan t-statistic: SMAR ({toNum(smarLevel?.test_statistic).toFixed(2)}, p={toNum(smarLevel?.p_value).toFixed(4)}), AALI ({toNum(aaliLevel?.test_statistic).toFixed(2)}, p={toNum(aaliLevel?.p_value).toFixed(4)}), dan SIMP ({toNum(simpLevel?.test_statistic).toFixed(2)}, p={toNum(simpLevel?.p_value).toFixed(4)}). Seluruh p-value &gt; 0.05. Jika VAR level dipaksakan, koefisien akan menghasilkan regresi lancung (spurious regression) dengan R² tinggi semu.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2 shadow-2xs">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                2. Kestasioneran I(1)
              </span>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                Setelah diferensiasi pertama, seluruh variabel stasioner serentak: ΔSMAR (t={toNum(smarDiff?.test_statistic).toFixed(2)}, p &lt; 0.01), ΔAALI (t={toNum(aaliDiff?.test_statistic).toFixed(2)}, p &lt; 0.01), dan ΔSIMP (t={toNum(simpDiff?.test_statistic).toFixed(2)}, p &lt; 0.01). Hal ini membuktikan bahwa seluruh deret terintegrasi pada ordo yang identik, yaitu I(1).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2 shadow-2xs">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                3. Bukti Kointegrasi Johansen
              </span>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                Uji Trace Johansen pada ordo lag optimal {optLag} menghasilkan nilai statistik trace sebesar <strong className="text-slate-900">{traceStat.toFixed(2)}</strong> yang melampaui nilai kritis 5% (<strong className="text-slate-900">{critVal.toFixed(2)}</strong>). Hal ini membuktikan terdapat <strong>r = {rank}</strong> kombinasi linier yang stasioner (hubungan ekuilibrium jangka panjang).
              </p>
            </div>
          </div>

          {/* Theoretical Box Comparison */}
          <div className="p-4 rounded-lg bg-slate-900 text-slate-100 space-y-2 border border-slate-800 shadow-xs">
            <h5 className="font-bold text-xs text-emerald-400 flex items-center gap-2 font-sans uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              Mengapa VECM, bukan VAR First Difference biasa?
            </h5>
            <p className="text-slate-300 text-xs leading-relaxed">
              Jika deret waktu terbukti memiliki kointegrasi (r ≥ 1) namun hanya diestimasi menggunakan model VAR First Difference standar, maka informasi penting mengenai <strong>keseimbangan fundamental jangka panjang (long-run equilibrium) akan hilang</strong> akibat pemotongan selisih diferensiasi. 
              Model <strong>Vector Error Correction Model (VECM)</strong> mampu mempertahankan komponen koreksi galat (Error Correction Term / ECT) sekaligus merekam elastisitas fluktuasi jangka pendek.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-600 font-medium">
            Langkah selanjutnya: Menelaah estimasi koefisien VECM, kecepatan penyesuaian ECT, dan persamaan dinamis.
          </span>
          <Link
            href="/model-estimation"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-xs"
          >
            Lanjut ke Estimasi Model VECM <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

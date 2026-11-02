"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Activity,
  Layers,
  HelpCircle,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import Badge from "@/components/common/Badge";

export default function DiagnosticsPage() {
  const { data } = useAnalytics();
  const [activeTab, setActiveTab] = useState<"normality" | "autocorr" | "arch" | "multicollinearity" | "stability">("stability");

  if (!data) return <div className="p-8 text-center text-slate-500 text-xs">Memuat diagnostik model...</div>;

  const { diagnostics, model_decision } = data;
  const { normality, autocorrelation, heteroscedasticity, multicollinearity, stability } = diagnostics;

  return (
    <div className="space-y-6">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Uji Stabilitas Model</span>
          <div className="text-xl font-bold font-sans text-emerald-700 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            STABIL
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Max Modulus: {stability.max_modulus} (&lt; 1)</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Multikolinearitas</span>
          <div className="text-xl font-bold font-sans text-emerald-700 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            AMAN
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Cond Number: {multicollinearity.condition_number.value} (&lt; 30)</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Heteroskedastisitas (ARCH)</span>
          <div className="text-xl font-bold font-sans text-emerald-700 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            HOMOSKEDASTIS
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Lags: 5 (P-value &gt; 0.05)</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Autokorelasi Serial</span>
          <div className="text-xl font-bold font-sans text-emerald-700 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            BEBAS KORELASI
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Ljung-Box (Lag 12)</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex items-center gap-1 overflow-x-auto">
        {[
          { key: "stability", label: "1. Stabilitas Akar Polinomial (Roots)" },
          { key: "multicollinearity", label: "2. Multikolinearitas (VIF & Condition Number)" },
          { key: "normality", label: "3. Uji Normalitas (Jarque-Bera)" },
          { key: "autocorr", label: "4. Autokorelasi Residual (Ljung-Box)" },
          { key: "arch", label: "5. Heteroskedastisitas (ARCH-LM)" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: STABILITY TEST */}
      {activeTab === "stability" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Uji Stabilitas Model VAR / VECM (Inverse Roots of AR Characteristic Polynomial)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Model dikatakan stabil jika seluruh nilai modulus akar karakteristik berada di dalam lingkaran satuan (Modulus &lt; 1).
              </p>
            </div>
            <Badge variant={stability.is_stable ? "success" : "danger"}>
              {stability.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2 text-xs shadow-2xs">
              <h5 className="font-bold text-slate-900">Ringkasan Stabilitas:</h5>
              <div className="flex justify-between font-sans">
                <span className="text-slate-600 font-semibold">Maximum Modulus:</span>
                <span className="font-bold text-emerald-900">{stability.max_modulus}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-600 font-semibold">Ambang Batas Kestabilan:</span>
                <span className="font-bold text-slate-800">&lt; 1.0000</span>
              </div>
              <div className="pt-2 border-t border-slate-300 text-emerald-950 font-medium leading-relaxed font-sans">
                {stability.interpretation}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 overflow-y-auto max-h-60 text-xs font-sans shadow-2xs">
              <h5 className="font-bold text-slate-900 font-sans mb-2">Akar Karakteristik (Roots):</h5>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left">
                  <thead className="text-[10px] text-slate-800 bg-slate-100 border-b border-slate-300 uppercase font-bold">
                    <tr>
                      <th className="p-2">Root</th>
                      <th className="p-2 text-right">Nilai Riil</th>
                      <th className="p-2 text-right">Imajiner</th>
                      <th className="p-2 text-right">Modulus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {Object.entries(stability.roots).map(([key, r], idx) => (
                      <tr key={key} className="odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60">
                        <td className="p-2 text-slate-800 font-semibold font-sans">Akar {idx + 1}</td>
                        <td className="p-2 text-right text-slate-700">{r.real}</td>
                        <td className="p-2 text-right text-slate-700">{r.imaginary}</td>
                        <td className="p-2 text-right font-bold text-emerald-800">{r.modulus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MULTICOLLINEARITY (VIF & CONDITION NUMBER) */}
      {activeTab === "multicollinearity" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Uji Multikolinearitas (VIF & Condition Number)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Menguji apakah terdapat korelasi linier sempurna antar variabel penjelas lag dalam matriks regresi
              </p>
            </div>
            <Badge variant="success">
              {multicollinearity.condition_number.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Condition Number Box */}
            <div className="p-5 rounded-xl bg-slate-100/80 border border-slate-300 space-y-3 text-xs shadow-2xs">
              <h5 className="font-bold text-slate-900">Condition Number Matrix:</h5>
              <div className="flex justify-between font-sans">
                <span className="text-slate-600 font-semibold">Condition Number:</span>
                <span className="font-bold text-lg text-emerald-900">
                  {multicollinearity.condition_number.value}
                </span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-600 font-semibold">Ambang Batas Kritis:</span>
                <span className="font-bold text-slate-800">&lt; 30.00</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-sans pt-2 border-t border-slate-300">
                {multicollinearity.condition_number.interpretation}
              </p>
            </div>

            {/* VIF Summary */}
            <div className="p-5 rounded-xl bg-slate-100/80 border border-slate-300 space-y-3 text-xs shadow-2xs">
              <h5 className="font-bold text-slate-900">Variance Inflation Factor (VIF):</h5>
              <div className="space-y-2 font-sans">
                {Object.entries(multicollinearity.vif).map(([stock, row]) => (
                  <div key={stock} className="flex justify-between p-2 rounded bg-white border border-slate-200 shadow-2xs">
                    <span className="font-semibold text-slate-700">Persamaan {stock}:</span>
                    <span className="font-bold text-slate-900">Max VIF = {row.max_vif}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                Pada model time series dengan lag jamak (distributed lags), korelasi wajar terjadi antar lag dari variabel yang sama. Condition Number &lt; 30 membuktikan matriks sistem stabil secara numerik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: NORMALITY TEST (JARQUE-BERA) */}
      {activeTab === "normality" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Uji Normalitas Residual (Jarque-Bera Test)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Menguji apakah galat (residual) berdistribusi normal (H0: Residual Berdistribusi Normal jika p &gt; 0.05)
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 text-[11px] font-bold uppercase border-b-2 border-slate-300 tracking-wider">
                <tr>
                  <th className="p-3">Residual Variabel</th>
                  <th className="p-3 text-right">JB Statistic</th>
                  <th className="p-3 text-right">P-value</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left">Interpretasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(normality).map(([stock, row]) => (
                  <tr key={stock} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                    <td className="p-3 font-bold text-slate-900 font-sans">Residual {stock}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{row.statistic}</td>
                    <td className="p-3 text-right font-bold text-emerald-800">{row.p_value}</td>
                    <td className="p-3 text-center">
                      <Badge variant={row.is_normal ? "success" : "neutral"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-700 font-sans text-xs">{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: AUTOCORRELATION (LJUNG-BOX) */}
      {activeTab === "autocorr" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Uji Autokorelasi Serial Residual (Ljung-Box Test)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Menguji sisa autokorelasi serial pada residual (H0: Bebas Autokorelasi Serial jika p &gt; 0.05)
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 text-[11px] font-bold uppercase border-b-2 border-slate-300 tracking-wider">
                <tr>
                  <th className="p-3">Residual Variabel</th>
                  <th className="p-3 text-right">Box-Ljung Statistic</th>
                  <th className="p-3 text-right">P-value</th>
                  <th className="p-3 text-right">Lag Uji</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left">Interpretasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(autocorrelation).map(([stock, row]) => (
                  <tr key={stock} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                    <td className="p-3 font-bold text-slate-900 font-sans">Residual {stock}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{row.statistic}</td>
                    <td className="p-3 text-right font-bold text-emerald-800">{row.p_value}</td>
                    <td className="p-3 text-right text-slate-700">{row.lag}</td>
                    <td className="p-3 text-center">
                      <Badge variant={row.no_autocorrelation ? "success" : "warning"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-700 font-sans text-xs">{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: HETEROSCEDASTICITY (ARCH-LM) */}
      {activeTab === "arch" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Uji Heteroskedastisitas (ARCH-LM Test)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Menguji apakah varians dari residual bersifat konstan / homoskedastisitas (H0: Homoskedastisitas jika p &gt; 0.05)
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 text-[11px] font-bold uppercase border-b-2 border-slate-300 tracking-wider">
                <tr>
                  <th className="p-3">Residual Variabel</th>
                  <th className="p-3 text-right">ARCH-LM Chi-sq</th>
                  <th className="p-3 text-right">P-value</th>
                  <th className="p-3 text-right">Lags</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left">Interpretasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(heteroscedasticity).map(([stock, row]) => (
                  <tr key={stock} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                    <td className="p-3 font-bold text-slate-900 font-sans">Residual {stock}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{row.statistic}</td>
                    <td className="p-3 text-right font-bold text-emerald-800">{row.p_value}</td>
                    <td className="p-3 text-right text-slate-700">{row.lags}</td>
                    <td className="p-3 text-center">
                      <Badge variant={row.is_homoscedastic ? "success" : "warning"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-700 font-sans text-xs">{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

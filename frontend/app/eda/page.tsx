"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  LineChart as LineChartIcon,
  HelpCircle,
  CheckCircle2,
  Table as TableIcon,
  Activity,
  Layers,
  Info,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import StockPriceChart from "@/components/charts/StockPriceChart";

// Safe helper for scalar or array values
const toNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return Number(v[0]) || 0;
  const parsed = parseFloat(v);
  return isNaN(parsed) ? 0 : parsed;
};

const toStr = (v: any): string => {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return String(v[0]);
  return String(v);
};

export default function EDAPage() {
  const { data } = useAnalytics();
  const [activeStockTab, setActiveStockTab] = useState<"SMAR" | "AALI" | "SIMP">("SMAR");

  if (!data) return <div className="p-8 text-center text-slate-500 text-xs">Memuat data EDA...</div>;

  const { eda, history } = data;
  const desc = eda?.descriptive || {};
  const bartlett = eda?.bartlett || {};
  const correlation = eda?.correlation || {};

  const stockConfigs = {
    SMAR: { color: "#2563eb", fill: "#dbeafe", name: "PT Sinar Mas Agro Resources and Technology Tbk" },
    AALI: { color: "#d97706", fill: "#fef3c7", name: "PT Astra Agro Lestari Tbk" },
    SIMP: { color: "#059669", fill: "#d1fae5", name: "PT Salim Ivomas Pratama Tbk" },
  };

  const currentConfig = stockConfigs[activeStockTab];

  return (
    <div className="space-y-6">

      {/* Overview Cards (Mean, Std Dev, Min, Max) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["SMAR", "AALI", "SIMP"] as const).map((v) => {
          const item = desc[v];
          const cfg = stockConfigs[v];
          const count = toNum(item?.count);
          const mean = toNum(item?.mean);
          const sd = toNum(item?.sd);
          const median = toNum(item?.median);
          const minVal = toNum(item?.min);
          const maxVal = toNum(item?.max);

          return (
            <div
              key={v}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-sm" style={{ color: cfg.color }}>
                    {v}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">N = {count} Bulan</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mt-1 font-sans">
                  Rp {mean.toLocaleString("id-ID")}
                </h4>
                <p className="text-[11px] text-slate-500">Nilai Rata-rata Penutupan</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs font-sans">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Standar Deviasi</span>
                  <span className="font-semibold text-slate-700">Rp {sd.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Median (50%)</span>
                  <span className="font-semibold text-slate-700">Rp {median.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Harga Minimum</span>
                  <span className="font-semibold text-slate-700">Rp {minVal.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Harga Maksimum</span>
                  <span className="font-semibold text-slate-700">Rp {maxVal.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Stock Chart */}
      <StockPriceChart data={history || []} showCutoff={false} />

      {/* Individual Stock Series Area Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Plot Time Series Individual: {activeStockTab}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentConfig.name}</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            {(["SMAR", "AALI", "SIMP"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveStockTab(v)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeStockTab === v
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history || []} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={11}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `Rp ${Number(v).toLocaleString()}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 backdrop-blur-xs p-3 rounded-lg shadow-lg border border-slate-200 text-xs font-sans">
                        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
                          Periode: {label}
                        </p>
                        <div className="flex items-center justify-between gap-4 font-sans">
                          <span style={{ color: currentConfig.color }} className="font-semibold">
                            {activeStockTab}:
                          </span>
                          <span className="font-bold text-slate-900">
                            Rp {Number(payload[0].value).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={activeStockTab}
                stroke={currentConfig.color}
                strokeWidth={2}
                fill={currentConfig.fill}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Descriptive Statistics Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs ring-1 ring-slate-900/5 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-emerald-600" />
            Tabel Statistik Deskriptif Lengkap
          </h3>
          <span className="text-xs text-slate-500 font-sans font-medium">Total Periode: {history?.length || 144} Observasi</span>
        </div>

        <div className="overflow-x-auto p-4">
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 border-b-2 border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 font-sans">Variabel Saham</th>
                  <th className="p-3 text-right">Rata-rata (Mean)</th>
                  <th className="p-3 text-right">Std. Deviasi</th>
                  <th className="p-3 text-right">Median</th>
                  <th className="p-3 text-right">Min</th>
                  <th className="p-3 text-right">Max</th>
                  <th className="p-3 text-right">Q1 (25%)</th>
                  <th className="p-3 text-right">Q3 (75%)</th>
                  <th className="p-3 text-right">Skewness</th>
                  <th className="p-3 text-right">Kurtosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 font-sans text-slate-900 font-medium">
                {Object.entries(desc).map(([stock, row]: [string, any]) => (
                  <tr key={stock} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2 font-sans">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stockConfigs[stock as keyof typeof stockConfigs]?.color }}
                      />
                      {stock}
                    </td>
                    <td className="p-3 text-right font-semibold">Rp {toNum(row.mean).toLocaleString("id-ID")}</td>
                    <td className="p-3 text-right text-slate-700">Rp {toNum(row.sd).toLocaleString("id-ID")}</td>
                    <td className="p-3 text-right text-slate-800">Rp {toNum(row.median).toLocaleString("id-ID")}</td>
                    <td className="p-3 text-right text-slate-700">Rp {toNum(row.min).toLocaleString("id-ID")}</td>
                    <td className="p-3 text-right text-slate-700">Rp {toNum(row.max).toLocaleString("id-ID")}</td>
                    <td className="p-3 text-right text-slate-600">Rp {toNum(row.q25).toLocaleString("id-ID")}</td>
                    <td className="p-3 text-right text-slate-600">Rp {toNum(row.q75).toLocaleString("id-ID")}</td>
                    <td className="p-3 text-right text-slate-800">{toNum(row.skewness).toFixed(4)}</td>
                    <td className="p-3 text-right text-slate-800">{toNum(row.kurtosis).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Correlation Matrix & Bartlett Sphericity Test */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Correlation Matrix Heatmap */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs ring-1 ring-slate-900/5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-emerald-600" />
            Matriks Korelasi Pearson (r)
          </h3>
          <p className="text-xs text-slate-500 mb-4">Tingkat hubungan linier berpasangan antar harga penutupan saham</p>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-center text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 text-[11px] font-bold border-b-2 border-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="p-3 text-left">Variabel</th>
                  <th className="p-3">SMAR</th>
                  <th className="p-3">AALI</th>
                  <th className="p-3">SIMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(correlation).map(([rowVar, cols]: [string, any]) => (
                  <tr key={rowVar}>
                    <td className="p-3 text-left font-bold text-slate-900 bg-slate-100/80 border-r border-slate-200">{rowVar}</td>
                    {(["SMAR", "AALI", "SIMP"] as const).map((colVar) => {
                      const rawVal = cols?.[colVar];
                      const numVal = toNum(rawVal);
                      const isDiag = rowVar === colVar;
                      const intensity = Math.abs(numVal);
                      return (
                        <td
                          key={colVar}
                          className={`p-3 font-bold transition-colors ${
                            isDiag
                              ? "bg-emerald-50/80 text-emerald-900 font-extrabold"
                              : intensity > 0.7
                              ? "bg-blue-100/90 text-blue-950 font-extrabold"
                              : intensity > 0.4
                              ? "bg-blue-50 text-blue-900"
                              : "text-slate-700"
                          }`}
                        >
                          {numVal.toFixed(4)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-medium">
            Catatan: Nilai korelasi berkisar dari -1 hingga +1. Korelasi positif tinggi (&gt; 0.6) menunjukkan tren pergerakan harga saham seirama.
          </p>
        </div>

        {/* Bartlett Sphericity Test Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs ring-1 ring-slate-900/5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Uji Sferisitas Bartlett (Bartlett Sphericity Test)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Uji prasyarat multivariat: Menguji apakah matriks korelasi merupakan matriks identitas (H0: r = 0)
            </p>

            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 space-y-3 font-sans text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Chi-Square Statistic (χ²):</span>
                <span className="font-bold text-slate-900">{toNum(bartlett.statistic).toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Degrees of Freedom (df):</span>
                <span className="font-bold text-slate-900">{toNum(bartlett.df)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">P-value:</span>
                <span className="font-bold text-emerald-800">
                  {toNum(bartlett.p_value) < 0.0001 ? "< 0.0001" : toNum(bartlett.p_value).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Determinan Matriks R (|R|):</span>
                <span className="font-bold text-slate-900">{toNum(bartlett.det_r).toFixed(6)}</span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex items-center justify-between font-sans">
                <span className="text-xs font-bold text-slate-800">Keputusan Uji (α=5%):</span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                  {toNum(bartlett.p_value) < 0.05 ? "Tolak H0 (Signifikan)" : "Gagal Tolak H0"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-lg bg-emerald-50/90 border-l-4 border-l-emerald-600 border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed shadow-xs">
            <strong className="text-emerald-950">Kesimpulan Ekonometrika:</strong>{" "}
            {toStr(bartlett.conclusion) || "Variabel saling berkorelasi signifikan. Data layak untuk pemodelan multivariat VAR/VECM."}
          </div>
        </div>
      </div>
    </div>
  );
}

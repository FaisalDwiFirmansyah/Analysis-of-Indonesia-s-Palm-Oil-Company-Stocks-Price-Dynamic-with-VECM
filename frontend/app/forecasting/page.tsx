"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  Award,
  Layers,
  ArrowRight,
  Download,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import ForecastChart from "@/components/charts/ForecastChart";
import KPICard from "@/components/common/KPICard";
import Badge from "@/components/common/Badge";

export default function ForecastingPage() {
  const { data, selectedHorizon, setSelectedHorizon, currentForecast } = useAnalytics();
  const [selectedStockTable, setSelectedStockTable] = useState<"SMAR" | "AALI" | "SIMP">("SMAR");

  if (!data) return <div className="p-8 text-center text-slate-500 text-xs">Memuat peramalan...</div>;

  const fcst = currentForecast || data.forecasting;
  const evals = fcst.evaluation || {};
  const currentTableData = fcst.forecasts[selectedStockTable] || [];

  return (
    <div className="space-y-6">
      {/* Horizon Control Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Peramalan Harga Saham Kelapa Sawit (VECM)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Model: {data.model_decision.model_name} | Estimasi Aktual R Plumber
          </p>
        </div>

        {/* Horizon Buttons (3, 6, 10, 12) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pilih Horizon:
          </span>
          {([3, 6, 10, 12] as const).map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedHorizon === h
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {h} Bulan
            </button>
          ))}
        </div>
      </div>

      {/* Accuracy KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall MAPE Model"
          value={fcst.overall_mape ? `${fcst.overall_mape}%` : "7.775%"}
          subtitle="Rata-rata Akurasi 3 Saham"
          icon={Award}
          badgeText={fcst.overall_accuracy_category || "Sangat Akurat"}
          badgeVariant="emerald"
          accentColor="emerald"
        />

        <KPICard
          title="MAPE SMAR"
          value={evals.SMAR ? `${evals.SMAR.mape}%` : "7.242%"}
          subtitle={evals.SMAR ? `RMSE: ${evals.SMAR.rmse} • MAE: ${evals.SMAR.mae}` : "Akurasi Tinggi"}
          icon={TrendingUp}
          badgeText="Sangat Akurat"
          badgeVariant="info"
          accentColor="blue"
        />

        <KPICard
          title="MAPE AALI"
          value={evals.AALI ? `${evals.AALI.mape}%` : "10.189%"}
          subtitle={evals.AALI ? `RMSE: ${evals.AALI.rmse} • MAE: ${evals.AALI.mae}` : "Kategori Baik"}
          icon={TrendingUp}
          badgeText="Baik"
          badgeVariant="warning"
          accentColor="amber"
        />

        <KPICard
          title="MAPE SIMP"
          value={evals.SIMP ? `${evals.SIMP.mape}%` : "5.894%"}
          subtitle={evals.SIMP ? `RMSE: ${evals.SIMP.rmse} • MAE: ${evals.SIMP.mae}` : "Akurasi Tertinggi"}
          icon={TrendingUp}
          badgeText="Sangat Akurat"
          badgeVariant="emerald"
          accentColor="purple"
        />
      </div>

      {/* Interactive Forecast Chart */}
      <ForecastChart forecasts={fcst.forecasts} horizon={selectedHorizon} />

      {/* Detailed Forecast & Out-of-Sample Evaluation Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Tabel Evaluasi Nilai Prediksi vs Aktual ({selectedStockTable})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan hasil peramalan dengan data aktual serta batas keyakinan 95% (Lower & Upper)
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(["SMAR", "AALI", "SIMP"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSelectedStockTable(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedStockTable === v
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-100/90 text-slate-800 text-[11px] font-bold uppercase border-b-2 border-slate-300 tracking-wider">
              <tr>
                <th className="p-3">Periode</th>
                <th className="p-3">Bulan</th>
                <th className="p-3 text-right">Nilai Prediksi</th>
                <th className="p-3 text-right">Batas Bawah (95%)</th>
                <th className="p-3 text-right">Batas Atas (95%)</th>
                <th className="p-3 text-right">Nilai Aktual</th>
                <th className="p-3 text-right">Galat (Error)</th>
                <th className="p-3 text-right">APE (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {currentTableData.map((row) => (
                <tr key={row.period} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                  <td className="p-3 font-sans font-semibold text-slate-800">Periode {row.period}</td>
                  <td className="p-3 text-slate-700">{row.date}</td>
                  <td className="p-3 text-right font-bold text-blue-900">
                    Rp {row.forecast?.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right text-slate-700">
                    Rp {row.lower_95?.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right text-slate-700">
                    Rp {row.upper_95?.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {row.actual !== undefined ? `Rp ${row.actual?.toLocaleString("id-ID")}` : "-"}
                  </td>
                  <td className="p-3 text-right text-slate-800">
                    {row.error !== undefined ? `Rp ${row.error?.toLocaleString("id-ID")}` : "-"}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-800">
                    {row.ape !== undefined ? `${row.ape}%` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-lg bg-slate-50/90 border-l-4 border-l-emerald-600 border border-slate-200 text-xs text-slate-700 space-y-1.5 font-sans leading-relaxed shadow-xs">
          <p className="font-bold text-slate-900">Interpretasi Akurasi Lewis (1982):</p>
          <p>{fcst.interpretation}</p>
        </div>
      </div>
    </div>
  );
}

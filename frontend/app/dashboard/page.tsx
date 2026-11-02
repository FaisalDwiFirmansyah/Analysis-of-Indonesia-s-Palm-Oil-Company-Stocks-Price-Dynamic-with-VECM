"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Layers,
  Clock,
  Award,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Network,
  Download,
  AlertCircle,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import KPICard from "@/components/common/KPICard";
import StockPriceChart from "@/components/charts/StockPriceChart";
import ExportReportModal from "@/components/export/ExportReportModal";

export default function DashboardPage() {
  const { data, loading, currentForecast, selectedHorizon, setSelectedHorizon } = useAnalytics();
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Memuat data dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 text-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">Data Analisis Belum Tersedia</h4>
          <p className="mt-1 text-xs">
            Silakan unggah dataset baru di menu <Link href="/data-management" className="underline font-semibold">Data Management</Link> atau muat dataset bawaan.
          </p>
        </div>
      </div>
    );
  }

  const { metadata, model_decision, model_estimation, forecasting } = data;
  const ectSMAR = model_estimation.ect_summary?.SMAR;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="max-w-xl space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-sans font-bold uppercase tracking-wider">
              Time Series Econometrics
            </span>
            <span className="text-xs text-slate-400 font-sans">SMAR • AALI • SIMP</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Analisis Hubungan & Peramalan Harga Saham Kelapa Sawit
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Estimasi sistem ekonometrika multivariat berbasis <strong>Vector Autoregression (VAR)</strong> dan{" "}
            <strong>Vector Error Correction Model (VECM)</strong> untuk menganalisis transmisi harga dan proyeksi masa depan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Link
            href="/model-selection"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            Pemilihan Model
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Laporan
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Observasi"
          value={metadata.total_observations}
          subtitle={`${metadata.training_observations} Latih • ${metadata.testing_observations} Uji`}
          icon={Calendar}
          badgeText="144 Bulan"
          badgeVariant="info"
          accentColor="blue"
        />

        <KPICard
          title="Model Terpilih"
          value={model_decision.model_code}
          subtitle={`Rank Kointegrasi r = ${model_decision.cointegration_rank}`}
          icon={Layers}
          badgeText="Johansen Trace"
          badgeVariant="success"
          accentColor="emerald"
        />

        <KPICard
          title="Lag Optimal"
          value={`Lag ${model_decision.optimal_lag}`}
          subtitle="Kriteria Informasi AIC"
          icon={Clock}
          badgeText="VAR(5) / VECM(4)"
          badgeVariant="warning"
          accentColor="amber"
        />

        <KPICard
          title="Akurasi Peramalan"
          value={`${forecasting.overall_mape}%`}
          subtitle="Overall MAPE (Out-of-sample)"
          icon={Award}
          badgeText="Sangat Akurat"
          badgeVariant="emerald"
          accentColor="purple"
        />
      </div>

      {/* Main Stock Price Movement Chart */}
      <StockPriceChart data={data.history} showCutoff={true} />

      {/* Two Column Section: Econometric Highlights & Forecast Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: VECM Key Econometric Insights */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Temuan Ekonometrika Utama (VECM)
            </h3>
            <Link
              href="/model-estimation"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
            >
              Detail Estimasi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Speed of Adjustment ECT Box */}
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Error Correction Term (ECT) SMAR</span>
              <span className="font-sans text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                {ectSMAR?.coefficient} ({ectSMAR?.significance})
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Hanya saham <strong>SMAR</strong> yang memiliki koefisien ECT negatif signifikan (p &lt; 0.05). Kecepatan penyesuaian menuju keseimbangan jangka panjang adalah sebesar{" "}
              <strong className="text-emerald-900">{ectSMAR?.speed_of_adjustment_pct}% per bulan</strong> pasca guncangan sistem.
            </p>
          </div>

          {/* Granger Causality & Dominance Box */}
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Peran Saham Dominan (Price Leader)</span>
              <span className="font-sans text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200">
                SIMP → SMAR & AALI
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Saham <strong>SIMP</strong> bertindak sebagai <em>price leader</em> dominan yang secara kausalitas Granger memengaruhi fluktuasi harga saham SMAR dan AALI. Sementara itu, <strong>AALI</strong> menunjukkan tingkat independensi tertinggi (97.12% varians berasal dari dirinya sendiri).
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Network className="w-3.5 h-3.5 text-slate-500" />
              Kausalitas Granger terkonfirmasi 2 arah untuk SMAR & SIMP
            </span>
            <Link href="/relationship-analysis" className="text-emerald-700 font-bold hover:underline">
              Buka Analisis Hubungan
            </Link>
          </div>
        </div>

        {/* Right: Forecast Summary Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Ringkasan Evaluasi Akurasi Prediksi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Pengujian out-of-sample data aktual 2024</p>
            </div>
            <Link
              href="/forecasting"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
            >
              Lihat Grafik Prediksi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Accuracy Metrics by Variable */}
          <div className="grid grid-cols-3 gap-3">
            {forecasting.evaluation &&
              Object.entries(forecasting.evaluation).map(([stock, ev]) => (
                <div key={stock} className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-300 text-center shadow-2xs">
                  <span className="text-xs font-bold text-slate-800 font-sans">{stock}</span>
                  <div className="text-lg font-bold text-slate-900 mt-1 font-sans">{ev.mape}%</div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">MAPE</span>
                </div>
              ))}
          </div>

          {/* Quick Horizon Preview */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs shadow-2xs">
            <div className="bg-slate-100/90 px-3.5 py-2.5 font-bold text-slate-800 flex items-center justify-between border-b border-slate-200">
              <span>Sampel Hasil Prediksi Awal (Januari 2024)</span>
              <span className="text-[10px] font-sans font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">Bulan 1</span>
            </div>
            <table className="w-full text-left font-sans">
              <thead className="bg-slate-100/80 text-slate-800 text-[11px] font-bold border-b-2 border-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Emiten</th>
                  <th className="p-2.5 text-right">Prediksi</th>
                  <th className="p-2.5 text-right">Aktual</th>
                  <th className="p-2.5 text-right">Error (APE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(forecasting.forecasts).map(([stock, series]) => {
                  const pt = series[0];
                  return (
                    <tr key={stock} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                      <td className="p-2.5 font-bold text-slate-900 font-sans">{stock}</td>
                      <td className="p-2.5 text-right font-bold text-blue-900">
                        Rp {pt?.forecast?.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-900">
                        Rp {pt?.actual?.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-800">{pt?.ape}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between font-medium shadow-2xs">
            <span>Overall MAPE Model: <strong className="text-emerald-950 font-bold">{forecasting.overall_mape}%</strong></span>
            <span className="text-[10px] uppercase font-bold bg-emerald-700 text-white px-2.5 py-0.5 rounded-md shadow-xs">
              {forecasting.overall_accuracy_category}
            </span>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportReportModal data={data} isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}

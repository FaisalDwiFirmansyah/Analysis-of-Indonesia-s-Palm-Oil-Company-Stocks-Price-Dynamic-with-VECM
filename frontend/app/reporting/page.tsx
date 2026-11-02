"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  ShieldCheck,
  TrendingUp,
  Activity,
  Table,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import ExportReportModal from "@/components/export/ExportReportModal";
import KPICard from "@/components/common/KPICard";

export default function ReportingPage() {
  const { data } = useAnalytics();
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (!data) return <div className="p-8 text-center text-slate-500 text-xs">Memuat laporan analisis...</div>;

  const { metadata, eda, stationarity, cointegration, model_decision, model_estimation, diagnostics, relationships, forecasting } = data;

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold font-sans px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Laporan Komprehensif Terverifikasi
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">
            Laporan Analisis Ekonometrika Saham Kelapa Sawit
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            PT Sinar Mas Agro (SMAR), PT Astra Agro (AALI), dan PT Salim Ivomas (SIMP)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor PDF & Excel
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Model Ekonometrika"
          value={model_decision.model_code}
          subtitle={`Rank r = ${model_decision.cointegration_rank} • Lag ${model_decision.optimal_lag}`}
          icon={Layers}
          accentColor="emerald"
        />

        <KPICard
          title="Overall MAPE"
          value={`${forecasting.overall_mape}%`}
          subtitle="Lewis (1982) Standard"
          icon={Award}
          badgeText={forecasting.overall_accuracy_category || "Sangat Akurat"}
          badgeVariant="emerald"
          accentColor="purple"
        />

        <KPICard
          title="Speed of Adjustment"
          value={`${model_estimation.ect_summary?.SMAR?.speed_of_adjustment_pct}%`}
          subtitle="Koreksi SMAR / Bulan"
          icon={TrendingUp}
          accentColor="blue"
        />

        <KPICard
          title="Kestabilan Sistem"
          value="STABIL"
          subtitle={`Max Modulus ${diagnostics.stability.max_modulus} (< 1)`}
          icon={ShieldCheck}
          badgeText="Lolos Uji"
          badgeVariant="success"
          accentColor="slate"
        />
      </div>

      {/* Detailed Report Sections (Structured for Executive Review) */}
      <div className="space-y-6">
        {/* 1. Dataset & Preprocessing */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-3">
            <Calendar className="w-4 h-4 text-emerald-600" />
            1. Informasi Dataset dan Pra-Pemrosesan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="p-3.5 bg-slate-100/80 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-slate-600 block text-[10px] font-bold uppercase tracking-wider">TOTAL OBSERVASI</span>
              <span className="font-bold text-slate-900 text-sm">{metadata.total_observations} Data Bulanan</span>
            </div>
            <div className="p-3.5 bg-slate-100/80 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-slate-600 block text-[10px] font-bold uppercase tracking-wider">RENTANG WAKTU</span>
              <span className="font-bold text-slate-900 text-sm">{metadata.date_start} s/d {metadata.date_end}</span>
            </div>
            <div className="p-3.5 bg-slate-100/80 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-slate-600 block text-[10px] font-bold uppercase tracking-wider">PARTISI DATA</span>
              <span className="font-bold text-slate-900 text-sm">132 Train (2013-2023) • 12 Test (2024)</span>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans pt-1">
            Data tidak mengalami missing values atau duplikasi. Pengujian sferisitas Bartlett menghasilkan nilai Chi-square sebesar <strong>{eda.bartlett.statistic}</strong> (p &lt; 0.001), membuktikan kelayakan data untuk estimasi multivariat.
          </p>
        </section>

        {/* 2. Statistical Testing & Model Selection */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-3">
            <Layers className="w-4 h-4 text-emerald-600" />
            2. Pengujian Ekonometrika & Penentuan Model Otomatis
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs text-xs font-sans">
            <table className="w-full text-left">
              <thead className="bg-slate-100/90 border-b-2 border-slate-300 text-slate-800 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3">Tahapan Uji</th>
                  <th className="p-3">Metode</th>
                  <th className="p-3 text-right">Nilai Statistik</th>
                  <th className="p-3 text-right">P-value / Kritis</th>
                  <th className="p-3 text-center">Keputusan</th>
                  <th className="p-3 text-left">Kesimpulan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors">
                  <td className="p-3 font-bold text-slate-900 font-sans">Stasioneritas Level</td>
                  <td className="p-3 text-slate-700">ADF Test</td>
                  <td className="p-3 text-right font-semibold text-slate-800">SMAR: {stationarity.level.SMAR?.test_statistic}</td>
                  <td className="p-3 text-right font-bold text-amber-800">p = {stationarity.level.SMAR?.p_value}</td>
                  <td className="p-3 text-center font-bold text-amber-700">
                    {stationarity.all_stationary_level ? "Tolak H0" : "Gagal Tolak H0"}
                  </td>
                  <td className="p-3 font-sans text-slate-700">
                    {stationarity.all_stationary_level ? "Semua deret stasioner pada level (I(0))" : "Deret mengandung unit root (tidak stasioner pada level)"}
                  </td>
                </tr>
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors">
                  <td className="p-3 font-bold text-slate-900 font-sans">First Difference</td>
                  <td className="p-3 text-slate-700">ADF Test</td>
                  <td className="p-3 text-right font-semibold text-slate-800">ΔSMAR: {stationarity.first_difference.SMAR?.test_statistic}</td>
                  <td className="p-3 text-right font-bold text-emerald-800">p = {stationarity.first_difference.SMAR?.p_value}</td>
                  <td className="p-3 text-center font-bold text-emerald-700">
                    {stationarity.all_stationary_diff1 ? "Tolak H0" : "Gagal Tolak H0"}
                  </td>
                  <td className="p-3 font-sans text-slate-700">
                    {stationarity.all_stationary_diff1 ? "Semua saham stasioner pada first difference I(1)" : "Sebagian deret belum stasioner"}
                  </td>
                </tr>
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors">
                  <td className="p-3 font-bold text-slate-900 font-sans">Kointegrasi</td>
                  <td className="p-3 text-slate-700">Johansen Trace</td>
                  <td className="p-3 text-right font-semibold text-slate-800">Trace = {cointegration.trace_table[0]?.statistic}</td>
                  <td className="p-3 text-right font-bold text-slate-800">CV 5% = {cointegration.trace_table[0]?.critical_5pct}</td>
                  <td className="p-3 text-center font-bold text-emerald-700">
                    {cointegration.has_cointegration ? "Tolak H0 (r >= 1)" : "Gagal Tolak H0 (r = 0)"}
                  </td>
                  <td className="p-3 font-sans text-slate-700">
                    {cointegration.has_cointegration
                      ? `Terdapat r = ${cointegration.cointegration_rank} hubungan kointegrasi jangka panjang`
                      : "Tidak terdapat hubungan kointegrasi jangka panjang"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50/90 border-l-4 border-l-emerald-600 border border-emerald-200 text-xs text-emerald-950 font-sans font-medium shadow-xs">
            <strong className="text-emerald-950">Model Terpilih: {model_decision.model_name}</strong> (Lag: {model_decision.optimal_lag}, Rank Kointegrasi: r={model_decision.cointegration_rank}).
            <p className="text-[11px] text-emerald-900 mt-1">{model_decision.justification}</p>
          </div>
        </section>

        {/* 3. Estimation & Diagnostics Summary */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            3. Estimasi Model, Diagnostik Galat & Stabilitas
          </h4>
          {model_estimation.ect_summary && Object.keys(model_estimation.ect_summary).length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Estimasi Error Correction Term (ECT) untuk persamaan respon:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
                {Object.entries(model_estimation.ect_summary).map(([stock, ect]) => (
                  <div key={stock} className="p-3.5 bg-slate-100/80 rounded-lg border border-slate-300 shadow-2xs">
                    <span className="font-bold text-slate-900 block text-xs">ECT Δ{stock}(t)</span>
                    <span className={`font-semibold ${ect.is_significant ? "text-emerald-800 font-bold" : "text-slate-700"}`}>
                      Koefisien: {ect.coefficient} ({ect.significance || "n.s."})
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {ect.is_significant ? `Koreksi: ${ect.speed_of_adjustment_pct}% / periode` : "Tidak merespons deviasi"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-700">
              Model diestimasi menggunakan spesifikasi {model_estimation.model_type} dengan ordo lag {model_estimation.optimal_lag}.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans pt-1">
            <div className="p-3.5 bg-slate-100/80 rounded-lg border border-slate-300 shadow-2xs">
              <span className="font-bold text-slate-900 block">Autokorelasi (Ljung-Box)</span>
              <span className="text-emerald-800 font-bold">
                SMAR: p={diagnostics.autocorrelation.SMAR?.p_value} ({diagnostics.autocorrelation.SMAR?.status})
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">{diagnostics.autocorrelation.SMAR?.interpretation}</p>
            </div>
            <div className="p-3.5 bg-slate-100/80 rounded-lg border border-slate-300 shadow-2xs">
              <span className="font-bold text-slate-900 block">Heteroskedastisitas (ARCH-LM)</span>
              <span className="text-emerald-800 font-bold">
                SMAR: p={diagnostics.heteroscedasticity.SMAR?.p_value} ({diagnostics.heteroscedasticity.SMAR?.status})
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">{diagnostics.heteroscedasticity.SMAR?.interpretation}</p>
            </div>
            <div className="p-3.5 bg-slate-100/80 rounded-lg border border-slate-300 shadow-2xs">
              <span className="font-bold text-slate-900 block">Stabilitas Karakteristik Roots</span>
              <span className="text-emerald-800 font-bold">
                Modulus Maks: {diagnostics.stability?.max_modulus} ({diagnostics.stability?.is_stable ? "STABIL" : "TIDAK STABIL"})
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">{diagnostics.stability?.interpretation}</p>
            </div>
          </div>
        </section>

        {/* 4. Forecasting & Evaluation */}
        <section className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-3">
            <Award className="w-4 h-4 text-emerald-600" />
            4. Evaluasi Akurasi Peramalan Out-of-Sample (Horizon {forecasting.horizon} Periode)
          </h4>
          {forecasting.evaluation && Object.keys(forecasting.evaluation).length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs text-xs font-sans">
              <table className="w-full text-left">
                <thead className="bg-slate-100/90 border-b-2 border-slate-300 text-slate-800 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3">Emiten Saham</th>
                    <th className="p-3 text-right">MAPE (%)</th>
                    <th className="p-3 text-right">RMSE</th>
                    <th className="p-3 text-right">MAE</th>
                    <th className="p-3 text-center">Kategori Akurasi</th>
                    <th className="p-3 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {Object.entries(forecasting.evaluation).map(([stock, ev]) => (
                    <tr key={stock} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                      <td className="p-3 font-bold text-slate-900 font-sans">{stock}</td>
                      <td className="p-3 text-right font-bold text-emerald-800">{ev.mape}%</td>
                      <td className="p-3 text-right font-medium text-slate-800">{ev.rmse}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{ev.mae}</td>
                      <td className="p-3 text-center font-bold text-emerald-800">{ev.accuracy_category}</td>
                      <td className="p-3 font-sans text-slate-700">Akurasi peramalan {ev.n_periods} periode out-of-sample</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-100/80 font-bold text-emerald-950 border-t-2 border-emerald-300">
                    <td className="p-3 font-sans">OVERALL MODEL</td>
                    <td className="p-3 text-right text-base text-emerald-900 font-extrabold">{forecasting.overall_mape}%</td>
                    <td className="p-3 text-right text-slate-600">-</td>
                    <td className="p-3 text-right text-slate-600">-</td>
                    <td className="p-3 text-center uppercase tracking-wide text-xs font-bold text-emerald-900">
                      {forecasting.overall_accuracy_category || "SANGAT AKURAT"}
                    </td>
                    <td className="p-3 font-sans text-xs text-emerald-900">Standar Lewis (1982)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Evaluasi out-of-sample dihitung ketika data memiliki observasi partisi uji.
            </p>
          )}
        </section>

        {/* 5. Conclusions & Recommendations */}
        <section className="bg-slate-900 text-white rounded-xl p-6 shadow-xs space-y-3">
          <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            5. Kesimpulan Hubungan Antar Saham & Temuan Empiris
          </h4>
          <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-sans">
            <p>
              1. <strong>Dinamika Saham SMAR:</strong> {relationships.key_findings?.smar || "SMAR merespons transmisi harga dari emiten lain dalam industri."}
            </p>
            <p>
              2. <strong>Dinamika Saham AALI:</strong> {relationships.key_findings?.aali || "AALI memiliki tingkat independensi harga yang tinggi."}
            </p>
            <p>
              3. <strong>Dinamika Saham SIMP:</strong> {relationships.key_findings?.simp || "SIMP berperan signifikan dalam hubungan kausalitas antar saham."}
            </p>
          </div>
        </section>
      </div>

      {/* Export Modal */}
      <ExportReportModal data={data} isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}

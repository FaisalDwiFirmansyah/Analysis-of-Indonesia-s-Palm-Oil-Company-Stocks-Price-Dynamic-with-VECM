"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { AnalysisResult } from "@/types/analytics";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface ExportReportModalProps {
  data: AnalysisResult;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportReportModal({ data, isOpen, onClose }: ExportReportModalProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportPDF = () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF();
      let y = 15;

      // Header
      doc.setFontSize(16);
      doc.setTextColor(6, 78, 59); // Emerald
      doc.text("PALM OIL STOCK ANALYTICS — VAR/VECM REPORT", 14, y);
      y += 7;

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Waktu Analisis: ${data.metadata.timestamp} | Total Observasi: ${data.metadata.total_observations}`, 14, y);
      y += 5;
      doc.text(`Rentang Waktu: ${data.metadata.date_start} s/d ${data.metadata.date_end} | Variabel: SMAR, AALI, SIMP`, 14, y);
      y += 8;

      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, 196, y);
      y += 8;

      // 1. Model Decision Summary
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("1. KEPUTUSAN MODEL OTOMATIS", 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`• Model Terpilih : ${data.model_decision.model_name}`, 16, y);
      y += 5;
      doc.text(`• Lag Optimal (AIC) : ${data.model_decision.optimal_lag}`, 16, y);
      y += 5;
      const traceFirst = data.cointegration.trace_table[0];
      doc.text(`• Hubungan Kointegrasi (r) : ${data.model_decision.cointegration_rank} (Trace Stat: ${traceFirst?.statistic || 0} vs CV 5%: ${traceFirst?.critical_5pct || 0})`, 16, y);
      y += 5;
      doc.text(`• Justifikasi : ${data.model_decision.justification.substring(0, 95)}...`, 16, y);
      y += 8;

      // 2. Statistical Testing
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("2. HASIL PENGUJIAN STATISTIK", 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.text(`• Uji Sferisitas Bartlett : Chi-sq = ${data.eda.bartlett.statistic}, P-value = ${data.eda.bartlett.p_value} (${data.eda.bartlett.is_significant ? "Signifikan" : "Tidak Signifikan"})`, 16, y);
      y += 5;
      const lvlStr = Object.entries(data.stationarity.level).map(([k, v]) => `${k} (p=${v.p_value})`).join(", ");
      doc.text(`• ADF Level : ${lvlStr} -> ${data.stationarity.all_stationary_level ? "STASIONER" : "TIDAK STASIONER"}`, 16, y);
      y += 5;
      const diffStr = Object.entries(data.stationarity.first_difference).map(([k, v]) => `${k} (p=${v.p_value})`).join(", ");
      doc.text(`• ADF First Diff : ${diffStr} -> ${data.stationarity.all_stationary_diff1 ? "SEMUA STASIONER I(1)" : "BELUM STASIONER"}`, 16, y);
      y += 8;

      // 3. VECM ECT
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("3. ERROR CORRECTION TERM (ECT)", 14, y);
      y += 6;
      doc.setFontSize(9);
      if (data.model_estimation.ect_summary) {
        Object.values(data.model_estimation.ect_summary).forEach((ect) => {
          doc.text(`• ${ect.variable} : Koefisien = ${ect.coefficient}, t = ${ect.t_statistic}, p = ${ect.p_value} (${ect.significance || "n.s"})`, 16, y);
          y += 5;
        });
      }
      y += 5;

      // 4. Forecast and Evaluation
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("4. HASIL FORECASTING & EVALUASI AKURASI (OUT-OF-SAMPLE)", 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.text(`• Horizon Peramalan : ${data.forecasting.horizon} Periode Bulanan`, 16, y);
      y += 5;
      doc.text(`• Overall MAPE : ${data.forecasting.overall_mape}% (${data.forecasting.overall_accuracy_category})`, 16, y);
      y += 5;
      if (data.forecasting.evaluation) {
        Object.values(data.forecasting.evaluation).forEach((ev) => {
          doc.text(`  - ${ev.variable} : MAPE = ${ev.mape}%, RMSE = ${ev.rmse}, MAE = ${ev.mae}`, 18, y);
          y += 5;
        });
      }
      y += 8;

      // 5. Diagnostics
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("5. DIAGNOSTIK RESIDUAL & STABILITAS", 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.text(`• Condition Number Multikolinearitas : ${data.diagnostics.multicollinearity.condition_number.value} (< 30, Bebas Multikolinearitas)`, 16, y);
      y += 5;
      doc.text(`• Stabilitas VAR : Max Modulus = ${data.diagnostics.stability.max_modulus} (< 1, Sistem Stabil)`, 16, y);
      y += 10;

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Dokumen ini dihasilkan secara otomatis oleh Palm Oil Stock Analytics berbasis R Plumber & Next.js.", 14, y);

      doc.save(`Palm_Oil_Analytics_Report_${data.metadata.date_end}.pdf`);
      setSuccessMessage("Laporan PDF berhasil diunduh.");
    } catch (e: any) {
      console.error(e);
      alert("Gagal mengekspor PDF: " + e?.message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportExcel = () => {
    setIsExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Raw Data
      const wsHistory = XLSX.utils.json_to_sheet(data.history);
      XLSX.utils.book_append_sheet(wb, wsHistory, "Dataset Historis");

      // Sheet 2: Descriptive Statistics
      const descRows = Object.values(data.eda.descriptive);
      const wsDesc = XLSX.utils.json_to_sheet(descRows);
      XLSX.utils.book_append_sheet(wb, wsDesc, "Statistik Deskriptif");

      // Sheet 3: ADF Tests
      const adfRows = [
        ...Object.values(data.stationarity.level).map((x) => ({ Stage: "Level", ...x })),
        ...Object.values(data.stationarity.first_difference).map((x) => ({ Stage: "First Difference", ...x })),
      ];
      const wsADF = XLSX.utils.json_to_sheet(adfRows);
      XLSX.utils.book_append_sheet(wb, wsADF, "Uji Stasioneritas ADF");

      // Sheet 4: Johansen Cointegration
      const wsCoint = XLSX.utils.json_to_sheet(data.cointegration.trace_table);
      XLSX.utils.book_append_sheet(wb, wsCoint, "Kointegrasi Johansen");

      // Sheet 5: ECT & Equations
      if (data.model_estimation.ect_summary) {
        const ectRows = Object.values(data.model_estimation.ect_summary);
        const wsECT = XLSX.utils.json_to_sheet(ectRows);
        XLSX.utils.book_append_sheet(wb, wsECT, "VECM Error Correction");
      }

      // Sheet 6: Forecasting & APE
      const forecastRows: any[] = [];
      Object.entries(data.forecasting.forecasts).forEach(([stock, series]) => {
        series.forEach((pt) => {
          forecastRows.push({
            Variable: stock,
            Period: pt.period,
            Date: pt.date,
            Forecast: pt.forecast,
            Lower_95: pt.lower_95,
            Upper_95: pt.upper_95,
            Actual: pt.actual,
            Error: pt.error,
            APE_Percent: pt.ape,
          });
        });
      });
      const wsForecast = XLSX.utils.json_to_sheet(forecastRows);
      XLSX.utils.book_append_sheet(wb, wsForecast, "Peramalan & Akurasi");

      // Sheet 7: Granger Causality
      const wsGranger = XLSX.utils.json_to_sheet(data.relationships.granger_pairwise);
      XLSX.utils.book_append_sheet(wb, wsGranger, "Kausalitas Granger");

      XLSX.writeFile(wb, `Palm_Oil_Analytics_Data_${data.metadata.date_end}.xlsx`);
      setSuccessMessage("Workbook Excel berhasil diunduh.");
    } catch (e: any) {
      console.error(e);
      alert("Gagal mengekspor Excel: " + e?.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            Ekspor Laporan Analisis
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Unduh dokumen hasil analisis ekonometrika lengkap termasuk pengujian stasioneritas, lag optimal, kointegrasi, estimasi VECM, diagnostik, dan hasil peramalan harga saham.
        </p>

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={exportPDF}
            disabled={isExportingPDF}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-900 font-semibold text-xs transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-rose-600" />
              <div className="text-left">
                <p className="font-bold">Laporan Eksekutif (.PDF)</p>
                <p className="text-[11px] text-rose-700 font-normal">Format ringkasan terstruktur siap cetak</p>
              </div>
            </div>
            {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Download className="w-4 h-4 text-rose-600" />}
          </button>

          <button
            onClick={exportExcel}
            disabled={isExportingExcel}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 font-semibold text-xs transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div className="text-left">
                <p className="font-bold">Buku Kerja Lengkap (.XLSX)</p>
                <p className="text-[11px] text-emerald-700 font-normal">7 lembar kerja (Dataset, ADF, VECM, Forecast)</p>
              </div>
            </div>
            {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Download className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

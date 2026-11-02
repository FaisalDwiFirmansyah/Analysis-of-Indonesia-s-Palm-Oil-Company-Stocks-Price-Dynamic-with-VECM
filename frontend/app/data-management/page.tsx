"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Download,
  RotateCcw,
  Table,
  Check,
  FileText,
  Loader2,
  ArrowRight,
  Info,
  HelpCircle,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import { uploadDatasetFile } from "@/services/api";
import DataTable, { Column } from "@/components/common/DataTable";
import * as XLSX from "xlsx";

export default function DataManagementPage() {
  const {
    data,
    loading,
    runCustomAnalysis,
    loadDefaultDataset,
    activeDatasetName,
    apiConnected,
  } = useAnalytics();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewRecords, setPreviewRecords] = useState<any[]>(data?.history || []);
  const [uploadedFileName, setUploadedFileName] = useState<string>(activeDatasetName);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationSuccesses, setValidationSuccesses] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState<string | null>(null);
  const [trainSplitRatio, setTrainSplitRatio] = useState<number>(132);

  // Download template CSV for user guidance
  const downloadTemplateCSV = () => {
    const csvContent =
      "Date,SMAR,AALI,SIMP\n2024-01-01,4200,7250,386\n2024-02-01,4310,7100,390\n2024-03-01,4390,7300,402\n2024-04-01,4350,7175,394\n2024-05-01,4280,7050,388";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_harga_saham_sawit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // File parsing & Upload to R Plumber Backend
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsUploading(true);
    setValidationErrors([]);
    setValidationSuccesses([]);
    setAnalysisSuccess(null);

    // 1. Send file directly to R Plumber backend /api/upload
    try {
      const uploadRes = await uploadDatasetFile(file);
      if (uploadRes && uploadRes.validation && uploadRes.clean_data) {
        const successes: string[] = [
          `File "${file.name}" berhasil diverifikasi oleh engine R.`,
          `Jumlah observasi bersih: ${uploadRes.validation.valid_rows} baris (${uploadRes.validation.missing_rows} data kosong disaring).`,
          `Kolom terdeteksi: ${uploadRes.validation.columns.join(", ")}.`,
          uploadRes.validation.has_date_column
            ? "Kolom tanggal valid terdeteksi."
            : "Kolom periode dibuat otomatis.",
        ];
        setValidationSuccesses(successes);
        setValidationErrors([]);

        const splitIdx = Math.max(
          uploadRes.clean_data.length - 12,
          Math.floor(uploadRes.clean_data.length * 0.85)
        );
        const cleanRecs = uploadRes.clean_data.map((r: any, idx: number) => ({
          date: r.Date || r.date || `P-${idx + 1}`,
          SMAR: Number(r.SMAR),
          AALI: Number(r.AALI),
          SIMP: Number(r.SIMP),
          is_training: idx < splitIdx,
        }));

        setPreviewRecords(cleanRecs);
        setTrainSplitRatio(splitIdx);
        setIsUploading(false);
        return;
      }
    } catch (apiErr: any) {
      console.warn("Backend R file upload fallback to client parser:", apiErr?.message);
    }

    // 2. Client-side fallback parser if backend endpoint is unavailable
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        validateAndSetData(jsonData, file.name);
      } catch (err: any) {
        setValidationErrors(["Gagal membaca file: " + err?.message]);
        setValidationSuccesses([]);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const validateAndSetData = (rows: any[], filename: string) => {
    const errors: string[] = [];
    const successes: string[] = [];

    if (!rows || rows.length === 0) {
      errors.push("File kosong atau tidak memiliki data yang valid.");
      setValidationErrors(errors);
      setValidationSuccesses([]);
      return;
    }

    const firstRow = rows[0];
    const keys = Object.keys(firstRow).map((k) => k.trim());

    // 1. Column name validation
    const hasSMAR = keys.some((k) => k.toUpperCase() === "SMAR");
    const hasAALI = keys.some((k) => k.toUpperCase() === "AALI");
    const hasSIMP = keys.some((k) => k.toUpperCase() === "SIMP");
    const dateKey = keys.find((k) => /date|tanggal|periode|waktu/i.test(k));

    if (!hasSMAR || !hasAALI || !hasSIMP) {
      const missing = [];
      if (!hasSMAR) missing.push("SMAR");
      if (!hasAALI) missing.push("AALI");
      if (!hasSIMP) missing.push("SIMP");
      errors.push(`Kolom wajib tidak lengkap! Kurang kolom: ${missing.join(", ")}`);
    } else {
      successes.push("Kolom variabel wajib (SMAR, AALI, SIMP) terverifikasi lengkap.");
    }

    // 2. Format and type validation
    let missingCount = 0;
    let nonNumericCount = 0;
    const cleanRows: any[] = [];

    rows.forEach((row, idx) => {
      const smarKey = Object.keys(row).find((k) => k.trim().toUpperCase() === "SMAR") || "SMAR";
      const aaliKey = Object.keys(row).find((k) => k.trim().toUpperCase() === "AALI") || "AALI";
      const simpKey = Object.keys(row).find((k) => k.trim().toUpperCase() === "SIMP") || "SIMP";

      const rawDate = dateKey ? row[dateKey] : `P-${idx + 1}`;
      const rawSMAR = row[smarKey];
      const rawAALI = row[aaliKey];
      const rawSIMP = row[simpKey];

      if (rawSMAR === "" || rawAALI === "" || rawSIMP === "") {
        missingCount++;
        return;
      }

      const numSMAR = parseFloat(String(rawSMAR).replace(/[^0-9.-]/g, ""));
      const numAALI = parseFloat(String(rawAALI).replace(/[^0-9.-]/g, ""));
      const numSIMP = parseFloat(String(rawSIMP).replace(/[^0-9.-]/g, ""));

      if (isNaN(numSMAR) || isNaN(numAALI) || isNaN(numSIMP)) {
        nonNumericCount++;
        return;
      }

      cleanRows.push({
        date: String(rawDate).trim(),
        SMAR: numSMAR,
        AALI: numAALI,
        SIMP: numSIMP,
      });
    });

    if (missingCount > 0) {
      errors.push(`Ditemukan ${missingCount} baris dengan sel kosong (missing values) yang disaring.`);
    }
    if (nonNumericCount > 0) {
      errors.push(`Ditemukan ${nonNumericCount} baris bernilai teks non-numerik yang disaring.`);
    }

    if (cleanRows.length < 30) {
      errors.push(
        `Jumlah data valid hanya ${cleanRows.length} baris. Minimal dibutuhkan 30 baris data deret waktu untuk estimasi VECM.`
      );
    } else {
      successes.push(
        `Total ${cleanRows.length} baris data bersih valid dan siap diproses untuk analisis ekonometrika.`
      );
    }

    setValidationErrors(errors);
    setValidationSuccesses(successes);

    if (cleanRows.length >= 30) {
      const splitIdx = Math.max(cleanRows.length - 12, Math.floor(cleanRows.length * 0.85));
      const formatted = cleanRows.map((r, idx) => ({
        ...r,
        is_training: idx < splitIdx,
      }));
      setPreviewRecords(formatted);
      setTrainSplitRatio(splitIdx);
    }
  };

  const executeAnalysis = async () => {
    if (
      previewRecords.length === 0 ||
      validationErrors.some((e) => e.includes("wajib tidak lengkap"))
    ) {
      alert("Harap unggah dataset yang memenuhi seluruh persyaratan kolom sebelum menjalankan analisis.");
      return;
    }

    setIsProcessing(true);
    setAnalysisSuccess(null);
    try {
      await runCustomAnalysis(previewRecords, trainSplitRatio, 12);
      setAnalysisSuccess(
        `Analisis ekonometrika VAR/VECM berhasil dijalankan pada dataset ${uploadedFileName}!`
      );
    } catch (err: any) {
      alert("Gagal menjalankan analisis: " + err?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetToDefault = async () => {
    setIsProcessing(true);
    setAnalysisSuccess(null);
    try {
      await loadDefaultDataset();
      setUploadedFileName("Sawit 2024.xlsx");
      setValidationErrors([]);
      setValidationSuccesses([
        "Dataset bawaan Sawit 2024.xlsx (144 observasi bulanan) berhasil dimuat.",
        "Semua kolom SMAR, AALI, SIMP terverifikasi lengkap.",
      ]);
      setPreviewRecords(data?.history || []);
      setTrainSplitRatio(132);
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: Column<any>[] = [
    { key: "date", header: "Periode (Tanggal)", sortable: true },
    {
      key: "SMAR",
      header: "Harga SMAR (Rp)",
      align: "right",
      sortable: true,
      render: (r) => `Rp ${Number(r.SMAR).toLocaleString("id-ID")}`,
    },
    {
      key: "AALI",
      header: "Harga AALI (Rp)",
      align: "right",
      sortable: true,
      render: (r) => `Rp ${Number(r.AALI).toLocaleString("id-ID")}`,
    },
    {
      key: "SIMP",
      header: "Harga SIMP (Rp)",
      align: "right",
      sortable: true,
      render: (r) => `Rp ${Number(r.SIMP).toLocaleString("id-ID")}`,
    },
    {
      key: "is_training",
      header: "Peruntukan Sampel",
      align: "center",
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-sans font-bold ${
            r.is_training
              ? "bg-slate-100 text-slate-700"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {r.is_training ? "In-Sample (Train)" : "Out-of-Sample (Test)"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 1: PANDUAN SPESIFIKASI DATA (SANGAT JELAS) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Panduan Format Dataset Time Series
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Spesifikasi berkas dan struktur kolom yang dapat dimasukkan ke dalam sistem
            </p>
          </div>
          <button
            onClick={downloadTemplateCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Unduh Contoh Template CSV
          </button>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card A: File & Row Requirements */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block">1. Format & Volume Data</span>
            <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
              <li>
                Format berkas: <strong>.XLSX</strong>, <strong>.XLS</strong> (Excel), atau <strong>.CSV</strong>.
              </li>
              <li>
                Frekuensi data: <strong>Bulanan</strong> (rekomendasi) atau harian/mingguan yang konsisten.
              </li>
              <li>
                Jumlah data: Minimal <strong>30 baris</strong> (disarankan 60 s/d 150+ baris agar pengujian lag & kointegrasi valid).
              </li>
            </ul>
          </div>

          {/* Card B: Required Columns */}
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2 shadow-2xs">
            <span className="font-bold text-slate-900 block text-xs">2. Empat Kolom Wajib (Header)</span>
            <ul className="text-slate-700 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
              <li>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-slate-900 font-bold">Date</code>: Tanggal atau periode (misal: <code>2024-01-01</code>).
              </li>
              <li>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-slate-900 font-bold">SMAR</code>: Harga penutupan saham PT Sinar Mas Agro Resources Tbk.
              </li>
              <li>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-slate-900 font-bold">AALI</code>: Harga penutupan saham PT Astra Agro Lestari Tbk.
              </li>
              <li>
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-slate-900 font-bold">SIMP</code>: Harga penutupan saham PT Salim Ivomas Pratama Tbk.
              </li>
            </ul>
          </div>

          {/* Card C: Data Cleaning Rules */}
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2 shadow-2xs">
            <span className="font-bold text-slate-900 block text-xs">3. Ketentuan Penulisan Angka</span>
            <ul className="text-slate-700 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
              <li>Nilai harga harus angka riil (contoh: <code>4200</code> atau <code>7250.5</code>).</li>
              <li>Jangan menggunakan simbol mata uang (seperti <code>Rp</code>) di dalam sel.</li>
              <li>Hindari baris kosong atau sel kosong (missing value).</li>
            </ul>
          </div>
        </div>

        {/* Visual Example Table */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
            Contoh Tampilan Struktur Data yang Benar:
          </span>
          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 font-bold border-b-2 border-slate-300 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">SMAR</th>
                  <th className="p-3 text-right">AALI</th>
                  <th className="p-3 text-right">SIMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60">
                  <td className="p-2.5 text-slate-700 font-semibold">2024-01-01</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">4200</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">7250</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">386</td>
                </tr>
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60">
                  <td className="p-2.5 text-slate-700 font-semibold">2024-02-01</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">4310</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">7100</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">390</td>
                </tr>
                <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60">
                  <td className="p-2.5 text-slate-700 font-semibold">2024-03-01</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">4390</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">7300</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">402</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: AREA UNGGAH & TINDAKAN */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Unggah Berkas Dataset</h3>
            <p className="text-xs text-slate-500">
              Pilih file data dari komputer Anda atau gunakan dataset bawaan penelitian
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefault}
              disabled={isProcessing || isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Muat Dataset Bawaan (144 Bulan)
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Pilih File (.xlsx / .csv)
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Validation Feedback */}
        {validationSuccesses.length > 0 && (
          <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs space-y-1">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Validasi Berkas Berhasil:
            </div>
            <ul className="text-emerald-800 list-disc list-inside space-y-0.5 text-[11px]">
              {validationSuccesses.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-xs space-y-1">
            <div className="font-bold text-rose-900 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              Peringatan Validasi Data:
            </div>
            <ul className="text-rose-800 list-disc list-inside space-y-0.5 text-[11px]">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {analysisSuccess && (
          <div className="p-3.5 rounded-md bg-emerald-100 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between">
            <span className="font-semibold">{analysisSuccess}</span>
            <Link
              href="/dashboard"
              className="text-xs font-bold text-emerald-800 underline hover:text-emerald-900"
            >
              Buka Dashboard ➔
            </Link>
          </div>
        )}

        {/* Action Button to Run Analysis */}
        {previewRecords.length >= 30 && (
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-600">
              Dataset aktif: <strong>{uploadedFileName}</strong> ({previewRecords.length} baris)
            </div>
            <button
              onClick={executeAnalysis}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses Analisis di R...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  Jalankan Estimasi VAR/VECM
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3: PRATINJAU DATA TABEL */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Pratinjau Data Bersih</h3>
            <p className="text-xs text-slate-500">
              Menampilkan {previewRecords.length} observasi yang siap dianalisis
            </p>
          </div>
          <span className="text-xs font-sans text-slate-600">
            {previewRecords.filter((r) => r.is_training).length} Latih |{" "}
            {previewRecords.filter((r) => !r.is_training).length} Uji
          </span>
        </div>

        <DataTable
          data={previewRecords}
          columns={columns}
          pageSize={10}
          searchPlaceholder="Cari berdasarkan tanggal..."
        />
      </div>
    </div>
  );
}

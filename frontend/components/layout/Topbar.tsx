"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, FileDown, Database } from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/data-management": "Data Management",
  "/eda": "Exploratory Data Analysis (EDA)",
  "/statistical-testing": "Pengujian Statistik",
  "/model-selection": "Pemilihan Model",
  "/model-estimation": "Estimasi Model",
  "/diagnostics": "Diagnostik Model",
  "/relationship-analysis": "Analisis Hubungan Antar Saham",
  "/forecasting": "Peramalan Saham",
  "/reporting": "Laporan & Ekspor",
};

export default function Topbar() {
  const pathname = usePathname();
  const { data, loading, apiConnected, activeDatasetName, refreshData } = useAnalytics();

  const title = pageTitles[pathname] || "Palm Oil Stock Analytics";
  const obsCount = data?.metadata?.total_observations || 144;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      {/* Essential Status & Actions Only */}
      <div className="flex items-center gap-3">
        {/* Active Dataset Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-700">{activeDatasetName}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">{obsCount} Obs</span>
        </div>

        {/* Engine Status Dot */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200"
          title={apiConnected ? "R Plumber API Daemon Aktif" : "Mode Offline"}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              apiConnected ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <span className="text-slate-600 text-[11px] hidden sm:inline">
            {apiConnected ? "R Engine Online" : "Local Mode"}
          </span>
        </div>

        {/* Refresh Action */}
        <button
          onClick={() => refreshData()}
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          title="Segarkan data analisis"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
        </button>

        {/* Export Link */}
        <Link
          href="/reporting"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ekspor</span>
        </Link>
      </div>
    </header>
  );
}

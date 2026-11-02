"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { AnalyticsProvider, useAnalytics } from "@/context/AnalyticsContext";
import { Loader2 } from "lucide-react";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { loading, data } = useAnalytics();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        
        {/* Loading Overlay for heavy analysis calculations */}
        {loading && !data && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/80 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-xl border border-slate-200 text-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 animate-spin">
                <Loader2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Memproses Analisis Ekonometrika...</h3>
              <p className="text-xs text-slate-500">
                Menjalankan pengujian ADF, Johansen, estimasi VECM, IRF bootstrap, dan diagnostik residual pada mesin R.
              </p>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider>
      <LayoutContent>{children}</LayoutContent>
    </AnalyticsProvider>
  );
}

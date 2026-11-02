"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  LineChart,
  FlaskConical,
  GitBranch,
  Calculator,
  ShieldCheck,
  Network,
  TrendingUp,
  FileText,
  Activity,
  Layers,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";

interface NavGroup {
  groupName: string;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    groupName: "Ikhtisar",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Data Management", href: "/data-management", icon: Database },
    ],
  },
  {
    groupName: "Eksplorasi & Pengujian",
    items: [
      { name: "Exploratory Data (EDA)", href: "/eda", icon: LineChart },
      { name: "Statistical Testing", href: "/statistical-testing", icon: FlaskConical },
      { name: "Model Selection", href: "/model-selection", icon: GitBranch, badge: "Auto" },
    ],
  },
  {
    groupName: "Model VECM / VAR",
    items: [
      { name: "Model Estimation", href: "/model-estimation", icon: Calculator },
      { name: "Model Diagnostics", href: "/diagnostics", icon: ShieldCheck },
      { name: "Relationship Analysis", href: "/relationship-analysis", icon: Network },
    ],
  },
  {
    groupName: "Prediksi & Laporan",
    items: [
      { name: "Forecasting", href: "/forecasting", icon: TrendingUp },
      { name: "Evaluation & Report", href: "/reporting", icon: FileText },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data, apiConnected } = useAnalytics();

  const selectedModel = data?.model_decision?.model_code || "VECM";

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header: Clean Typographic Branding (No Tacky Icon) */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight text-white uppercase">
            Palm Oil Stock
          </span>
          <span className="text-xs text-slate-400 font-medium mt-0.5">
            Analytics & Forecasting
          </span>
          <span className="text-[10px] text-emerald-400 mt-1 font-medium tracking-wide">
            VAR / VECM System
          </span>
        </div>
      </div>

      {/* Harmonized Stock Focus (No Clashing Rainbow Colors) */}
      <div className="px-3.5 py-2 mx-3 mt-3 bg-slate-800/40 rounded-md border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <span className="text-[11px] text-slate-400 font-medium">Saham:</span>
        <span className="font-semibold text-slate-200 text-[11px] tracking-wide font-sans">
          SMAR • AALI • SIMP
        </span>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {group.groupName}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href === "/dashboard" && pathname === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-emerald-700 text-emerald-100"
                          : "bg-slate-800 text-emerald-400 border border-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 text-[11px] space-y-1.5 font-sans">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5 font-sans text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Model Aktif
          </span>
          <span className="font-bold text-emerald-400 text-xs">
            {selectedModel} (r={data?.model_decision?.cointegration_rank ?? 1})
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400 pt-0.5">
          <span className="flex items-center gap-1.5 font-sans text-xs">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            R Engine
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className={apiConnected ? "text-emerald-400 font-medium" : "text-amber-400"}>
              {apiConnected ? "Online" : "Local Mode"}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

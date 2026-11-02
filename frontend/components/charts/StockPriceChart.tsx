"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { HistoryRecord } from "@/types/analytics";

interface StockPriceChartProps {
  data: HistoryRecord[];
  showCutoff?: boolean;
}

export default function StockPriceChart({ data, showCutoff = true }: StockPriceChartProps) {
  const [showSMAR, setShowSMAR] = useState(true);
  const [showAALI, setShowAALI] = useState(true);
  const [showSIMP, setShowSIMP] = useState(true);
  const [useSeparateAxes, setUseSeparateAxes] = useState(false);

  // Formatted data for recharts
  const chartData = data.map((d) => ({
    date: d.date,
    SMAR: d.SMAR,
    AALI: d.AALI,
    SIMP: d.SIMP,
    is_training: d.is_training,
  }));

  // Find test cutoff date (first testing observation, e.g. 2024-01)
  const testCutoff = data.find((d) => !d.is_training)?.date || "2024-01";

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Dinamika Harga Saham Kelapa Sawit (2013 — 2024)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pergerakan bulanan harga penutupan SMAR, AALI, dan SIMP
          </p>
        </div>

        {/* Series Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSMAR(!showSMAR)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
              showSMAR
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
          >
            SMAR
          </button>
          <button
            onClick={() => setShowAALI(!showAALI)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
              showAALI
                ? "bg-amber-50 text-amber-700 border-amber-300"
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
          >
            AALI
          </button>
          <button
            onClick={() => setShowSIMP(!showSIMP)}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
              showSIMP
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
          >
            SIMP
          </button>

          <button
            onClick={() => setUseSeparateAxes(!useSeparateAxes)}
            className={`ml-2 px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
              useSeparateAxes
                ? "bg-purple-50 text-purple-700 border-purple-300"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
            title="SIMP menggunakan skala sekunder agar fluktuasi terlihat jelas"
          >
            {useSeparateAxes ? "Skala Terpisah Aktif" : "Skala Gabungan"}
          </button>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={{ stroke: "#cbd5e1" }}
              interval={11}
              angle={-25}
              textAnchor="end"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={{ stroke: "#cbd5e1" }}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `Rp ${v.toLocaleString()}`}
            />
            {useSeparateAxes && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#10b981" }}
                tickLine={{ stroke: "#10b981" }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `Rp ${v}`}
              />
            )}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/95 backdrop-blur-xs p-3 rounded-lg shadow-lg border border-slate-200 text-xs font-sans">
                      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between">
                        <span>Periode: {label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {payload[0]?.payload?.is_training ? "Data Latih (Train)" : "Data Uji (Test 2024)"}
                        </span>
                      </div>
                      <div className="space-y-1 font-sans">
                        {payload.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between gap-4">
                            <span style={{ color: entry.color }} className="font-semibold">
                              {entry.name}:
                            </span>
                            <span className="font-bold text-slate-900">
                              Rp {Number(entry.value).toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />

            {showCutoff && (
              <ReferenceLine
                x={testCutoff}
                yAxisId="left"
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{
                  value: "Split Uji (2024)",
                  fill: "#dc2626",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
            )}

            {showSMAR && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="SMAR"
                name="SMAR"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            )}

            {showAALI && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="AALI"
                name="AALI"
                stroke="#d97706"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            )}

            {showSIMP && (
              <Line
                yAxisId={useSeparateAxes ? "right" : "left"}
                type="monotone"
                dataKey="SIMP"
                name="SIMP"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Garis vertikal merah putus-putus menunjukkan pemisahan data training (2013-2023) dan testing (2024).</span>
        <span>Sumber data: Sawit 2024.xlsx</span>
      </div>
    </div>
  );
}

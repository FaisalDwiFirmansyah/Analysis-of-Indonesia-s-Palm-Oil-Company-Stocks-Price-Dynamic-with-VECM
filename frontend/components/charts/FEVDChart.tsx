"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { FEVDStep } from "@/types/analytics";

interface FEVDChartProps {
  fevdData: Record<string, FEVDStep[]>;
}

export default function FEVDChart({ fevdData }: FEVDChartProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>("SMAR");

  const steps = fevdData[selectedTarget] || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Forecast Error Variance Decomposition (FEVD)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Proporsi kontribusi varians galat peramalan (%) dari setiap variabel
          </p>
        </div>

        {/* Target Stock Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <span className="text-xs font-semibold text-slate-600 px-2">Variabel Target:</span>
          {["SMAR", "AALI", "SIMP"].map((v) => (
            <button
              key={v}
              onClick={() => setSelectedTarget(v)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                selectedTarget === v
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={steps} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={{ stroke: "#cbd5e1" }}
              label={{ value: "Periode (Bulan)", position: "insideBottom", offset: -5, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={{ stroke: "#cbd5e1" }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/95 backdrop-blur-xs p-3 rounded-lg shadow-lg border border-slate-200 text-xs font-sans">
                      <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
                        Dekomposisi Periode ke-{label} ({selectedTarget})
                      </p>
                      <div className="space-y-1 font-sans">
                        {payload.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between gap-4">
                            <span style={{ color: entry.color }} className="font-semibold">
                              {entry.name}:
                            </span>
                            <span className="font-bold text-slate-900">
                              {Number(entry.value).toFixed(2)}%
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

            <Area
              type="monotone"
              dataKey="SMAR"
              name="Kontribusi SMAR (%)"
              stackId="1"
              stroke="#2563eb"
              fill="#93c5fd"
            />
            <Area
              type="monotone"
              dataKey="AALI"
              name="Kontribusi AALI (%)"
              stackId="1"
              stroke="#d97706"
              fill="#fde68a"
            />
            <Area
              type="monotone"
              dataKey="SIMP"
              name="Kontribusi SIMP (%)"
              stackId="1"
              stroke="#059669"
              fill="#a7f3d0"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600">
        <p className="font-semibold text-slate-700 mb-0.5">Interpretasi Dekomposisi:</p>
        <p>
          Menjelaskan seberapa besar fluktuasi harga saham <strong className="text-slate-800">{selectedTarget}</strong> dipengaruhi oleh shock dirinya sendiri (internal) dibandingkan transmisi dari saham kelapa sawit lainnya (eksternal) dalam jangka panjang hingga 100%.
        </p>
      </div>
    </div>
  );
}

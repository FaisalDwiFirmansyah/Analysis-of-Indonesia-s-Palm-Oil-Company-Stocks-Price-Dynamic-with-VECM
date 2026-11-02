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
import { IRFStep } from "@/types/analytics";

interface IRFChartProps {
  irfData: Record<string, IRFStep[]>;
}

export default function IRFChart({ irfData }: IRFChartProps) {
  const [selectedResponse, setSelectedResponse] = useState<string>("SMAR");

  const steps = irfData[selectedResponse] || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Impulse Response Function (Respons terhadap Guncangan 1 SD)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dinamika transmisi shock antar variabel saham selama 12 periode ke depan
          </p>
        </div>

        {/* Response Variable Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <span className="text-xs font-semibold text-slate-600 px-2">Respons:</span>
          {["SMAR", "AALI", "SIMP"].map((v) => (
            <button
              key={v}
              onClick={() => setSelectedResponse(v)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                selectedResponse === v
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
          <LineChart data={steps} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
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
              label={{ value: `Respons ${selectedResponse}`, angle: -90, position: "insideLeft", fontSize: 11 }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/95 backdrop-blur-xs p-3 rounded-lg shadow-lg border border-slate-200 text-xs font-sans">
                      <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
                        Periode ke-{label}
                      </p>
                      <div className="space-y-1 font-sans">
                        {payload.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between gap-4">
                            <span style={{ color: entry.color }} className="font-semibold">
                              {entry.name}:
                            </span>
                            <span className="font-bold text-slate-900">
                              {Number(entry.value).toFixed(2)}
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

            <Line
              type="monotone"
              dataKey="shock_SMAR"
              name="Shock SMAR"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="shock_AALI"
              name="Shock AALI"
              stroke="#d97706"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="shock_SIMP"
              name="Shock SIMP"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600">
        <p className="font-semibold text-slate-700 mb-0.5">Catatan Ekonometrika:</p>
        <p>
          Grafik di atas menunjukkan bagaimana variabel <strong className="text-slate-800">{selectedResponse}</strong> merespons guncangan satu standar deviasi (1 SD shock) yang berasal dari masing-masing emiten saham selama 12 bulan ke depan.
        </p>
      </div>
    </div>
  );
}

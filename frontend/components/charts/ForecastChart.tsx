"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { ForecastPeriod } from "@/types/analytics";

interface ForecastChartProps {
  forecasts: Record<string, ForecastPeriod[]>;
  horizon: number;
}

export default function ForecastChart({ forecasts, horizon }: ForecastChartProps) {
  const [selectedStock, setSelectedStock] = useState<string>("SMAR");

  const stockForecast = forecasts[selectedStock] || [];

  // Formatted data for chart
  const chartData = stockForecast.map((item) => ({
    date: item.date,
    period: `P-${item.period}`,
    forecast: item.forecast,
    lower_95: item.lower_95,
    upper_95: item.upper_95,
    actual: item.actual,
    error: item.error,
    ape: item.ape,
  }));

  const stockColors = {
    SMAR: { line: "#2563eb", area: "#dbeafe" },
    AALI: { line: "#d97706", area: "#fef3c7" },
    SIMP: { line: "#059669", area: "#d1fae5" },
  };

  const currentColor = stockColors[selectedStock as keyof typeof stockColors] || stockColors.SMAR;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Prediksi Harga Saham {selectedStock} ({horizon} Periode)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Peramalan out-of-sample dengan batas keyakinan 95% (Lower & Upper Bounds)
          </p>
        </div>

        {/* Stock Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {["SMAR", "AALI", "SIMP"].map((v) => (
            <button
              key={v}
              onClick={() => setSelectedStock(v)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                selectedStock === v
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
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={{ stroke: "#cbd5e1" }}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={{ stroke: "#cbd5e1" }}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `Rp ${v.toLocaleString()}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0]?.payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-lg shadow-lg border border-slate-200 text-xs font-sans min-w-[200px]">
                      <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-2">
                        {label} ({item?.period})
                      </p>
                      <div className="space-y-1 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Prediksi:</span>
                          <span className="font-bold text-blue-700">
                            Rp {item?.forecast?.toLocaleString("id-ID")}
                          </span>
                        </div>
                        {item?.actual !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Aktual:</span>
                            <span className="font-bold text-slate-900">
                              Rp {item?.actual?.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                        {item?.ape !== undefined && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-500">APE (Error):</span>
                            <span className="font-bold text-emerald-700">{item?.ape}%</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>95% CI:</span>
                          <span>
                            {item?.lower_95?.toLocaleString("id-ID")} — {item?.upper_95?.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />

            {/* Shaded Area for Upper and Lower Confidence Interval */}
            <Area
              type="monotone"
              dataKey="upper_95"
              name="Batas Atas (95% CI)"
              stroke="transparent"
              fill={currentColor.area}
            />
            <Area
              type="monotone"
              dataKey="lower_95"
              name="Batas Bawah (95% CI)"
              stroke="transparent"
              fill="#ffffff"
            />

            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              name={`Prediksi ${selectedStock}`}
              stroke={currentColor.line}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />

            {/* Actual Data Points if available */}
            {chartData.some((d) => d.actual !== undefined) && (
              <Line
                type="monotone"
                dataKey="actual"
                name={`Aktual ${selectedStock}`}
                stroke="#1e293b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: "#1e293b" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

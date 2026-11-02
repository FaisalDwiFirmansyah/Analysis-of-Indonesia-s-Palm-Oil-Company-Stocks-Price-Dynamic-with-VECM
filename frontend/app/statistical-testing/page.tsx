"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useAnalytics } from "@/context/AnalyticsContext";
import Badge from "@/components/common/Badge";

export default function StatisticalTestingPage() {
  const { data } = useAnalytics();
  const [activeTab, setActiveTab] = useState<"adf_level" | "adf_diff" | "lag" | "johansen" | "bartlett">("adf_level");

  if (!data) return <div className="p-8 text-center text-slate-500 text-xs">Memuat data pengujian...</div>;

  const { stationarity, lag_selection, cointegration, eda } = data;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2 shadow-xs ring-1 ring-slate-900/5 flex items-center gap-1.5 overflow-x-auto">
        {[
          { key: "adf_level", label: "1. ADF Test Level" },
          { key: "adf_diff", label: "2. ADF First Difference" },
          { key: "lag", label: "3. Penentuan Lag Optimal" },
          { key: "johansen", label: "4. Uji Kointegrasi Johansen" },
          { key: "bartlett", label: "5. Uji Bartlett Sphericity" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: ADF LEVEL */}
      {activeTab === "adf_level" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 font-sans text-[10px] font-bold border border-blue-200">
              Tahap 1 / Stasioneritas
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              Augmented Dickey-Fuller (ADF) Test — Tingkat Level
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <strong>Tujuan:</strong> Menguji apakah deret harga saham asli pada level mengandung unit root (tidak stasioner) atau stasioner.
            </p>
            <div className="mt-3 p-3.5 bg-slate-100/80 rounded-lg text-xs font-sans text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-300">
              <span><strong>H0:</strong> Data mengandung unit root (TIDAK STASIONER)</span>
              <span><strong>H1:</strong> Data tidak mengandung unit root (STASIONER)</span>
              <span className="text-slate-600 font-semibold">Taraf Signifikansi α = 0.05</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 text-[11px] font-bold uppercase border-b-2 border-slate-300 tracking-wider">
                <tr>
                  <th className="p-3">Variabel Saham</th>
                  <th className="p-3 text-right">ADF t-Statistic</th>
                  <th className="p-3 text-right">P-value</th>
                  <th className="p-3 text-right">Lag Order</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left">Keputusan & Interpretasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(stationarity.level).map(([stock, row]) => (
                  <tr key={stock} className="odd:bg-white even:bg-slate-50/70 hover:bg-amber-50/60 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{stock}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{row.test_statistic}</td>
                    <td className="p-3 text-right font-bold text-amber-800">{row.p_value}</td>
                    <td className="p-3 text-right text-slate-700">{row.lag_order}</td>
                    <td className="p-3 text-center">
                      <Badge variant={row.is_stationary ? "success" : "warning"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-700 font-sans text-xs">{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-lg bg-amber-50/90 border-l-4 border-l-amber-600 border border-amber-200 text-xs text-amber-950 leading-relaxed font-sans shadow-xs">
            <strong className="text-amber-950">Kesimpulan Tahap 1:</strong> Seluruh variabel (SMAR, AALI, SIMP) memiliki p-value &gt; 0.05 sehingga gagal menolak H0. Artinya seluruh harga saham <strong>TIDAK STASIONER</strong> pada level dan memerlukan proses differencing tingkat pertama.
          </div>
        </div>
      )}

      {/* SECTION 2: ADF FIRST DIFFERENCE */}
      {activeTab === "adf_diff" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-sans text-[10px] font-bold border border-emerald-300">
              Tahap 2 / Integrasi
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              Augmented Dickey-Fuller (ADF) Test — First Difference (Δ)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <strong>Tujuan:</strong> Menguji apakah deret selisih pertama (first difference) stasioner, mengonfirmasi derajat integrasi I(1).
            </p>
            <div className="mt-3 p-3.5 bg-slate-100/80 rounded-lg text-xs font-sans text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-300">
              <span><strong>H0:</strong> Data selisih pertama mengandung unit root (TIDAK STASIONER)</span>
              <span><strong>H1:</strong> Data selisih pertama STASIONER</span>
              <span className="text-slate-600 font-semibold">Taraf Signifikansi α = 0.05</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 text-[11px] font-bold uppercase border-b-2 border-slate-300 tracking-wider">
                <tr>
                  <th className="p-3">Variabel Diferensiasi</th>
                  <th className="p-3 text-right">ADF t-Statistic</th>
                  <th className="p-3 text-right">P-value</th>
                  <th className="p-3 text-right">Lag Order</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left">Keputusan & Interpretasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.entries(stationarity.first_difference).map(([stock, row]) => (
                  <tr key={stock} className="odd:bg-white even:bg-slate-50/70 hover:bg-emerald-50/60 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{row.variable}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{row.test_statistic}</td>
                    <td className="p-3 text-right font-bold text-emerald-800">{row.p_value}</td>
                    <td className="p-3 text-right text-slate-700">{row.lag_order}</td>
                    <td className="p-3 text-center">
                      <Badge variant="success">{row.status}</Badge>
                    </td>
                    <td className="p-3 text-slate-700 font-sans text-xs">{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50/90 border-l-4 border-l-emerald-600 border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-sans shadow-xs">
            <strong className="text-emerald-950">Kesimpulan Tahap 2:</strong> Seluruh variabel first difference memiliki p-value &lt; 0.05, sehingga tolak H0. Terbukti bahwa seluruh saham kelapa sawit <strong>STASIONER PADA DERAJAT INTEGRASI I(1)</strong>. Syarat uji kointegrasi terpenuhi!
          </div>
        </div>
      )}

      {/* SECTION 3: LAG SELECTION */}
      {activeTab === "lag" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-sans text-[10px] font-bold border border-amber-300">
              Tahap 3 / Optimal Lag
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              Penentuan Lag Optimal (Information Criteria)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <strong>Tujuan:</strong> Menentukan jumlah lag terbaik yang meminimalkan kehilangan informasi tanpa overfitting.
            </p>
          </div>

          {/* Criteria Grid for Lags 1-5 */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 text-[11px] font-bold uppercase border-b-2 border-slate-300 tracking-wider">
                <tr>
                  <th className="p-3">Lag (p)</th>
                  <th className="p-3 text-right">AIC(n)</th>
                  <th className="p-3 text-right">HQ(n)</th>
                  <th className="p-3 text-right">SC(n)</th>
                  <th className="p-3 text-right">FPE(n)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {Object.values(lag_selection.criteria_table).map((row) => {
                  const isAicOpt = row.lag === lag_selection.selections.aic;
                  return (
                    <tr
                      key={row.lag}
                      className={
                        isAicOpt
                          ? "bg-emerald-50/80 font-bold border-b border-emerald-200"
                          : "odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors"
                      }
                    >
                      <td className="p-3 font-sans text-slate-900 font-semibold">
                        Lag {row.lag}
                        {isAicOpt && (
                          <span className="ml-2 text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-md font-sans font-bold">
                            Optimal AIC*
                          </span>
                        )}
                      </td>
                      <td className={`p-3 text-right ${isAicOpt ? "text-emerald-900 font-extrabold" : "text-slate-800"}`}>
                        {row.aic} {isAicOpt ? "*" : ""}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {row.hq} {row.lag === lag_selection.selections.hq ? "*" : ""}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {row.sc} {row.lag === lag_selection.selections.sc ? "*" : ""}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {row.fpe} {row.lag === lag_selection.selections.fpe ? "*" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-emerald-50/90 border-2 border-emerald-500 text-center shadow-xs">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">AIC Terpilih</span>
              <div className="text-xl font-bold font-sans text-emerald-950 mt-0.5">Lag {lag_selection.selections.aic}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-100/80 border border-slate-300 text-center shadow-2xs">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">HQ Terpilih</span>
              <div className="text-xl font-bold font-sans text-slate-900 mt-0.5">Lag {lag_selection.selections.hq}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-100/80 border border-slate-300 text-center shadow-2xs">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">SC Terpilih</span>
              <div className="text-xl font-bold font-sans text-slate-900 mt-0.5">Lag {lag_selection.selections.sc}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-100/80 border border-slate-300 text-center shadow-2xs">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">FPE Terpilih</span>
              <div className="text-xl font-bold font-sans text-slate-900 mt-0.5">Lag {lag_selection.selections.fpe}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50/90 border-l-4 border-l-emerald-600 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans shadow-xs">
            <strong className="text-slate-900">Keputusan Lag:</strong> Sesuai metodologi penelitian pada sintaks R, kriteria <strong>Akaike Information Criterion (AIC)</strong> digunakan sebagai acuan utama, memilih <strong>Lag 5</strong> untuk model dasar VAR (yang setara dengan VECM 4 pada first difference).
          </div>
        </div>
      )}

      {/* SECTION 4: JOHANSEN COINTEGRATION */}
      {activeTab === "johansen" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 font-sans text-[10px] font-bold border border-purple-200">
              Tahap 4 / Kointegrasi
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              Uji Kointegrasi Johansen (Trace Test)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <strong>Tujuan:</strong> Menentukan apakah terdapat hubungan linier stasioner (keseimbangan jangka panjang) di antara deret I(1).
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-800 text-[11px] font-bold uppercase border-b-2 border-slate-300 tracking-wider">
                <tr>
                  <th className="p-3">Hipotesis Nol (H0)</th>
                  <th className="p-3 text-right">Trace Statistic</th>
                  <th className="p-3 text-right">Critical Val (10%)</th>
                  <th className="p-3 text-right">Critical Val (5%)</th>
                  <th className="p-3 text-right">Critical Val (1%)</th>
                  <th className="p-3 text-center">Keputusan (α=5%)</th>
                  <th className="p-3 text-left">Interpretasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {cointegration.trace_table.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      row.significant
                        ? "bg-emerald-50/80 font-bold border-b border-emerald-200"
                        : "odd:bg-white even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors"
                    }
                  >
                    <td className="p-3 text-slate-900 font-sans font-semibold">{row.hypothesis}</td>
                    <td className="p-3 text-right font-bold text-emerald-900">{row.statistic}</td>
                    <td className="p-3 text-right text-slate-700">{row.critical_10pct}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{row.critical_5pct}</td>
                    <td className="p-3 text-right text-slate-700">{row.critical_1pct}</td>
                    <td className="p-3 text-center">
                      <Badge variant={row.significant ? "success" : "neutral"}>
                        {row.decision}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-700 font-sans text-xs">
                      {row.significant
                        ? `Statistik ${row.statistic} > ${row.critical_5pct} -> Tolak H0.`
                        : `Statistik ${row.statistic} <= ${row.critical_5pct} -> Gagal tolak H0.`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50/90 border-l-4 border-l-emerald-600 border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-sans shadow-xs space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Kesimpulan Uji Kointegrasi Johansen:
            </h4>
            <p>{cointegration.interpretation}</p>
            <p className="font-bold text-emerald-900">
              Hasil: Terdapat r = {cointegration.cointegration_rank} hubungan kointegrasi. Oleh karena itu, estimasi HARUS dilanjutkan menggunakan model Vector Error Correction Model (VECM).
            </p>
          </div>
        </div>
      )}

      {/* SECTION 5: BARTLETT SPHERICITY */}
      {activeTab === "bartlett" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs ring-1 ring-slate-900/5 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="px-2.5 py-1 rounded-md bg-teal-100 text-teal-900 font-sans text-[10px] font-bold border border-teal-200">
              Tahap Awal / Kelayakan Multivariat
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              Uji Sferisitas Bartlett (Bartlett's Sphericity Test)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <strong>Tujuan:</strong> Menguji apakah terdapat korelasi simultan yang signifikan antar variabel saham, membuktikan kelayakan analisis multivariat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-100/80 border border-slate-300 space-y-3 font-sans text-xs shadow-2xs">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Chi-Square Statistic (χ²):</span>
                <span className="font-bold text-slate-900">{eda.bartlett.statistic}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Degrees of Freedom (df):</span>
                <span className="font-bold text-slate-900">{eda.bartlett.df}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">P-value:</span>
                <span className="font-bold text-emerald-800">{eda.bartlett.p_value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Determinan Matriks Korelasi (|R|):</span>
                <span className="font-bold text-slate-900">{eda.bartlett.det_r}</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-emerald-50/90 border-l-4 border-l-emerald-600 border border-emerald-200 text-xs text-emerald-950 font-sans space-y-2 shadow-xs">
              <h4 className="font-bold text-emerald-950">Keputusan & Makna:</h4>
              <p>
                Karena P-value ({eda.bartlett.p_value}) &lt; 0.05, maka hipotesis nol (H0) bahwa matriks korelasi merupakan matriks identitas <strong>DITOLAK</strong>.
              </p>
              <p className="font-bold text-emerald-900">{eda.bartlett.conclusion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { AnalysisResult, ForecastingData } from "@/types/analytics";
import { fetchDefaultAnalysis, checkBackendHealth, runAnalysisOnRecords } from "@/services/api";

interface AnalyticsContextType {
  data: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  apiConnected: boolean;
  rVersion: string | null;
  activeDatasetName: string;
  selectedHorizon: 3 | 6 | 10 | 12;
  setSelectedHorizon: (h: 3 | 6 | 10 | 12) => void;
  currentForecast: ForecastingData | null;
  refreshData: () => Promise<void>;
  loadDefaultDataset: () => Promise<void>;
  runCustomAnalysis: (records: any[], trainRows?: number, horizon?: number) => Promise<void>;
  setCustomData: (result: AnalysisResult, datasetName: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [rVersion, setRVersion] = useState<string | null>(null);
  const [activeDatasetName, setActiveDatasetName] = useState<string>("Sawit 2024.xlsx");
  const [selectedHorizon, setSelectedHorizon] = useState<3 | 6 | 10 | 12>(12);

  // Load initial data
  const loadInitial = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check backend health
      const health = await checkBackendHealth();
      setApiConnected(health.status === "connected");
      if (health.r_version) {
        setRVersion(health.r_version);
      }

      // Fetch verified analysis results
      const res = await fetchDefaultAnalysis();
      setData(res.result);
      setActiveDatasetName("Sawit 2024.xlsx");
    } catch (err: any) {
      console.error("Failed to load initial analytics:", err);
      setError(err?.message || "Terjadi kesalahan saat memuat data analisis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
    const interval = setInterval(async () => {
      const health = await checkBackendHealth();
      setApiConnected(health.status === "connected");
      if (health.r_version) setRVersion(health.r_version);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    await loadInitial();
  };

  const loadDefaultDataset = async () => {
    await loadInitial();
  };

  const runCustomAnalysis = async (records: any[], trainRows?: number, horizon: number = 12) => {
    setLoading(true);
    setError(null);
    try {
      const res = await runAnalysisOnRecords(records, trainRows, horizon);
      setData(res);
      setActiveDatasetName("Uploaded Dataset");
      setSelectedHorizon(horizon as any);
    } catch (err: any) {
      setError(err?.message || "Gagal menjalankan analisis pada backend R");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setCustomData = (result: AnalysisResult, datasetName: string) => {
    setData(result);
    setActiveDatasetName(datasetName);
  };

  // Get current forecast based on selectedHorizon
  const currentForecast = useMemo(() => {
    if (!data) return null;
    const key = `h_${selectedHorizon}`;
    if (data.forecasting_horizons && data.forecasting_horizons[key]) {
      return data.forecasting_horizons[key];
    }
    return data.forecasting;
  }, [data, selectedHorizon]);

  return (
    <AnalyticsContext.Provider
      value={{
        data,
        loading,
        error,
        apiConnected,
        rVersion,
        activeDatasetName,
        selectedHorizon,
        setSelectedHorizon,
        currentForecast,
        refreshData,
        loadDefaultDataset,
        runCustomAnalysis,
        setCustomData,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}

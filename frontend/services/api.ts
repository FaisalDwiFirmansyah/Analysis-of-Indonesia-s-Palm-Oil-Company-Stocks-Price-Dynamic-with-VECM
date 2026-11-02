// API Service connecting Next.js frontend to R Plumber backend

import { AnalysisResult } from "@/types/analytics";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Fallback loader if API is temporarily unavailable
async function getFallbackDefaultAnalysis(): Promise<AnalysisResult> {
  const res = await fetch("/data/default_analysis.json");
  if (!res.ok) {
    throw new Error("Gagal memuat data fallback default_analysis.json");
  }
  return await res.json();
}

export async function checkBackendHealth(): Promise<{ status: string; r_version?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return { status: "connected", r_version: Array.isArray(data.r_version) ? data.r_version[0] : data.r_version };
    }
    return { status: "offline" };
  } catch {
    return { status: "offline" };
  }
}

export async function fetchDefaultAnalysis(): Promise<{ result: AnalysisResult; source: "live_api" | "local_cache" }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/default-analysis`, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = await res.json();
      const rawResult = json.result || json;
      return { result: rawResult, source: "live_api" };
    }
  } catch (e) {
    console.warn("Backend API not reachable, using local verified dataset cache:", e);
  }

  // Fallback to locally saved verified results
  const localResult = await getFallbackDefaultAnalysis();
  return { result: localResult, source: "local_cache" };
}

export async function runAnalysisOnRecords(
  records: Array<{ Date?: string; SMAR: number; AALI: number; SIMP: number }>,
  trainRows?: number,
  forecastHorizon: number = 12
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records,
      train_rows: trainRows,
      forecast_horizon: forecastHorizon,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorJson.message || "Gagal menjalankan analisis pada backend R");
  }

  const json = await res.json();
  return json.result;
}

export async function uploadDatasetFile(
  file: File
): Promise<{
  validation: {
    is_valid: boolean;
    total_rows: number;
    valid_rows: number;
    missing_rows: number;
    columns: string[];
    variables: string[];
    has_date_column?: boolean;
  };
  preview: {
    head: any[];
    tail: any[];
  };
  clean_data: any[];
}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorJson.message || "Gagal memvalidasi file");
  }

  return await res.json();
}

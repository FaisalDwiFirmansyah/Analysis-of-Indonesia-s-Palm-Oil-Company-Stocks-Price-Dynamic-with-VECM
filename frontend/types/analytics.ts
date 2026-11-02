// TypeScript definitions for Palm Oil Stock Analytics (VAR/VECM)

export interface DescriptiveStat {
  variable: string;
  count: number;
  mean: number;
  sd: number;
  median: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
  skewness: number;
  kurtosis: number;
}

export interface BartlettTest {
  test_name: string;
  statistic: number;
  df: number;
  p_value: number;
  det_r: number;
  is_significant: boolean;
  conclusion: string;
}

export interface EDAData {
  descriptive: Record<string, DescriptiveStat>;
  correlation: Record<string, Record<string, number>>;
  bartlett: BartlettTest;
}

export interface ADFTestResult {
  variable: string;
  test_statistic: number;
  p_value: number;
  lag_order: number;
  is_stationary: boolean;
  status: string;
  interpretation: string;
}

export interface StationarityData {
  level: Record<string, ADFTestResult>;
  first_difference: Record<string, ADFTestResult>;
  all_stationary_level: boolean;
  all_stationary_diff1: boolean;
  summary: {
    order_of_integration: string;
    recommendation: string;
  };
}

export interface LagCriterion {
  lag: number;
  aic: number;
  hq: number;
  sc: number;
  fpe: number;
}

export interface LagSelectionData {
  criteria_table: Record<string, LagCriterion>;
  selections: {
    aic: number;
    hq: number;
    sc: number;
    fpe: number;
  };
  optimal_lag: number;
  criterion_used: string;
}

export interface TraceRow {
  hypothesis: string;
  statistic: number;
  critical_10pct: number;
  critical_5pct: number;
  critical_1pct: number;
  decision: string;
  significant: boolean;
}

export interface CointegrationData {
  test_type: string;
  ecdet: string;
  spec: string;
  K: number;
  trace_table: TraceRow[];
  cointegration_rank: number;
  has_cointegration: boolean;
  interpretation: string;
}

export interface FlowchartStep {
  title: string;
  condition: string;
  result: boolean;
  status: string;
  rank?: number;
}

export interface ModelDecisionData {
  model_code: "VECM" | "VAR_LEVEL" | "VAR_DIFF" | "VAR_DEFAULT";
  model_name: string;
  rule_id: string;
  optimal_lag: number;
  cointegration_rank: number;
  justification: string;
  flowchart: {
    step1_stationarity_level: FlowchartStep;
    step2_stationarity_diff: FlowchartStep;
    step3_cointegration: FlowchartStep;
    final_decision: {
      model_code: string;
      model_name: string;
      rule_id: string;
    };
  };
}

export interface ECTItem {
  variable: string;
  coefficient: number;
  std_error: number;
  t_statistic: number;
  p_value: number;
  significance: string;
  is_significant: boolean;
  speed_of_adjustment_pct: number;
  interpretation: string;
}

export interface CoefficientItem {
  term: string;
  estimate: number;
  std_error: number;
  t_statistic: number;
  p_value: number;
  significance: string;
}

export interface ModelEquation {
  target_variable: string;
  formula_string: string;
  r_squared: number;
  adj_r_squared: number;
  residual_se: number;
  f_statistic?: number;
  f_p_value?: number;
  coefficients: Record<string, CoefficientItem>;
}

export interface ModelEstimationData {
  model_type: string;
  cointegration_rank: number;
  optimal_lag: number;
  ect_summary?: Record<string, ECTItem>;
  equations: Record<string, ModelEquation>;
  cointegrating_vector?: Record<string, number>;
}

export interface DiagnosticItem {
  variable: string;
  statistic: number;
  p_value: number;
  is_normal?: boolean;
  no_autocorrelation?: boolean;
  is_homoscedastic?: boolean;
  status: string;
  interpretation: string;
  lag?: number;
  lags?: number;
}

export interface DiagnosticsData {
  normality: Record<string, DiagnosticItem>;
  autocorrelation: Record<string, DiagnosticItem>;
  heteroscedasticity: Record<string, DiagnosticItem>;
  multicollinearity: {
    vif: Record<string, {
      variable: string;
      values: Record<string, number>;
      max_vif: number;
      has_multicollinearity: boolean;
      interpretation: string;
    }>;
    condition_number: {
      value: number;
      threshold: number;
      has_serious_multicollinearity: boolean;
      status: string;
      interpretation: string;
    };
  };
  stability: {
    max_modulus: number;
    is_stable: boolean;
    status: string;
    roots: Record<string, { real: number; imaginary: number; modulus: number }>;
    interpretation: string;
  };
}

export interface GrangerCausalityItem {
  cause: string;
  target: string;
  f_statistic: number;
  df1: number;
  df2: number;
  p_value: number;
  is_causal: boolean;
  conclusion: string;
}

export interface PairwiseGrangerItem {
  cause: string;
  effect: string;
  f_statistic: number;
  p_value: number;
  is_significant: boolean;
  direction: string;
}

export interface IRFStep {
  period: number;
  shock_SMAR: number;
  lower_SMAR: number;
  upper_SMAR: number;
  shock_AALI: number;
  lower_AALI: number;
  upper_AALI: number;
  shock_SIMP: number;
  lower_SIMP: number;
  upper_SIMP: number;
}

export interface FEVDStep {
  period: number;
  SMAR: number;
  AALI: number;
  SIMP: number;
}

export interface RelationshipsData {
  granger_multivariate: Record<string, GrangerCausalityItem>;
  granger_pairwise: PairwiseGrangerItem[];
  irf: Record<string, IRFStep[]>;
  fevd: Record<string, FEVDStep[]>;
  key_findings: {
    smar: string;
    aali: string;
    simp: string;
  };
}

export interface ForecastPeriod {
  period: number;
  date: string;
  forecast: number;
  lower_95: number;
  upper_95: number;
  actual?: number;
  error?: number;
  ape?: number;
}

export interface EvaluationItem {
  variable: string;
  mape: number;
  rmse: number;
  mae: number;
  n_periods: number;
  accuracy_category: string;
}

export interface ForecastingData {
  horizon: number;
  forecasts: Record<string, ForecastPeriod[]>;
  has_evaluation: boolean;
  evaluation?: Record<string, EvaluationItem>;
  overall_mape?: number;
  overall_accuracy_category?: string;
  interpretation: string;
}

export interface HistoryRecord {
  date: string;
  SMAR: number;
  AALI: number;
  SIMP: number;
  is_training: boolean;
}

export interface AnalysisResult {
  metadata: {
    title: string;
    total_observations: number;
    training_observations: number;
    testing_observations: number;
    date_start: string;
    date_end: string;
    variables: string[];
    timestamp: string;
  };
  eda: EDAData;
  stationarity: StationarityData;
  lag_selection: LagSelectionData;
  cointegration: CointegrationData;
  model_decision: ModelDecisionData;
  model_estimation: ModelEstimationData;
  diagnostics: DiagnosticsData;
  relationships: RelationshipsData;
  forecasting: ForecastingData;
  forecasting_horizons: Record<string, ForecastingData>;
  history: HistoryRecord[];
}

# Econometric Analysis Pipeline Orchestrator

# Source all modular analysis files
base_dir <- if (dir.exists("backend/analysis")) "backend/analysis" else "analysis"
source(file.path(base_dir, "eda.R"))
source(file.path(base_dir, "stationarity.R"))
source(file.path(base_dir, "cointegration.R"))
source(file.path(base_dir, "model_decision.R"))
source(file.path(base_dir, "model_estimation.R"))
source(file.path(base_dir, "diagnostics.R"))
source(file.path(base_dir, "relationships.R"))
source(file.path(base_dir, "forecasting.R"))

run_full_analysis <- function(raw_df, train_rows = NULL, forecast_horizon = 12) {
  var_names <- c("SMAR", "AALI", "SIMP")
  
  # 1. Validation
  missing_cols <- setdiff(var_names, names(raw_df))
  if (length(missing_cols) > 0) {
    stop(paste("Dataset kekurangan kolom yang dibutuhkan:", paste(missing_cols, collapse = ", ")))
  }
  
  # Ensure clean numeric columns
  for (v in var_names) {
    raw_df[[v]] <- as.numeric(raw_df[[v]])
  }
  raw_df <- na.omit(raw_df)
  total_obs <- nrow(raw_df)
  
  if (total_obs < 30) {
    stop("Jumlah baris data terlalu sedikit (minimal 30 observasi untuk estimasi VAR/VECM).")
  }
  
  has_date <- "Date" %in% names(raw_df)
  dates_all <- if (has_date) as.character(raw_df$Date) else paste0("P_", 1:total_obs)
  
  # Train/Test Split
  # If 144 rows, split 132 train and 12 test (matching academic study)
  if (is.null(train_rows)) {
    if (total_obs >= 144) {
      train_n <- total_obs - 12
    } else if (total_obs > 40) {
      train_n <- total_obs - min(12, floor(total_obs * 0.15))
    } else {
      train_n <- total_obs
    }
  } else {
    train_n <- min(train_rows, total_obs)
  }
  
  test_n <- total_obs - train_n
  train_df <- raw_df[1:train_n, var_names]
  test_df <- if (test_n > 0) raw_df[(train_n + 1):total_obs, var_names] else NULL
  dates_train <- dates_all[1:train_n]
  dates_test <- if (test_n > 0) dates_all[(train_n + 1):total_obs] else NULL
  
  train_ts <- ts(as.matrix(train_df))
  colnames(train_ts) <- var_names
  
  # 2. Exploratory Data Analysis
  eda_res <- compute_eda(train_df)
  
  # 3. Stationarity Testing (ADF)
  stat_res <- test_stationarity(train_ts)
  
  # 4. Lag Selection & Cointegration Test
  coint_res <- select_lag_and_cointegration(train_ts, lag_max = 5)
  opt_lag <- coint_res$lag_selection$optimal_lag
  r_rank <- coint_res$cointegration$cointegration_rank
  vecm_rank <- if (!is.null(coint_res$cointegration$vecm_rank)) coint_res$cointegration$vecm_rank else max(1, min(r_rank, ncol(train_ts) - 1))
  kointest_obj <- coint_res$kointest
  
  # 5. Model Decision
  decision_res <- determine_model(
    stat_res$all_stationary_level,
    stat_res$all_stationary_diff1,
    r_rank,
    opt_lag
  )
  
  # 6. Model Estimation
  est_res <- estimate_model(
    kointest_obj,
    train_ts,
    decision_res$model_code,
    vecm_rank,
    opt_lag
  )
  
  # Underlying VAR for stability test and VIF
  var_base <- VAR(train_ts, p = opt_lag, type = "const")
  
  # 7. Model Diagnostics
  diag_res <- run_diagnostics(
    est_res$residuals,
    var_base,
    train_ts,
    opt_lag
  )
  
  # 8. Relationship Analysis (Granger, IRF, FEVD)
  var_representation <- est_res$var_representation
  rel_res <- analyze_relationships(var_representation, var_base, n_ahead = 12)
  
  # 9. Forecasting for multiple horizons (3, 6, 10, 12)
  forecasts_horizons <- list()
  for (h in c(3, 6, 10, 12)) {
    forecasts_horizons[[paste0("h_", h)]] <- generate_forecast(
      var_representation,
      train_df,
      test_df,
      n_ahead = h,
      dates_test = dates_test,
      model_type = est_res$model_type
    )
  }
  
  # 10. Historical Data Records for Frontend Charts
  history_records <- list()
  for (i in 1:total_obs) {
    history_records[[i]] <- list(
      date = dates_all[i],
      SMAR = raw_df$SMAR[i],
      AALI = raw_df$AALI[i],
      SIMP = raw_df$SIMP[i],
      is_training = i <= train_n
    )
  }
  
  # Return complete unified package
  return(list(
    metadata = list(
      title = "Palm Oil Stock Analytics VAR/VECM Pipeline",
      total_observations = total_obs,
      training_observations = train_n,
      testing_observations = test_n,
      date_start = dates_all[1],
      date_end = dates_all[total_obs],
      variables = var_names,
      timestamp = as.character(Sys.time())
    ),
    eda = eda_res,
    stationarity = stat_res,
    lag_selection = coint_res$lag_selection,
    cointegration = coint_res$cointegration,
    model_decision = decision_res,
    model_estimation = list(
      model_type = est_res$model_type,
      cointegration_rank = r_rank,
      optimal_lag = opt_lag,
      ect_summary = est_res$ect_summary,
      equations = est_res$equations,
      cointegrating_vector = est_res$cointegrating_vector
    ),
    diagnostics = diag_res,
    relationships = rel_res,
    forecasting = forecasts_horizons$h_12, # default 12 horizon
    forecasting_horizons = forecasts_horizons,
    history = history_records
  ))
}

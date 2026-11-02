# Cointegration and Lag Selection Module
suppressPackageStartupMessages({
  library(vars)
  library(urca)
})

select_lag_and_cointegration <- function(tsdata, lag_max = 5) {
  # 1. Optimal Lag Selection
  lag_sel <- VARselect(tsdata, lag.max = lag_max, type = "const")
  
  criteria_matrix <- lag_sel$criteria
  lags <- 1:ncol(criteria_matrix)
  criteria_table <- list()
  for (l in lags) {
    criteria_table[[paste0("lag_", l)]] <- list(
      lag = l,
      aic = round(criteria_matrix["AIC(n)", l], 4),
      hq = round(criteria_matrix["HQ(n)", l], 4),
      sc = round(criteria_matrix["SC(n)", l], 4),
      fpe = signif(criteria_matrix["FPE(n)", l], 6)
    )
  }
  
  selections <- list(
    aic = as.integer(lag_sel$selection["AIC(n)"]),
    hq = as.integer(lag_sel$selection["HQ(n)"]),
    sc = as.integer(lag_sel$selection["SC(n)"]),
    fpe = as.integer(lag_sel$selection["FPE(n)"])
  )
  optimal_lag <- selections$aic
  
  # 2. Johansen Cointegration Test (Trace Test)
  # urca::ca.jo requires K >= 2 for the underlying VAR in levels
  k_jo <- max(2, optimal_lag)
  kointest <- ca.jo(tsdata, K = k_jo, type = "trace", ecdet = "const", spec = "longrun")
  
  test_stats <- kointest@teststat
  cvals <- kointest@cval
  
  # Sequential Trace Test
  # Index mapping in ca.jo:
  # test_stats has elements for: r<=2 (index 1), r<=1 (index 2), r=0 (index 3)
  stat_r0 <- round(test_stats[3], 2)
  cv_r0_10 <- round(cvals[3, "10pct"], 2)
  cv_r0_5 <- round(cvals[3, "5pct"], 2)
  cv_r0_1 <- round(cvals[3, "1pct"], 2)
  
  stat_r1 <- round(test_stats[2], 2)
  cv_r1_10 <- round(cvals[2, "10pct"], 2)
  cv_r1_5 <- round(cvals[2, "5pct"], 2)
  cv_r1_1 <- round(cvals[2, "1pct"], 2)
  
  stat_r2 <- round(test_stats[1], 2)
  cv_r2_10 <- round(cvals[1, "10pct"], 2)
  cv_r2_5 <- round(cvals[1, "5pct"], 2)
  cv_r2_1 <- round(cvals[1, "1pct"], 2)
  
  # Determine cointegration rank r sequentially at 5% alpha
  r_rank <- 0
  if (!is.na(stat_r0) && !is.na(cv_r0_5) && stat_r0 > cv_r0_5) {
    r_rank <- 1
    if (!is.na(stat_r1) && !is.na(cv_r1_5) && stat_r1 > cv_r1_5) {
      r_rank <- 2
      if (!is.na(stat_r2) && !is.na(cv_r2_5) && stat_r2 > cv_r2_5) {
        r_rank <- 3
      }
    }
  }
  
  # For VECM estimation, cointegration rank cannot exceed K - 1
  vecm_rank <- if (r_rank >= ncol(tsdata)) ncol(tsdata) - 1 else r_rank
  
  trace_rows <- list(
    list(
      hypothesis = "None (r = 0)",
      statistic = stat_r0,
      critical_10pct = cv_r0_10,
      critical_5pct = cv_r0_5,
      critical_1pct = cv_r0_1,
      decision = if (stat_r0 > cv_r0_5) "Tolak H0 (r >= 1)" else "Gagal Tolak H0 (r = 0)",
      significant = stat_r0 > cv_r0_5
    ),
    list(
      hypothesis = "At most 1 (r <= 1)",
      statistic = stat_r1,
      critical_10pct = cv_r1_10,
      critical_5pct = cv_r1_5,
      critical_1pct = cv_r1_1,
      decision = if (stat_r1 > cv_r1_5) "Tolak H0 (r >= 2)" else "Gagal Tolak H0 (r = 1)",
      significant = stat_r1 > cv_r1_5
    ),
    list(
      hypothesis = "At most 2 (r <= 2)",
      statistic = stat_r2,
      critical_10pct = cv_r2_10,
      critical_5pct = cv_r2_5,
      critical_1pct = cv_r2_1,
      decision = if (stat_r2 > cv_r2_5) "Tolak H0 (r = 3)" else "Gagal Tolak H0 (r = 2)",
      significant = stat_r2 > cv_r2_5
    )
  )
  
  return(list(
    lag_selection = list(
      criteria_table = criteria_table,
      selections = selections,
      optimal_lag = optimal_lag,
      criterion_used = "Akaike Information Criterion (AIC)"
    ),
    cointegration = list(
      test_type = "Johansen Trace Test",
      ecdet = "const",
      spec = "longrun",
      K = optimal_lag,
      trace_table = trace_rows,
      cointegration_rank = r_rank,
      vecm_rank = vecm_rank,
      has_cointegration = r_rank > 0,
      interpretation = if (r_rank > 0) {
        sprintf("Trace statistic menolak H0: r=0 (%.2f > %.2f pada α=5%%), sehingga terdapat %d hubungan kointegrasi. Hal ini membuktikan adanya hubungan keseimbangan jangka panjang antar harga saham kelapa sawit.", stat_r0, cv_r0_5, r_rank)
      } else {
        "Trace statistic gagal menolak H0: r=0. Tidak ditemukan hubungan kointegrasi (keseimbangan jangka panjang) antar variabel."
      }
    ),
    kointest = kointest
  ))
}

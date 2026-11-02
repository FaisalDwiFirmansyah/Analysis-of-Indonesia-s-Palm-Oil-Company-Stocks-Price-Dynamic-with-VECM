# Automatic Model Decision Module

determine_model <- function(all_stat_level, all_stat_diff1, cointegration_rank, optimal_lag) {
  model_code <- ""
  model_name <- ""
  rule_id <- ""
  justification <- ""
  
  if (all_stat_level) {
    model_code <- "VAR_LEVEL"
    model_name <- "Vector Autoregression (VAR Level)"
    rule_id <- "RULE_1_STATIONARY_LEVEL"
    justification <- sprintf(
      "Semua variabel (SMAR, AALI, SIMP) telah stasioner pada level (I(0)). Berdasarkan prinsip ekonometrika time series, pemodelan VAR dapat langsung diestimasi pada level dengan lag optimal %d tanpa risiko regresi lancung (spurious regression).",
      optimal_lag
    )
  } else if (all_stat_diff1 && cointegration_rank > 0) {
    model_code <- "VECM"
    model_name <- "Vector Error Correction Model (VECM)"
    rule_id <- "RULE_2_VECM"
    justification <- sprintf(
      "Data tidak stasioner pada level namun stasioner pada first difference (terintegrasi pada derajat yang sama I(1)), serta hasil Uji Kointegrasi Johansen mengonfirmasi adanya %d hubungan kointegrasi pada α=5%%. Oleh karena itu, model yang tepat adalah VECM(K=%d, r=%d). VECM mampu memisahkan dinamika penyesuaian jangka pendek (differencing) dan mekanisme koreksi menuju keseimbangan jangka panjang (Error Correction Term).",
      cointegration_rank, optimal_lag, cointegration_rank
    )
  } else if (all_stat_diff1 && cointegration_rank == 0) {
    model_code <- "VAR_DIFF"
    model_name <- "Vector Autoregression pada First Difference (VAR-Diff)"
    rule_id <- "RULE_3_VAR_DIFF"
    justification <- sprintf(
      "Data stasioner pada first difference (I(1)), tetapi Uji Johansen menunjukkan TIDAK terdapat kointegrasi (r = 0). Tanpa hubungan keseimbangan jangka panjang, sistem dimodelkan menggunakan VAR pada selisih pertama (first difference) dengan lag optimal %d untuk menangkap dinamika jangka pendek.",
      optimal_lag
    )
  } else {
    model_code <- "VAR_DEFAULT"
    model_name <- "Vector Autoregression (Fallback / Warning)"
    rule_id <- "RULE_4_ANOMALY"
    justification <- "Karakteristik data tidak sepenuhnya memenuhi asumsi baku VAR/VECM standar. Model VAR digunakan sebagai acuan dasar dengan peringatan bahwa kestabilan dan interpretasi memerlukan pengujian lebih mendalam."
  }
  
  flowchart <- list(
    step1_stationarity_level = list(
      title = "Uji Stasioneritas Level (ADF)",
      condition = "Apakah semua deret I(0)?",
      result = all_stat_level,
      status = if (all_stat_level) "Lolos (Semua Stasioner)" else "Tidak Lolos (Perlu Differencing)"
    ),
    step2_stationarity_diff = list(
      title = "Uji Stasioneritas First Difference (ADF)",
      condition = "Apakah semua deret I(1)?",
      result = all_stat_diff1,
      status = if (all_stat_diff1) "Lolos (Semua I(1))" else "Tidak Lolos"
    ),
    step3_cointegration = list(
      title = "Uji Kointegrasi Johansen",
      condition = "Apakah terdapat kointegrasi (r > 0)?",
      result = cointegration_rank > 0,
      rank = cointegration_rank,
      status = if (cointegration_rank > 0) sprintf("Lolos (%d Hubungan Kointegrasi)", cointegration_rank) else "Tidak Ada Kointegrasi (r = 0)"
    ),
    final_decision = list(
      model_code = model_code,
      model_name = model_name,
      rule_id = rule_id
    )
  )
  
  return(list(
    model_code = model_code,
    model_name = model_name,
    rule_id = rule_id,
    optimal_lag = optimal_lag,
    cointegration_rank = cointegration_rank,
    justification = justification,
    flowchart = flowchart
  ))
}

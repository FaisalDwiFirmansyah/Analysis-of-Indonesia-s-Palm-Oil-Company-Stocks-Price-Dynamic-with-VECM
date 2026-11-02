# Stationarity (ADF Test) Module
suppressPackageStartupMessages(library(tseries))

test_stationarity <- function(tsdata) {
  var_names <- c("SMAR", "AALI", "SIMP")
  
  level_results <- list()
  diff1_results <- list()
  
  all_stat_level <- TRUE
  all_stat_diff1 <- TRUE
  
  for (v in var_names) {
    # Level ADF Test
    s <- tsdata[, v]
    adf_lvl <- adf.test(s)
    lvl_p <- adf_lvl$p.value
    is_lvl_stat <- !is.na(lvl_p) && lvl_p < 0.05
    if (!is_lvl_stat) all_stat_level <- FALSE
    
    level_results[[v]] <- list(
      variable = v,
      test_statistic = round(adf_lvl$statistic[[1]], 4),
      p_value = if (!is.na(lvl_p)) round(lvl_p, 4) else 1.0,
      lag_order = adf_lvl$parameter[[1]],
      is_stationary = is_lvl_stat,
      status = if (is_lvl_stat) "STASIONER" else "TIDAK STASIONER",
      interpretation = if (is_lvl_stat) {
        sprintf("P-value (%.4f) < 0.05, tolak H0. Deret %s stasioner pada level.", lvl_p, v)
      } else {
        sprintf("P-value (%.4f) >= 0.05, gagal tolak H0. Deret %s mengandung unit root (tidak stasioner pada level).", if (!is.na(lvl_p)) lvl_p else 1.0, v)
      }
    )
    
    # First Difference ADF Test
    ds <- diff(s)
    adf_diff <- adf.test(ds)
    diff_p <- adf_diff$p.value
    is_diff_stat <- !is.na(diff_p) && diff_p < 0.05
    if (!is_diff_stat) all_stat_diff1 <- FALSE
    
    diff1_results[[v]] <- list(
      variable = paste0("Δ", v),
      test_statistic = round(adf_diff$statistic[[1]], 4),
      p_value = if (!is.na(diff_p)) round(diff_p, 4) else 0.01,
      lag_order = adf_diff$parameter[[1]],
      is_stationary = is_diff_stat,
      status = if (is_diff_stat) "STASIONER" else "TIDAK STASIONER",
      interpretation = if (is_diff_stat) {
        sprintf("P-value (%.4f) < 0.05, tolak H0. Deret first difference %s stasioner (terintegrasi I(1)).", diff_p, v)
      } else {
        sprintf("P-value (%.4f) >= 0.05, gagal tolak H0. Deret first difference %s belum stasioner.", if (!is.na(diff_p)) diff_p else 1.0, v)
      }
    )
  }
  
  return(list(
    level = level_results,
    first_difference = diff1_results,
    all_stationary_level = all_stat_level,
    all_stationary_diff1 = all_stat_diff1,
    summary = list(
      order_of_integration = if (all_stat_level) "I(0)" else if (all_stat_diff1) "I(1)" else "I(2) atau lebih tinggi",
      recommendation = if (all_stat_level) {
        "Semua variabel stasioner pada level -> Langsung gunakan VAR Level."
      } else if (all_stat_diff1) {
        "Semua variabel stasioner pada first difference (I(1)) -> Lanjutkan ke Uji Kointegrasi Johansen."
      } else {
        "Variabel memerlukan differencing lebih lanjut atau transformasi data."
      }
    )
  ))
}

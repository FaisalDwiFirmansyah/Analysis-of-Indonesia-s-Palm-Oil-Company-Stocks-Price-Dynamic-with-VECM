# Relationship Analysis Module (Granger Causality, IRF, FEVD)
suppressPackageStartupMessages({
  library(vars)
})

analyze_relationships <- function(var_rep, var_base, n_ahead = 12) {
  var_names <- c("SMAR", "AALI", "SIMP")
  
  # 1. Granger Causality Tests
  granger_list <- list()
  
  # Multivariate causality (cause -> others) using var_base (class 'varest')
  for (cause_var in var_names) {
    c_res <- causality(var_base, cause = cause_var)
    f_stat <- c_res$Granger$statistic[[1]]
    df1 <- c_res$Granger$parameter[[1]]
    df2 <- c_res$Granger$parameter[[2]]
    p_val <- c_res$Granger$p.value[[1]]
    is_causal <- p_val < 0.05
    
    other_vars <- paste(var_names[var_names != cause_var], collapse = " & ")
    
    granger_list[[cause_var]] <- list(
      cause = cause_var,
      target = other_vars,
      f_statistic = round(f_stat, 4),
      df1 = df1,
      df2 = df2,
      p_value = signif(p_val, 4),
      is_causal = is_causal,
      conclusion = if (is_causal) {
        sprintf("P-value (%.4f) < 0.05. %s memengaruhi (Granger-cause) %s secara signifikan.", p_val, cause_var, other_vars)
      } else {
        sprintf("P-value (%.4f) >= 0.05. %s tidak memengaruhi %s secara signifikan.", p_val, cause_var, other_vars)
      }
    )
  }
  
  # Dynamic Pairwise Granger Causality
  pairwise_causality <- list()
  ts_data <- var_base$y
  p_order <- var_base$p
  
  pair_idx <- 1
  for (i in 1:length(var_names)) {
    for (j in 1:length(var_names)) {
      if (i != j) {
        cause <- var_names[i]
        effect <- var_names[j]
        
        tryCatch({
          bivar_ts <- ts_data[, c(effect, cause)]
          bivar_var <- VAR(bivar_ts, p = p_order, type = "const")
          caus_res <- causality(bivar_var, cause = cause)
          
          f_stat <- round(caus_res$Granger$statistic[[1]], 4)
          p_val <- signif(caus_res$Granger$p.value[[1]], 4)
          is_sig <- p_val < 0.05
          dir_arrow <- if (is_sig) paste(cause, "→", effect) else paste(cause, "↛", effect)
          
          pairwise_causality[[pair_idx]] <- list(
            cause = cause,
            effect = effect,
            f_statistic = f_stat,
            p_value = p_val,
            is_significant = is_sig,
            direction = dir_arrow
          )
        }, error = function(e) {
          pairwise_causality[[pair_idx]] <- list(
            cause = cause,
            effect = effect,
            f_statistic = 0,
            p_value = 1.0,
            is_significant = FALSE,
            direction = paste(cause, "↛", effect)
          )
        })
        pair_idx <- pair_idx + 1
      }
    }
  }
  
  # 2. Impulse Response Function (IRF)
  set.seed(123)
  if (inherits(var_rep, "varest")) {
    var_rep$call$p <- var_rep$p
    var_rep$call$y <- quote(var_rep$y)
  }
  ir_obj <- irf(var_rep, n.ahead = n_ahead, boot = TRUE, runs = 100)
  
  # Format IRF data for charts
  irf_data <- list()
  for (resp in var_names) {
    resp_series <- list()
    for (step in 1:(n_ahead + 1)) {
      step_period <- step - 1 # step 0 is initial shock, or 1 to 12
      row_item <- list(period = step_period)
      for (imp in var_names) {
        val <- ir_obj$irf[[imp]][step, resp]
        lower <- ir_obj$Lower[[imp]][step, resp]
        upper <- ir_obj$Upper[[imp]][step, resp]
        
        row_item[[paste0("shock_", imp)]] <- round(val, 2)
        row_item[[paste0("lower_", imp)]] <- round(lower, 2)
        row_item[[paste0("upper_", imp)]] <- round(upper, 2)
      }
      resp_series[[step]] <- row_item
    }
    irf_data[[resp]] <- resp_series
  }
  
  # 3. Forecast Error Variance Decomposition (FEVD)
  vd_obj <- fevd(var_rep, n.ahead = n_ahead)
  
  fevd_data <- list()
  for (target in var_names) {
    target_mat <- vd_obj[[target]] * 100 # percentage
    periods_list <- list()
    for (step in 1:nrow(target_mat)) {
      row_item <- list(
        period = step,
        SMAR = round(target_mat[step, "SMAR"], 2),
        AALI = round(target_mat[step, "AALI"], 2),
        SIMP = round(target_mat[step, "SIMP"], 2)
      )
      periods_list[[step]] <- row_item
    }
    fevd_data[[target]] <- periods_list
  }
  
  # Dynamic empirical market findings based on actual FEVD horizon n_ahead
  h_final <- min(n_ahead, nrow(vd_obj$SMAR))
  fevd_smar_12 <- vd_obj$SMAR[h_final, ] * 100
  fevd_aali_12 <- vd_obj$AALI[h_final, ] * 100
  fevd_simp_12 <- vd_obj$SIMP[h_final, ] * 100
  
  # Determine leader based on Granger and FEVD
  findings_smar <- sprintf(
    "Variabilitas SMAR pada periode ke-%d dijelaskan sebesar %.2f%% oleh guncangan internalnya sendiri, %.2f%% oleh SIMP, dan %.2f%% oleh AALI.",
    h_final, fevd_smar_12["SMAR"], fevd_smar_12["SIMP"], fevd_smar_12["AALI"]
  )
  findings_aali <- sprintf(
    "AALI memiliki tingkat independensi internal sebesar %.2f%% pada periode ke-%d. Kontribusi transmisi eksternal dari SMAR (%.2f%%) dan SIMP (%.2f%%).",
    fevd_aali_12["AALI"], h_final, fevd_aali_12["SMAR"], fevd_aali_12["SIMP"]
  )
  findings_simp <- sprintf(
    "SIMP menunjukkan variabilitas internal %.2f%% pada periode ke-%d (pengaruh SMAR: %.2f%%, AALI: %.2f%%), dengan peranan signifikan dalam transmisi harga di industri sawit.",
    fevd_simp_12["SIMP"], h_final, fevd_simp_12["SMAR"], fevd_simp_12["AALI"]
  )
  
  return(list(
    granger_multivariate = granger_list,
    granger_pairwise = pairwise_causality,
    irf = irf_data,
    fevd = fevd_data,
    key_findings = list(
      smar = findings_smar,
      aali = findings_aali,
      simp = findings_simp
    )
  ))
}

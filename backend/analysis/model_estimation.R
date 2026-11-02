# Model Estimation Module (VAR and VECM)
suppressPackageStartupMessages({
  library(vars)
  library(urca)
})

get_significance_stars <- function(p) {
  if (is.na(p)) return("")
  if (p < 0.001) return("***")
  if (p < 0.01) return("**")
  if (p < 0.05) return("*")
  if (p < 0.1) return(".")
  return("")
}

estimate_model <- function(kointest, tsdata, model_code, cointegration_rank, optimal_lag) {
  var_names <- c("SMAR", "AALI", "SIMP")
  
  if (model_code == "VECM") {
    # 1. Estimate VECM using cajorls
    vecm_fit <- cajorls(kointest, r = cointegration_rank)
    rlm_summary <- summary(vecm_fit$rlm)
    
    # 2. Extract Beta (cointegrating vector)
    beta_mat <- vecm_fit$beta
    beta_list <- list()
    for (i in 1:nrow(beta_mat)) {
      beta_list[[rownames(beta_mat)[i]]] <- round(beta_mat[i, 1], 6)
    }
    
    # 3. Extract Equations, ECTs, and Short-Run Dynamics
    equations <- list()
    ect_summary <- list()
    
    for (i in 1:length(var_names)) {
      v <- var_names[i]
      sum_eq <- rlm_summary[[i]]
      coef_tab <- sum_eq$coefficients
      
      # Extract ECT
      ect_est <- coef_tab["ect1", "Estimate"]
      ect_se <- coef_tab["ect1", "Std. Error"]
      ect_t <- coef_tab["ect1", "t value"]
      ect_p <- coef_tab["ect1", "Pr(>|t|)"]
      
      ect_summary[[v]] <- list(
        variable = v,
        coefficient = round(ect_est, 4),
        std_error = round(ect_se, 4),
        t_statistic = round(ect_t, 4),
        p_value = signif(ect_p, 4),
        significance = get_significance_stars(ect_p),
        is_significant = ect_p < 0.05,
        speed_of_adjustment_pct = round(abs(ect_est) * 100, 2),
        interpretation = if (ect_p < 0.05 && ect_est < 0) {
          sprintf("Koefisien ECT negatif signifikan (%.4f, p < 0.05). Terjadi penyesuaian menuju keseimbangan jangka panjang sebesar %.2f%% per periode pasca shock.", ect_est, abs(ect_est) * 100)
        } else if (ect_p < 0.05) {
          sprintf("Koefisien ECT positif signifikan (%.4f, p < 0.05).", ect_est)
        } else {
          sprintf("Koefisien ECT tidak signifikan (p = %.4f >= 0.05). Variabel %s tidak merespons deviasi keseimbangan jangka panjang secara signifikan dan cenderung bergerak independen.", ect_p, v)
        }
      )
      
      # Short run coefficients
      coef_list <- list()
      formula_terms <- c()
      
      for (r_name in rownames(coef_tab)) {
        est <- coef_tab[r_name, "Estimate"]
        se <- coef_tab[r_name, "Std. Error"]
        t_val <- coef_tab[r_name, "t value"]
        p_val <- coef_tab[r_name, "Pr(>|t|)"]
        stars <- get_significance_stars(p_val)
        
        coef_list[[r_name]] <- list(
          term = r_name,
          estimate = round(est, 4),
          std_error = round(se, 4),
          t_statistic = round(t_val, 4),
          p_value = signif(p_val, 4),
          significance = stars
        )
        
        # Build formula string
        sign_str <- if (est >= 0 && length(formula_terms) > 0) "+ " else if (est < 0) "- " else ""
        abs_val <- abs(est)
        formula_terms <- c(formula_terms, sprintf("%s%.4f * %s", sign_str, abs_val, r_name))
      }
      
      formula_str <- paste(paste0("Δ", v, "(t) ="), paste(formula_terms, collapse = " "))
      
      f_stat <- sum_eq$fstatistic
      f_p <- if (!is.null(f_stat)) {
        1 - pf(f_stat[1], f_stat[2], f_stat[3])
      } else NA
      
      equations[[v]] <- list(
        target_variable = paste0("Δ", v),
        formula_string = formula_str,
        r_squared = round(sum_eq$r.squared, 4),
        adj_r_squared = round(sum_eq$adj.r.squared, 4),
        residual_se = round(sum_eq$sigma, 2),
        f_statistic = if (!is.null(f_stat)) round(f_stat[[1]], 3) else NULL,
        f_p_value = if (!is.null(f_p)) signif(f_p, 4) else NULL,
        coefficients = coef_list
      )
    }
    
    # 4. VAR representation via vec2var for forecasting and post-estimation
    var_rep <- vec2var(kointest, r = cointegration_rank)
    
    # In-sample residuals
    resids <- residuals(vecm_fit$rlm)
    colnames(resids) <- var_names
    
    return(list(
      model_type = "VECM",
      cointegration_rank = cointegration_rank,
      lags = optimal_lag,
      cointegrating_vector = beta_list,
      ect_summary = ect_summary,
      equations = equations,
      residuals = resids,
      var_representation = var_rep,
      model_obj = vecm_fit
    ))
    
  } else {
    # VAR (Level or Diff)
    data_for_var <- if (model_code == "VAR_DIFF") diff(tsdata) else tsdata
    var_fit <- VAR(data_for_var, p = optimal_lag, type = "const")
    var_summary <- summary(var_fit)
    
    equations <- list()
    for (v in var_names) {
      eq_data <- var_fit$varresult[[v]]
      sum_eq <- summary(eq_data)
      coef_tab <- sum_eq$coefficients
      
      coef_list <- list()
      formula_terms <- c()
      
      for (r_name in rownames(coef_tab)) {
        est <- coef_tab[r_name, "Estimate"]
        se <- coef_tab[r_name, "Std. Error"]
        t_val <- coef_tab[r_name, "t value"]
        p_val <- coef_tab[r_name, "Pr(>|t|)"]
        stars <- get_significance_stars(p_val)
        
        coef_list[[r_name]] <- list(
          term = r_name,
          estimate = round(est, 4),
          std_error = round(se, 4),
          t_statistic = round(t_val, 4),
          p_value = signif(p_val, 4),
          significance = stars
        )
        
        sign_str <- if (est >= 0 && length(formula_terms) > 0) "+ " else if (est < 0) "- " else ""
        formula_terms <- c(formula_terms, sprintf("%s%.4f * %s", sign_str, abs(est), r_name))
      }
      
      prefix <- if (model_code == "VAR_DIFF") "Δ" else ""
      formula_str <- paste(paste0(prefix, v, "(t) ="), paste(formula_terms, collapse = " "))
      
      f_stat <- sum_eq$fstatistic
      f_p <- if (!is.null(f_stat)) {
        1 - pf(f_stat[1], f_stat[2], f_stat[3])
      } else NA
      
      equations[[v]] <- list(
        target_variable = paste0(prefix, v),
        formula_string = formula_str,
        r_squared = round(sum_eq$r.squared, 4),
        adj_r_squared = round(sum_eq$adj.r.squared, 4),
        residual_se = round(sum_eq$sigma, 2),
        f_statistic = if (!is.null(f_stat)) round(f_stat[[1]], 3) else NULL,
        f_p_value = if (!is.null(f_p)) signif(f_p, 4) else NULL,
        coefficients = coef_list
      )
    }
    
    resids <- residuals(var_fit)
    colnames(resids) <- var_names
    
    return(list(
      model_type = model_code,
      cointegration_rank = 0,
      lags = optimal_lag,
      cointegrating_vector = list(),
      ect_summary = list(),
      equations = equations,
      residuals = resids,
      var_representation = var_fit,
      model_obj = var_fit
    ))
  }
}

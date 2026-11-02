# Model Diagnostics Module
suppressPackageStartupMessages({
  library(vars)
  library(tseries)
  library(FinTS)
  library(car)
})

run_diagnostics <- function(resids, var_base, tsdata, optimal_lag) {
  var_names <- c("SMAR", "AALI", "SIMP")
  
  # 1. Normality Test (Jarque-Bera)
  normality_results <- list()
  for (v in var_names) {
    jb <- jarque.bera.test(resids[, v])
    is_norm <- jb$p.value > 0.05
    normality_results[[v]] <- list(
      variable = v,
      statistic = round(jb$statistic[[1]], 4),
      p_value = signif(jb$p.value, 4),
      is_normal = is_norm,
      status = if (is_norm) "NORMAL" else "TIDAK NORMAL",
      interpretation = if (is_norm) {
        sprintf("P-value (%.4f) > 0.05. Residual %s berdistribusi normal.", jb$p.value, v)
      } else {
        sprintf("P-value (%.4f) <= 0.05. Residual %s tidak berdistribusi normal.", jb$p.value, v)
      }
    )
  }
  
  # 2. Autocorrelation Test (Ljung-Box)
  autocorr_results <- list()
  for (v in var_names) {
    lb <- Box.test(resids[, v], lag = 12, type = "Ljung-Box")
    no_autocorr <- lb$p.value > 0.05
    autocorr_results[[v]] <- list(
      variable = v,
      statistic = round(lb$statistic[[1]], 4),
      p_value = signif(lb$p.value, 4),
      lag = 12,
      no_autocorrelation = no_autocorr,
      status = if (no_autocorr) "BEBAS AUTOKORELASI" else "TERDAPAT AUTOKORELASI",
      interpretation = if (no_autocorr) {
        sprintf("P-value (%.4f) > 0.05. Tidak terdapat autokorelasi serial pada residual %s.", lb$p.value, v)
      } else {
        sprintf("P-value (%.4f) <= 0.05. Terdapat indikasi autokorelasi serial pada residual %s.", lb$p.value, v)
      }
    )
  }
  
  # 3. Heteroscedasticity Test (ARCH-LM)
  arch_results <- list()
  for (v in var_names) {
    arch <- ArchTest(resids[, v], lags = 5)
    is_homo <- arch$p.value > 0.05
    arch_results[[v]] <- list(
      variable = v,
      statistic = round(arch$statistic[[1]], 4),
      p_value = signif(arch$p.value, 4),
      lags = 5,
      is_homoscedastic = is_homo,
      status = if (is_homo) "HOMOSKEDASTISITAS" else "HETEROSKEDASTISITAS",
      interpretation = if (is_homo) {
        sprintf("P-value (%.4f) > 0.05. Varians residual %s konstan (homoskedastisitas, tidak ada efek ARCH).", arch$p.value, v)
      } else {
        sprintf("P-value (%.4f) <= 0.05. Terdapat efek ARCH (heteroskedastisitas) pada residual %s.", arch$p.value, v)
      }
    )
  }
  
  # 4. Multicollinearity (VIF & Condition Number)
  # Construct lagged regressors matrix
  lagged_data <- NULL
  for (p in 1:optimal_lag) {
    lagged <- stats::lag(tsdata, -p)
    colnames(lagged) <- paste0(var_names, ".l", p)
    lagged_data <- cbind(lagged_data, lagged)
  }
  full_data <- na.omit(cbind(tsdata, lagged_data))
  colnames(full_data) <- c(var_names, paste0(rep(var_names, optimal_lag), ".l", rep(1:optimal_lag, each = 3)))
  df_full <- as.data.frame(full_data)
  
  vif_results <- list()
  for (v in var_names) {
    x_vars <- colnames(df_full)[colnames(df_full) != v]
    form_str <- paste(v, "~", paste(x_vars, collapse = " + "))
    lm_mod <- lm(as.formula(form_str), data = df_full)
    vif_vals <- vif(lm_mod)
    
    vif_dict <- list()
    for (vif_name in names(vif_vals)) {
      vif_dict[[vif_name]] <- round(vif_vals[[vif_name]], 4)
    }
    
    max_vif <- max(vif_vals)
    vif_results[[v]] <- list(
      variable = v,
      values = vif_dict,
      max_vif = round(max_vif, 4),
      has_multicollinearity = max_vif >= 10,
      interpretation = if (max_vif < 10) {
        sprintf("VIF Maksimum = %.4f (< 10). Tidak terdapat multikolinearitas serius pada persamaan %s.", max_vif, v)
      } else {
        sprintf("VIF Maksimum = %.4f (>= 10). Terdapat indikasi multikolinearitas pada persamaan %s.", max_vif, v)
      }
    )
  }
  
  # Condition Number
  X_matrix <- as.matrix(full_data[, -c(1:3)])
  eigen_vals <- eigen(t(X_matrix) %*% X_matrix)$values
  cond_num <- sqrt(max(eigen_vals) / min(eigen_vals))
  
  condition_number_result <- list(
    value = round(cond_num, 4),
    threshold = 30,
    has_serious_multicollinearity = cond_num >= 30,
    status = if (cond_num < 30) "BEBAS MULTIKOLINEARITAS SERIUS" else "TERINDIKASI MULTIKOLINEARITAS",
    interpretation = if (cond_num < 30) {
      sprintf("Condition Number = %.4f (< 30). Matriks regresi tidak mengalami multikolinearitas yang membahayakan estimasi.", cond_num)
    } else {
      sprintf("Condition Number = %.4f (>= 30). Terdapat multikolinearitas antar variabel lag.", cond_num)
    }
  )
  
  # 5. Stability Test (Roots of Characteristic Polynomial)
  stability_results <- list()
  if (!is.null(var_base)) {
    roots_var <- roots(var_base)
    roots_list <- list()
    for (i in 1:length(roots_var)) {
      r <- roots_var[i]
      roots_list[[paste0("root_", i)]] <- list(
        real = round(Re(r), 6),
        imaginary = round(Im(r), 6),
        modulus = round(abs(r), 6)
      )
    }
    max_root <- max(abs(roots_var))
    is_stable <- max_root < 1
    
    stability_results <- list(
      max_modulus = round(max_root, 4),
      is_stable = is_stable,
      status = if (is_stable) "STABIL (Semua Modulus < 1)" else "TIDAK STABIL (Ada Modulus >= 1)",
      roots = roots_list,
      interpretation = if (is_stable) {
        sprintf("Semua akar karakteristik berada di dalam lingkaran satuan (Maximum Modulus = %.4f < 1). Sistem dinamis VAR/VECM stabil.", max_root)
      } else {
        sprintf("Terdapat akar karakteristik di luar lingkaran satuan (Maximum Modulus = %.4f >= 1). Sistem tidak stabil.", max_root)
      }
    )
  }
  
  return(list(
    normality = normality_results,
    autocorrelation = autocorr_results,
    heteroscedasticity = arch_results,
    multicollinearity = list(
      vif = vif_results,
      condition_number = condition_number_result
    ),
    stability = stability_results
  ))
}

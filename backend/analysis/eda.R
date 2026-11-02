# Exploratory Data Analysis (EDA) Module

compute_eda <- function(data) {
  var_names <- c("SMAR", "AALI", "SIMP")
  
  # Descriptive Statistics
  descriptive <- list()
  for (v in var_names) {
    x <- as.numeric(data[[v]])
    n <- length(x)
    m <- mean(x, na.rm = TRUE)
    s <- sd(x, na.rm = TRUE)
    med <- median(x, na.rm = TRUE)
    mn <- min(x, na.rm = TRUE)
    mx <- max(x, na.rm = TRUE)
    q25 <- quantile(x, 0.25, na.rm = TRUE)[[1]]
    q75 <- quantile(x, 0.75, na.rm = TRUE)[[1]]
    
    # Skewness & Kurtosis
    skew <- sum((x - m)^3) / ((n - 1) * s^3)
    kurt <- sum((x - m)^4) / ((n - 1) * s^4) - 3 # Excess kurtosis
    
    descriptive[[v]] <- list(
      variable = v,
      count = n,
      mean = round(m, 2),
      sd = round(s, 2),
      median = round(med, 2),
      min = round(mn, 2),
      max = round(mx, 2),
      q25 = round(q25, 2),
      q75 = round(q75, 2),
      skewness = round(skew, 4),
      kurtosis = round(kurt, 4)
    )
  }
  
  # Correlation Matrix
  mat_data <- as.matrix(data[, var_names])
  cor_mat <- cor(mat_data, use = "complete.obs")
  cor_list <- list()
  for (r_name in var_names) {
    row_vals <- list()
    for (c_name in var_names) {
      row_vals[[c_name]] <- round(cor_mat[r_name, c_name], 4)
    }
    cor_list[[r_name]] <- row_vals
  }
  
  # Bartlett Sphericity Test
  n <- nrow(mat_data)
  p <- ncol(mat_data)
  det_R <- det(cor_mat)
  chi_sq <- -(n - 1 - (2 * p + 5) / 6) * log(det_R)
  df <- p * (p - 1) / 2
  p_val <- 1 - pchisq(chi_sq, df)
  
  bartlett <- list(
    test_name = "Bartlett's Test of Sphericity",
    statistic = round(chi_sq, 4),
    df = df,
    p_value = signif(p_val, 6),
    det_r = round(det_R, 6),
    is_significant = p_val < 0.05,
    conclusion = if (p_val < 0.05) {
      "Variabel saling berkorelasi signifikan (H0 ditolak). Data LAYAK untuk pemodelan multivariat VAR/VECM."
    } else {
      "Variabel tidak berkorelasi signifikan (H0 diterima). Data TIDAK LAYAK untuk pemodelan multivariat."
    }
  )
  
  return(list(
    descriptive = descriptive,
    correlation = cor_list,
    bartlett = bartlett
  ))
}

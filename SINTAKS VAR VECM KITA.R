# ============================================================================
# ANALISIS OTOMATIS VAR/VECM - HARGA IHSG, DJI, DAN TUKAR SAWIT
# Program akan menentukan secara otomatis apakah menggunakan VAR atau VECM
# ============================================================================

# Load libraries
library(readxl)
library(aTSA)
library(vars)
library(urca)
library(tseries)
library(forecast)
library(tsDyn)
library(car)

# ============================================================================
# TAMBAHAN: Fungsi helper untuk concatenate string
# ============================================================================
`%R%` <- function(x, y) {
  paste0(x, y, x)
}

# ============================================================================
# 1. LOAD DATA
# ============================================================================

cat("\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("ANALISIS OTOMATIS VAR/VECM\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

# !!! PENTING: GANTI PATH DI BAWAH INI
# Ganti "C:/Folder/FileAnda.xlsx" dengan lokasi file Excel Anda yang berisi data SMAR, AALI, SIMP
data <- read_excel("C:/Users/Ariza Nabila/OneDrive/Documents/Kuliah/Semester 5/ARW Multivariat/Sawit.xlsx")
View(data)

cat("Dimensi data:", dim(data), "\n")
cat("Variabel:", names(data), "\n\n")

# Mengubah data menjadi time series
tsdata <- ts(data)
# Mengganti nama kolom sesuai data baru
colnames(tsdata) <- c("SMAR", "AALI", "SIMP")

# Statistik deskriptif
cat("STATISTIK DESKRIPTIF:\n")
cat(paste(rep("-", 80), collapse=""), "\n")
print(summary(tsdata))

# ============================================================================
# 2. PLOT DATA
# ============================================================================

cat("\n\nMembuat plot time series...\n")

par(mfrow=c(3,1), mar=c(4,4,2,1))
ts.plot(tsdata[,"SMAR"], main="Harga SMAR", 
        ylab="Harga", xlab="Waktu", col="blue", lwd=2)
grid()
ts.plot(tsdata[,"AALI"], main="Harga AALI", 
        ylab="Harga", xlab="Waktu", col="red", lwd=2)
grid()
ts.plot(tsdata[,"SIMP"], main="Harga SIMP", 
        ylab="Harga", xlab="Waktu", col="darkgreen", lwd=2)
grid()
par(mfrow=c(1,1))

# Plot semua dalam satu grafik
ts.plot(tsdata, col=c("blue","red","darkgreen"), lwd=2,
        main="Harga Saham - SMAR, AALI, SIMP")
legend("topleft", legend=c("SMAR","AALI","SIMP"), 
       col=c("blue","red","darkgreen"), lty=1, lwd=2)
grid()

# ============================================================================
# 3. UJI BARTLETT (Sphericity Test)
# ============================================================================

cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("UJI BARTLETT (SPHERICITY TEST)\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

cor_matrix <- cor(tsdata)
cat("Matriks Korelasi:\n")
print(cor_matrix)

n <- nrow(tsdata)
p <- ncol(tsdata)
det_R <- det(cor_matrix)

chi_sq <- -(n - 1 - (2*p + 5)/6) * log(det_R)
df <- p * (p - 1) / 2
p_value_bartlett <- 1 - pchisq(chi_sq, df)

cat("\n\nHasil Uji Bartlett:\n")
cat(paste(rep("-", 60), collapse=""), "\n")
cat(sprintf("Chi-square statistic: %.4f\n", chi_sq))
cat(sprintf("Degrees of freedom: %d\n", df))
cat(sprintf("P-value: %.6f\n", p_value_bartlett))
cat(sprintf("\nKesimpulan: %s\n", 
            ifelse(p_value_bartlett < 0.05, 
                   "Variabel saling berkorelasi (LAYAK untuk VAR/VECM)",
                   "Variabel tidak berkorelasi signifikan (TIDAK LAYAK)")))

# ============================================================================
# 4. UJI STASIONERITAS - LEVEL
# ============================================================================

cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("TAHAP 1: UJI STASIONERITAS (ADF TEST) - LEVEL\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

# SMAR
cat("1. SMAR:\n")
cat(paste(rep("-", 60), collapse=""), "\n")
adf_SMAR <- adf.test(tsdata[,"SMAR"])
print(adf_SMAR)
cat(sprintf("Kesimpulan: %s\n\n", 
            ifelse(adf_SMAR$p.value < 0.05, "STASIONER", "TIDAK STASIONER")))

# AALI
cat("2. AALI:\n")
cat(paste(rep("-", 60), collapse=""), "\n")
adf_AALI <- adf.test(tsdata[,"AALI"])
print(adf_AALI)
cat(sprintf("Kesimpulan: %s\n\n", 
            ifelse(adf_AALI$p.value < 0.05, "STASIONER", "TIDAK STASIONER")))

# SIMP
cat("3. SIMP:\n")
cat(paste(rep("-", 60), collapse=""), "\n")
adf_SIMP <- adf.test(tsdata[,"SIMP"])
print(adf_SIMP)
cat(sprintf("Kesimpulan: %s\n\n", 
            ifelse(adf_SIMP$p.value < 0.05, "STASIONER", "TIDAK STASIONER")))

# Cek apakah semua stasioner di level
all_stationary_level <- all(c(adf_SMAR$p.value, adf_AALI$p.value, adf_SIMP$p.value) < 0.05)


# ============================================================================
# 5. DIFFERENCING & UJI STASIONERITAS FIRST DIFFERENCE
# ============================================================================

cat("\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("TAHAP 2: UJI STASIONERITAS (ADF TEST) - FIRST DIFFERENCE\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

dif1.SMAR <- diff(tsdata[,"SMAR"])
dif1.AALI <- diff(tsdata[,"AALI"])
dif1.SIMP <- diff(tsdata[,"SIMP"])

cat("1. DIFF(SMAR):\n")
cat(paste(rep("-", 60), collapse=""), "\n")
adf_dif_SMAR <- adf.test(dif1.SMAR)
print(adf_dif_SMAR)
cat(sprintf("Kesimpulan: %s\n\n", 
            ifelse(adf_dif_SMAR$p.value < 0.05, "STASIONER", "TIDAK STASIONER")))

cat("2. DIFF(AALI):\n")
cat(paste(rep("-", 60), collapse=""), "\n")
adf_dif_AALI <- adf.test(dif1.AALI)
print(adf_dif_AALI)
cat(sprintf("Kesimpulan: %s\n\n", 
            ifelse(adf_dif_AALI$p.value < 0.05, "STASIONER", "TIDAK STASIONER")))

cat("3. DIFF(SIMP):\n")
cat(paste(rep("-", 60), collapse=""), "\n")
adf_dif_SIMP <- adf.test(dif1.SIMP)
print(adf_dif_SIMP)
cat(sprintf("Kesimpulan: %s\n\n", 
            ifelse(adf_dif_SIMP$p.value < 0.05, "STASIONER", "TIDAK STASIONER")))

# Cek apakah semua stasioner di first difference
all_stationary_diff1 <- all(c(adf_dif_SMAR$p.value, adf_dif_AALI$p.value, adf_dif_SIMP$p.value) < 0.05)

# Plot differenced data
par(mfrow=c(3,1), mar=c(4,4,2,1))
plot(dif1.SMAR, type="l", main="First Difference - SMAR", 
     col="blue", lwd=2, ylab="Diff(SMAR)")
abline(h=0, col="red", lty=2)
grid()
plot(dif1.AALI, type="l", main="First Difference - AALI", 
     col="red", lwd=2, ylab="Diff(AALI)")
abline(h=0, col="red", lty=2)
grid()
plot(dif1.SIMP, type="l", main="First Difference - SIMP", 
     col="darkgreen", lwd=2, ylab="Diff(SIMP)")
abline(h=0, col="red", lty=2)
grid()
par(mfrow=c(1,1))


# ============================================================================
# 7. PENENTUAN LAG OPTIMAL
# ============================================================================

cat("\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("TAHAP 4: PENENTUAN LAG OPTIMAL\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

lag_select <- VARselect(tsdata, lag.max=5, type="const")
cat("Kriteria Informasi untuk Pemilihan Lag:\n")
cat(paste(rep("-", 60), collapse=""), "\n")
print(lag_select$selection)
cat("\n")
print(lag_select$criteria)

optimal_lag <- lag_select$selection["AIC(n)"]
cat(sprintf("\n\nLag Optimal (berdasarkan AIC): %d\n", optimal_lag))

# ============================================================================
# 8. UJI KOINTEGRASI JOHANSEN (PENENTU VAR vs VECM)
# ============================================================================

cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("TAHAP 5: UJI KOINTEGRASI JOHANSEN (MENENTUKAN VAR/VECM)\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

kointest <- ca.jo(tsdata, K=optimal_lag, type="trace", ecdet="const", spec="longrun")
cat("Trace Test:\n")
cat(paste(rep("-", 60), collapse=""), "\n")
print(summary(kointest))

# Determine cointegration rank
test_stat <- kointest@teststat
crit_val <- kointest@cval[,2]  # 5% critical value
r <- sum(test_stat > crit_val)

cat(sprintf("\n\nJumlah hubungan kointegrasi (r) pada α=5%%: %d\n", r))

# ============================================================================
# 9. KEPUTUSAN OTOMATIS: VAR atau VECM?
# ============================================================================

cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("KEPUTUSAN OTOMATIS: PEMILIHAN MODEL\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

cat("Kriteria Pemilihan Model:\n")
cat(paste(rep("-", 60), collapse=""), "\n")
cat(sprintf("1. Stasioner di Level: %s\n", ifelse(all_stationary_level, "YA", "TIDAK")))
cat(sprintf("2. Stasioner di First Difference: %s\n", ifelse(all_stationary_diff1, "YA", "TIDAK")))
cat(sprintf("3. Terdapat Kointegrasi (r > 0): %s\n", ifelse(r > 0, "YA", "TIDAK")))
cat("\n")

# Logika pemilihan model
USE_VAR <- FALSE
USE_VECM <- FALSE
USE_VAR_DIFF <- FALSE

if(all_stationary_level) {
  # Jika stasioner di level, gunakan VAR
  USE_VAR <- TRUE
  model_choice <- "VAR (Level)"
  cat("KEPUTUSAN: Gunakan MODEL VAR (Data Stasioner di Level)\n")
  cat("Penjelasan: Semua variabel stasioner pada level, sehingga VAR dalam level dapat digunakan.\n")
} else if(all_stationary_diff1 && r > 0) {
  # Jika tidak stasioner di level tapi stasioner di diff dan ada kointegrasi
  USE_VECM <- TRUE
  model_choice <- "VECM"
  cat("KEPUTUSAN: Gunakan MODEL VECM (Ada Kointegrasi)\n")
  cat(sprintf("Penjelasan: Data I(1) dan terdapat %d hubungan kointegrasi.\n", r))
  cat("VECM dapat menangkap hubungan jangka panjang antar variabel.\n")
} else if(all_stationary_diff1 && r == 0) {
  # Jika tidak stasioner di level, stasioner di diff, tapi tidak ada kointegrasi
  USE_VAR_DIFF <- TRUE
  model_choice <- "VAR (First Difference)"
  cat("KEPUTUSAN: Gunakan MODEL VAR pada FIRST DIFFERENCE\n")
  cat("Penjelasan: Data I(1) tetapi TIDAK ada kointegrasi, gunakan VAR dalam bentuk differenced.\n")
} else {
  cat("PERINGATAN: Kondisi data tidak memenuhi asumsi standar VAR/VECM!\n")
  cat("Akan menggunakan VAR sebagai default.\n")
  USE_VAR <- TRUE
  model_choice <- "VAR (Default)"
}

cat("\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

# ============================================================================
# 10. ESTIMASI MODEL SESUAI KEPUTUSAN
# ============================================================================

cat("\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("ESTIMASI MODEL: ", model_choice, "\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

# GANTI NAMA VARIABEL
var_names <- c("SMAR", "AALI", "SIMP")

if(USE_VECM) {
  # ========== ESTIMASI VECM ==========
  cat("Estimasi Model VECM...\n\n")
  
  # Convert to VECM
  vecm_model <- cajorls(kointest, r=r)
  
  cat("Koefisien Error Correction (EC):\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  print(vecm_model$rlm$coefficients)
  
  cat("\n\nPersamaan VECM:\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  print(summary(vecm_model$rlm))
  
  # Simpan model
  model_final <- vecm_model
  model_type <- "VECM"
  
  # Extract residuals untuk VECM
  resids <- residuals(vecm_model$rlm)
  
} else if(USE_VAR_DIFF) {
  # ========== ESTIMASI VAR PADA FIRST DIFFERENCE ==========
  cat("Estimasi Model VAR pada First Difference...\n\n")
  
  # Buat time series dari differenced data
  tsdata_diff <- ts(cbind(dif1.SMAR, dif1.AALI, dif1.SIMP))
  colnames(tsdata_diff) <- c("SMAR", "AALI", "SIMP")
  
  var_model <- VAR(tsdata_diff, p=optimal_lag, type="const")
  print(summary(var_model))
  
  model_final <- var_model
  model_type <- "VAR_DIFF"
  resids <- residuals(var_model)
  
} else {
  # ========== ESTIMASI VAR (LEVEL) ==========
  cat("Estimasi Model VAR (Level)...\n\n")
  
  var_model <- VAR(tsdata, p=optimal_lag, type="const")
  print(summary(var_model))
  
  # Extract coefficients
  coeffs <- coef(var_model)
  
  # Display model equations
  cat("\n\n")
  cat(paste(rep("=", 80), collapse=""), "\n")
  cat("MODEL MATEMATIKA VAR YANG TERBENTUK\n")
  cat(paste(rep("=", 80), collapse=""), "\n\n")
  
  for(i in 1:3) {
    cat(sprintf("%s(t) = ", var_names[i]))
    
    coef_eq <- coeffs[[i]]
    
    # Constant
    cat(sprintf("%.6f", coef_eq["const",1]))
    
    # Lagged terms
    for(p in 1:optimal_lag) {
      for(j in 1:3) {
        var_lag <- sprintf("%s.l%d", var_names[j], p)
        if(var_lag %in% rownames(coef_eq)) {
          val <- coef_eq[var_lag, 1]
          if(val >= 0) {
            cat(sprintf(" + %.6f*%s(t-%d)", val, var_names[j], p))
          } else {
            cat(sprintf(" - %.6f*%s(t-%d)", abs(val), var_names[j], p))
          }
        }
      }
    }
    cat("\n\n")
  }
  
  model_final <- var_model
  model_type <- "VAR"
  resids <- residuals(var_model)
}

# ============================================================================
# 11. UJI MULTIKOLINEARITAS
# ============================================================================

if(model_type == "VAR" || model_type == "VAR_DIFF") {
  cat("\n\n")
  cat(paste(rep("=", 80), collapse=""), "\n")
  cat("UJI MULTIKOLINEARITAS\n")
  cat(paste(rep("=", 80), collapse=""), "\n\n")
  
  # Pilih data yang sesuai
  data_for_vif <- if(model_type == "VAR_DIFF") tsdata_diff else tsdata
  
  # Membuat lagged variables
  lagged_data <- NULL
  for(p in 1:optimal_lag) {
    lagged <- lag(data_for_vif, -p)
    colnames(lagged) <- paste0(colnames(data_for_vif), ".l", p)
    lagged_data <- cbind(lagged_data, lagged)
  }
  
  full_data <- na.omit(cbind(data_for_vif, lagged_data))
  
  cat("Variance Inflation Factor (VIF):\n")
  cat(paste(rep("-", 60), collapse=""), "\n\n")
  
  for(i in 1:3) {
    cat(sprintf("Persamaan %s:\n", var_names[i]))
    
    y_var <- var_names[i]
    x_vars <- colnames(full_data)[colnames(full_data) != y_var]
    formula_str <- paste(y_var, "~", paste(x_vars, collapse=" + "))
    
    lm_model <- lm(as.formula(formula_str), data=as.data.frame(full_data))
    vif_vals <- vif(lm_model)
    
    print(vif_vals)
    
    max_vif <- max(vif_vals)
    cat(sprintf("\nVIF Maksimum: %.4f\n", max_vif))
    cat(sprintf("Kesimpulan: %s\n\n", 
                ifelse(max_vif < 10, 
                       "Tidak ada multikolinearitas serius",
                       "Terdapat multikolinearitas")))
  }
  
  # Condition Number
  cat("\nCondition Number:\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  X_matrix <- as.matrix(full_data[, -c(1:3)])
  eigen_vals <- eigen(t(X_matrix) %*% X_matrix)$values
  condition_number <- sqrt(max(eigen_vals) / min(eigen_vals))
  cat(sprintf("Condition Number: %.4f\n", condition_number))
  cat(sprintf("Kesimpulan: %s\n", 
              ifelse(condition_number < 30, 
                     "Tidak ada multikolinearitas serius",
                     "Terdapat multikolinearitas")))
}

# ============================================================================
# 12. UJI STABILITAS
# ============================================================================

if(model_type == "VAR" || model_type == "VAR_DIFF") {
  cat("\n\n")
  cat(paste(rep("=", 80), collapse=""), "\n")
  cat("UJI STABILITAS MODEL\n")
  cat(paste(rep("=", 80), collapse=""), "\n\n")
  
  roots_var <- roots(model_final)
  cat("Roots of Characteristic Polynomial:\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  print(roots_var)
  
  max_root <- max(abs(roots_var))
  cat(sprintf("\nMaximum modulus: %.4f\n", max_root))
  cat(sprintf("Model adalah %s (semua roots < 1)\n", 
              ifelse(max_root < 1, "STABIL", "TIDAK STABIL")))
  
  plot(roots_var, main="Inverse Roots of AR Characteristic Polynomial",
       xlim=c(-1.2,1.2), ylim=c(-1.2,1.2))
  symbols(0, 0, circles=1, inches=FALSE, add=TRUE, fg="red", lwd=2)
  grid()
}

# ============================================================================
# 13. DIAGNOSTIK RESIDUAL
# ============================================================================

cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("DIAGNOSTIK RESIDUAL\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

if(model_type == "VAR" || model_type == "VAR_DIFF") {
  # Serial correlation test
  serial_test <- serial.test(model_final, lags.pt=10, type="PT.asymptotic")
  cat("Portmanteau Test (Serial Correlation):\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  print(serial_test)
  cat(sprintf("\nKesimpulan: %s\n", 
              ifelse(serial_test$serial$p.value > 0.05, 
                     "Tidak ada serial korelasi", 
                     "Terdapat serial korelasi")))
  
  # Heteroscedasticity test
  arch_test <- arch.test(model_final, lags.multi=5)
  cat("\n\nARCH Test (Heteroscedasticity):\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  print(arch_test)
  cat(sprintf("\nKesimpulan: %s\n", 
              ifelse(arch_test$arch.mul$p.value > 0.05, 
                     "Tidak ada heteroskedastisitas", 
                     "Terdapat heteroskedastisitas")))
  
  # Normality test
  norm_test <- normality.test(model_final, multivariate.only=TRUE)
  cat("\n\nNormality Test (Jarque-Bera):\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  print(norm_test)
  cat(sprintf("\nKesimpulan: %s\n", 
              ifelse(norm_test$jb.mul$JB$p.value > 0.05, 
                     "Residual berdistribusi normal", 
                     "Residual tidak berdistribusi normal")))
}

# Plot residuals
par(mfrow=c(3,2))
for(i in 1:3) {
  plot(resids[,i], type="l", main=paste("Residual -", var_names[i]),
       ylab="Residual", col="blue", lwd=1.5)
  abline(h=0, col="red", lty=2)
  grid()
  
  acf(resids[,i], main=paste("ACF -", var_names[i]))
}
par(mfrow=c(1,1))

# ============================================================================
# 14. UJI KAUSALITAS GRANGER
# ============================================================================

if(model_type == "VAR" || model_type == "VAR_DIFF") {
  cat("\n\n")
  cat(paste(rep("=", 80), collapse=""), "\n")
  cat("UJI KAUSALITAS GRANGER\n")
  cat(paste(rep("=", 80), collapse=""), "\n\n")
  
  granger_results <- causality(model_final, cause="SMAR")
  cat("1. SMAR → AALI & SIMP:\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  print(granger_results$Granger)
  
  granger_results <- causality(model_final, cause="AALI")
  cat("\n2. AALI → SMAR & SIMP:\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  print(granger_results$Granger)
  
  granger_results <- causality(model_final, cause="SIMP")
  cat("\n3. SIMP → SMAR & AALI:\n")
  cat(paste(rep("-", 60), collapse=""), "\n")
  print(granger_results$Granger)
}

# ============================================================================
# 15. IMPULSE RESPONSE FUNCTION (IRF)
# ============================================================================

if(model_type == "VAR" || model_type == "VAR_DIFF") {
  cat("\n\n")
  cat(paste(rep("=", 80), collapse=""), "\n")
  cat("IMPULSE RESPONSE FUNCTION (IRF)\n")
  cat(paste(rep("=", 80), collapse=""), "\n\n")
  
  ir <- irf(model_final, n.ahead=10, boot=TRUE, runs=100)
  cat("IRF dihitung untuk 10 periode ke depan\n")
  cat("Menggunakan bootstrap dengan 100 runs\n\n")
  
  plot(ir, main="Impulse Response Functions")
}

# ============================================================================
# 16. VARIANCE DECOMPOSITION (FEVD)
# ============================================================================

if(model_type == "VAR" || model_type == "VAR_DIFF") {
  cat("\n\n")
  cat(paste(rep("=", 80), collapse=""), "\n")
  cat("FORECAST ERROR VARIANCE DECOMPOSITION (FEVD)\n")
  cat(paste(rep("=", 80), collapse=""), "\n\n")
  
  vd <- fevd(model_final, n.ahead=10)
  cat("FEVD untuk 10 periode ke depan:\n\n")
  print(vd)
  
  plot(vd, main="Forecast Error Variance Decomposition")
}

# ============================================================================
# 17. FORECASTING
# ============================================================================

if(model_type == "VAR" || model_type == "VAR_DIFF") {
  cat("\n\n")
  cat(paste(rep("=", 80), collapse=""), "\n")
  cat("FORECASTING\n")
  cat(paste(rep("=", 80), collapse=""), "\n\n")
  
  forecast_result <- predict(model_final, n.ahead=10)
  cat("Forecast 10 periode ke depan:\n\n")
  print(forecast_result)
  
  plot(forecast_result, main=paste(model_choice, "Forecast"))
}

# ============================================================================
# 18. GOODNESS OF FIT
# ============================================================================

cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("GOODNESS OF FIT\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

if(model_type == "VAR" || model_type == "VAR_DIFF") {
  fitted_vals <- fitted(model_final)
  
  # Pilih data aktual yang sesuai
  if(model_type == "VAR_DIFF") {
    actual_vals <- tsdata_diff[(optimal_lag+1):nrow(tsdata_diff),]
  } else {
    actual_vals <- tsdata[(optimal_lag+1):nrow(tsdata),]
  }
  
  for(i in 1:3) {
    # R-squared
    ss_res <- sum(resids[,i]^2)
    ss_tot <- sum((actual_vals[,i] - mean(actual_vals[,i]))^2)
    r2 <- 1 - (ss_res/ss_tot)
    
    # Adjusted R-squared
    n <- nrow(resids)
    k <- optimal_lag * 3 + 1
    adj_r2 <- 1 - ((1-r2)*(n-1)/(n-k-1))
    
    # RMSE
    rmse <- sqrt(mean(resids[,i]^2))
    
    # MAE
    mae <- mean(abs(resids[,i]))
    
    # MAPE
    mape <- mean(abs(resids[,i]/actual_vals[,i])) * 100
    
    cat(sprintf("Persamaan %s:\n", var_names[i]))
    cat(sprintf("  R² = %.4f\n", r2))
    cat(sprintf("  Adjusted R² = %.4f\n", adj_r2))
    cat(sprintf("  RMSE = %.4f\n", rmse))
    cat(sprintf("  MAE = %.4f\n", mae))
    cat(sprintf("  MAPE = %.2f%%\n\n", mape))
  }
} else if(model_type == "VECM") {
  cat("Goodness of fit untuk model VECM:\n")
  cat("R-squared untuk setiap persamaan:\n\n")
  print(summary(model_final$rlm)$r.squared)
}


# ============================================================================
# 20. RINGKASAN ANALISIS LENGKAP
# ============================================================================

cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("RINGKASAN HASIL ANALISIS\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

cat("=" %R% " INFORMASI DATA " %R% "=\n")
cat(sprintf("Jumlah observasi: %d\n", nrow(tsdata)))
cat(sprintf("Variabel: %s\n\n", paste(var_names, collapse=", ")))

cat("=" %R% " UJI BARTLETT " %R% "=\n")
cat(sprintf("Chi-square: %.4f, P-value: %.6f\n", chi_sq, p_value_bartlett))
cat(sprintf("Kesimpulan: %s\n\n", 
            ifelse(p_value_bartlett < 0.05, 
                   "Variabel berkorelasi signifikan",
                   "Variabel tidak berkorelasi")))

cat("=" %R% " STASIONERITAS " %R% "=\n")
cat(sprintf("Level: %s\n", 
            ifelse(all_stationary_level, "Semua STASIONER", "Tidak semua stasioner")))
cat(sprintf("First Difference: %s\n", 
            ifelse(all_stationary_diff1, "Semua STASIONER", "Tidak semua stasioner")))
if(exists("all_stationary_diff2")) {
  cat(sprintf("Second Difference: %s\n", 
              ifelse(all_stationary_diff2, "Semua STASIONER", "Tidak semua stasioner")))
}
cat("\n")

cat("=" %R% " UJI KOINTEGRASI " %R% "=\n")
cat(sprintf("Metode: Johansen Trace Test\n"))
cat(sprintf("Jumlah hubungan kointegrasi: %d\n", r))
cat(sprintf("Interpretasi: %s\n\n", 
            ifelse(r > 0, 
                   "Ada hubungan jangka panjang antar variabel",
                   "Tidak ada hubungan jangka panjang")))

cat("=" %R% " PEMILIHAN MODEL " %R% "=\n")
cat(sprintf("MODEL TERPILIH: %s\n", model_choice))
cat(sprintf("Lag Optimal: %d\n", optimal_lag))
cat("Alasan pemilihan:\n")
if(USE_VECM) {
  cat("  - Data I(1) (stasioner setelah differencing pertama)\n")
  cat(sprintf("  - Terdapat %d hubungan kointegrasi\n", r))
  cat("  - VECM dapat menangkap dinamika jangka pendek dan jangka panjang\n")
} else if(USE_VAR_DIFF) {
  cat("  - Data I(1) (stasioner setelah differencing pertama)\n")
  cat("  - TIDAK ada hubungan kointegrasi\n")
  cat("  - VAR diterapkan pada data first difference\n")
} else if(USE_VAR) {
  cat("  - Data stasioner pada level\n")
  cat("  - VAR dapat langsung diterapkan pada data level\n")
}
cat("\n")

if(model_type == "VAR" || model_type == "VAR_DIFF") {
  cat("=" %R% " MULTIKOLINEARITAS " %R% "=\n")
  if(exists("condition_number")) {
    cat(sprintf("Condition Number: %.4f\n", condition_number))
    cat(sprintf("Kesimpulan: %s\n\n", 
                ifelse(condition_number < 30, 
                       "Tidak ada masalah multikolinearitas",
                       "Terdapat indikasi multikolinearitas")))
  }
  
  cat("=" %R% " STABILITAS MODEL " %R% "=\n")
  if(exists("max_root")) {
    cat(sprintf("Maximum modulus: %.4f\n", max_root))
    cat(sprintf("Status: Model %s\n\n", 
                ifelse(max_root < 1, "STABIL", "TIDAK STABIL")))
  }
  
  cat("=" %R% " DIAGNOSTIK RESIDUAL " %R% "=\n")
  if(exists("serial_test")) {
    cat(sprintf("Serial Correlation (p-value): %.4f - %s\n", 
                serial_test$serial$p.value,
                ifelse(serial_test$serial$p.value > 0.05, "OK", "Ada masalah")))
  }
  if(exists("arch_test")) {
    cat(sprintf("Heteroscedasticity (p-value): %.4f - %s\n", 
                arch_test$arch.mul$p.value,
                ifelse(arch_test$arch.mul$p.value > 0.05, "OK", "Ada masalah")))
  }
  if(exists("norm_test")) {
    cat(sprintf("Normality (p-value): %.4f - %s\n\n", 
                norm_test$jb.mul$JB$p.value,
                ifelse(norm_test$jb.mul$JB$p.value > 0.05, "OK", "Ada masalah")))
  }
}

cat("=" %R% " OUTPUT YANG DIHASILKAN " %R% "=\n")
cat("1. Uji Bartlett (Sphericity Test)\n")
cat("2. Uji Stasioneritas (Level, First Diff, Second Diff)\n")
cat("3. Uji Kointegrasi Johansen\n")
cat("4. Pemilihan Model Otomatis (VAR/VECM)\n")
if(model_type != "VECM") {
  cat("5. Uji Multikolinearitas (VIF & Condition Number)\n")
  cat("6. Uji Stabilitas Model\n")
  cat("7. Diagnostik Residual\n")
  cat("8. Uji Kausalitas Granger\n")
  cat("9. Impulse Response Functions (IRF)\n")
  cat("10. Variance Decomposition (FEVD)\n")
  cat("11. Forecasting 10 periode\n")
  cat("12. Goodness of Fit Statistics\n")
} else {
  cat("5. Estimasi Koefisien VECM\n")
  cat("6. Error Correction Terms\n")
  cat("7. Goodness of Fit\n")
}
cat("13. File tersimpan (RData & CSV)\n\n")

cat("=" %R% " INTERPRETASI & REKOMENDASI " %R% "=\n")
if(USE_VECM) {
  cat("Model VECM menunjukkan adanya hubungan jangka panjang antar harga komoditas.\n")
  cat("Error Correction Term (ECT) menunjukkan kecepatan penyesuaian menuju ekuilibrium.\n")
  cat("Gunakan koefisien jangka pendek untuk analisis dinamika sementara.\n")
} else if(USE_VAR_DIFF) {
  cat("Model VAR pada first difference menangkap perubahan harga komoditas.\n")
  cat("Tidak ada hubungan jangka panjang, fokus pada dinamika jangka pendek.\n")
  cat("Interpretasi: perubahan harga dipengaruhi oleh perubahan harga periode sebelumnya.\n")
} else {
  cat("Model VAR pada level menunjukkan hubungan langsung antar harga komoditas.\n")
  cat("Data stasioner memungkinkan interpretasi langsung dari koefisien.\n")
  cat("Gunakan IRF untuk melihat dampak shock dan FEVD untuk kontribusi variabel.\n")
}

cat("\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("ANALISIS SELESAI!\n")
cat(sprintf("Model yang digunakan: %s\n", model_choice))
cat(paste(rep("=", 80), collapse=""), "\n\n")



# ============================================================================
# SKRIP TAMBAHAN: ANALISIS LANJUTAN UNTUK MODEL VECM
# (Jalankan SETELAH skrip utama Anda)
# ============================================================================

# Load library yang mungkin diperlukan
library(tseries)
library(vars)
library(urca)
# install.packages("FinTS") # Jalankan ini jika Anda belum punya package FinTS
library(FinTS)

# --- Pastikan objek ini ada dari skrip utama Anda ---
# Jika Anda tidak yakin, jalankan 3 baris ini untuk memeriksa
# print(kointest)
# print(r)
# print(head(resids))
# ----------------------------------------------------


cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("BAGIAN 1: UJI DIAGNOSTIK RESIDUAL (dari VECM Asli)\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

# ============================================================================
# 1.1 UJI NORMALITAS (JARQUE-BERA)
# ============================================================================
# Kita uji residual dari VECM satu per satu

cat("--- 1.1 Uji Normalitas (Jarque-Bera) ---\n")
cat("H0: Residual berdistribusi normal\n")
cat("Kesimpulan: Jika p-value > 0.05, H0 diterima (Normal)\n\n")

cat("Uji Normalitas untuk Residual", var_names[1], ":\n")
print(jarque.bera.test(resids[,1]))

cat("\nUji Normalitas untuk Residual", var_names[2], ":\n")
print(jarque.bera.test(resids[,2]))

cat("\nUji Normalitas untuk Residual", var_names[3], ":\n")
print(jarque.bera.test(resids[,3]))


# ============================================================================
# 1.2 UJI AUTOKORELASI (LJUNG-BOX)
# ============================================================================
# Kita uji apakah ada sisa autokorelasi di residual

cat("\n\n--- 1.2 Uji Autokorelasi (Ljung-Box) ---\n")
cat("H0: Tidak ada autokorelasi serial\n")
cat("Kesimpulan: Jika p-value > 0.05, H0 diterima (Bagus, tidak ada autokorelasi)\n\n")

# Tentukan lag untuk diuji (contoh: 12)
lag_test <- 12 

cat("Uji Autokorelasi untuk Residual", var_names[1], ":\n")
print(Box.test(resids[,1], lag=lag_test, type="Ljung-Box"))

cat("\nUji Autokorelasi untuk Residual", var_names[2], ":\n")
print(Box.test(resids[,2], lag=lag_test, type="Ljung-Box"))

cat("\nUji Autokorelasi untuk Residual", var_names[3], ":\n")
print(Box.test(resids[,3], lag=lag_test, type="Ljung-Box"))


# ============================================================================
# 1.3 UJI HETEROSKEDASTISITAS (ARCH-LM)
# ============================================================================
# Kita uji apakah varians dari residual konstan

cat("\n\n--- 1.3 Uji Heteroskedastisitas (ARCH-LM) ---\n")
cat("H0: Tidak ada efek ARCH (Homoskedastisitas)\n")
cat("Kesimpulan: Jika p-value > 0.05, H0 diterima (Bagus, tidak ada heteroskedastisitas)\n\n")

cat("Uji ARCH-LM untuk Residual", var_names[1], ":\n")
print(ArchTest(resids[,1], lags=5)) # lags=5 bisa disesuaikan

cat("\nUji ARCH-LM untuk Residual", var_names[2], ":\n")
print(ArchTest(resids[,2], lags=5))

cat("\nUji ARCH-LM untuk Residual", var_names[3], ":\n")
print(ArchTest(resids[,3], lags=5))


# ============================================================================
# KONVERSI VECM KE VAR (UNTUK IRF, FEVD, FORECAST)
# ============================================================================
# Fungsi IRF, FEVD, dan predict dari package 'vars' bekerja pada model 'VAR'.
# Kita bisa mengkonversi model VECM kita ke representasi VAR-nya.

cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("BAGIAN 2: KONVERSI VECM KE VAR (vec2var)\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")

cat("Mengkonversi objek Johansen (ca.jo) ke objek VAR (varest)...\n")
# Kita gunakan objek 'kointest' dan 'r' dari skrip utama
var_model_converted <- vec2var(kointest, r = r)

cat("Konversi Selesai. Model VAR (representasi dari VECM) telah dibuat.\n")
cat("Objek ini sekarang dapat digunakan untuk IRF, FEVD, dan Forecasting.\n\n")


# ============================================================================
# BAGIAN 3: ANALISIS POST-ESTIMASI (IRF, FEVD, FORECAST)
# ============================================================================
# Sekarang kita bisa menjalankan kode yang sama seperti di skrip utama,
# tetapi menggunakan 'var_model_converted'

cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("BAGIAN 3: ANALISIS POST-ESTIMASI (IRF, FEVD, FORECAST)\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")




# ============================================================================
# 3.2 IMPULSE RESPONSE FUNCTION (IRF)
# ============================================================================

cat("\n\n--- 3.2 Impulse Response Function (IRF) ---\n")
cat("Menghitung IRF untuk 12 periode ke depan...\n\n")

# 'n.ahead=10' berarti 10 periode ke depan
ir_vecm <- irf(var_model_converted, n.ahead = 12, boot = TRUE, runs = 100)

# Membuat plot IRF
plot(ir_vecm, main = "Impulse Response Functions (dari VECM)")


# ============================================================================
# 3.3 VARIANCE DECOMPOSITION (FEVD)
# ============================================================================

cat("\n\n--- 3.3 Forecast Error Variance Decomposition (FEVD) ---\n")
cat("Menghitung FEVD untuk 12 periode ke depan...\n\n")

vd_vecm <- fevd(var_model_converted, n.ahead = 12)

# Menampilkan hasil di console
print(vd_vecm)

# Membuat plot FEVD
plot(vd_vecm, main = "Variance Decomposition (dari VECM)")


# ============================================================================
# 3.4 FORECASTING
# ============================================================================

cat("\n\n--- 3.4 Forecasting ---\n")
cat("Menghitung forecast 12 periode ke depan...\n\n")

# 'n.ahead=10' berarti 10 periode ke depan
forecast_vecm <- predict(var_model_converted, n.ahead = 12)

# Menampilkan hasil forecast di console
print(forecast_vecm)

# Membuat plot forecast
plot(forecast_vecm, main = "Forecast 12 Periode (dari VECM)")


cat("\n\n")
cat(paste(rep("=", 80), collapse=""), "\n")
cat("ANALISIS KHUSUS VECM SELESAI!\n")
cat(paste(rep("=", 80), collapse=""), "\n\n")
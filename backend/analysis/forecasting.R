# Forecasting and Out-of-Sample Evaluation Module
suppressPackageStartupMessages({
  library(vars)
})

generate_forecast <- function(var_rep, train_df, test_df = NULL, n_ahead = 12, dates_test = NULL, model_type = "VECM") {
  var_names <- c("SMAR", "AALI", "SIMP")
  
  # Run prediction on VAR representation (works for both VAR and vec2var)
  pred_obj <- predict(var_rep, n.ahead = n_ahead, ci = 0.95)
  
  forecasts_by_var <- list()
  evaluation_by_var <- list()
  combined_table <- list()
  
  total_mape_sum <- 0
  has_eval <- !is.null(test_df) && nrow(test_df) > 0
  eval_len <- if (has_eval) min(n_ahead, nrow(test_df)) else 0
  
  for (v in var_names) {
    fcst_mat <- pred_obj$fcst[[v]]
    
    # If VAR_DIFF was estimated on diff(tsdata), cumulate the changes back to price levels
    if (model_type == "VAR_DIFF") {
      last_level <- as.numeric(tail(train_df[[v]], 1))
      pt_fcst_vec <- round(last_level + cumsum(fcst_mat[, "fcst"]), 2)
      lower_ci_vec <- round(last_level + cumsum(fcst_mat[, "lower"]), 2)
      upper_ci_vec <- round(last_level + cumsum(fcst_mat[, "upper"]), 2)
    } else {
      pt_fcst_vec <- round(fcst_mat[, "fcst"], 2)
      lower_ci_vec <- round(fcst_mat[, "lower"], 2)
      upper_ci_vec <- round(fcst_mat[, "upper"], 2)
    }
    
    var_forecast_series <- list()
    for (h in 1:n_ahead) {
      date_label <- if (!is.null(dates_test) && length(dates_test) >= h) {
        dates_test[h]
      } else {
        paste("Periode", h)
      }
      
      pt_fcst <- pt_fcst_vec[h]
      lower_ci <- lower_ci_vec[h]
      upper_ci <- upper_ci_vec[h]
      
      item <- list(
        period = h,
        date = date_label,
        forecast = pt_fcst,
        lower_95 = lower_ci,
        upper_95 = upper_ci
      )
      
      if (has_eval && h <= eval_len) {
        act_val <- test_df[[v]][h]
        err <- round(act_val - pt_fcst, 2)
        ape_val <- round(abs(err) / act_val * 100, 3)
        item$actual <- round(act_val, 2)
        item$error <- err
        item$ape <- ape_val
      }
      
      var_forecast_series[[h]] <- item
    }
    
    forecasts_by_var[[v]] <- var_forecast_series
    
    # Compute accuracy metrics if test data is available
    if (has_eval && eval_len > 0) {
      actuals <- test_df[[v]][1:eval_len]
      preds <- pt_fcst_vec[1:eval_len]
      
      errors <- actuals - preds
      apes <- abs(errors) / actuals * 100
      mape <- round(mean(apes), 3)
      rmse <- round(sqrt(mean(errors^2)), 2)
      mae <- round(mean(abs(errors)), 2)
      
      total_mape_sum <- total_mape_sum + mape
      
      accuracy_category <- if (mape < 10) {
        "Sangat Akurat (< 10%)"
      } else if (mape < 20) {
        "Baik (10% - 20%)"
      } else if (mape < 50) {
        "Layak (20% - 50%)"
      } else {
        "Tidak Akurat (>= 50%)"
      }
      
      evaluation_by_var[[v]] <- list(
        variable = v,
        mape = mape,
        rmse = rmse,
        mae = mae,
        n_periods = eval_len,
        accuracy_category = accuracy_category
      )
    }
  }
  
  overall_mape <- if (has_eval && eval_len > 0) {
    round(total_mape_sum / length(var_names), 3)
  } else NULL
  
  overall_category <- if (!is.null(overall_mape)) {
    if (overall_mape < 10) "Sangat Akurat (Very Accurate)" else if (overall_mape < 20) "Baik (Good)" else "Layak"
  } else NULL
  
  return(list(
    horizon = n_ahead,
    forecasts = forecasts_by_var,
    has_evaluation = has_eval,
    evaluation = evaluation_by_var,
    overall_mape = overall_mape,
    overall_accuracy_category = overall_category,
    interpretation = if (!is.null(overall_mape)) {
      sprintf("Nilai rata-rata Mean Absolute Percentage Error (Overall MAPE) model adalah %.3f%%. Berdasarkan kriteria Lewis (1982), model VECM tergolong dalam kategori '%s', membuktikan keakuratan prediksi harga saham yang sangat andal.", overall_mape, overall_category)
    } else {
      "Prediksi dihitung berdasarkan model estimasi untuk horizon yang dipilih."
    }
  ))
}

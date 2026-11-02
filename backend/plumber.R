# Palm Oil Stock Analytics - Plumber REST API
suppressPackageStartupMessages({
  library(plumber)
  library(jsonlite)
  library(readxl)
})

# Source the econometric pipeline
backend_dir <- if (dir.exists("backend")) "backend" else if (file.exists("pipeline.R")) "." else "d:/PORTOFOLIO/backend"
source(file.path(backend_dir, "pipeline.R"))

#* @filter cors
cors <- function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
  
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  } else {
    plumber::forward()
  }
}

#* Health check endpoint
#* @get /api/health
#* @serializer unboxedJSON
function() {
  list(
    status = "ok",
    service = "Palm Oil Stock Analytics R Backend (Plumber)",
    version = "1.0.0",
    r_version = R.version.string,
    timestamp = as.character(Sys.time())
  )
}

#* Get default dataset records
#* @get /api/dataset/default
#* @serializer unboxedJSON
function() {
  df <- read.csv(file.path(backend_dir, "data", "Sawit_Clean.csv"), stringsAsFactors = FALSE)
  records <- list()
  for (i in 1:nrow(df)) {
    records[[i]] <- list(
      date = df$Date[i],
      SMAR = df$SMAR[i],
      AALI = df$AALI[i],
      SIMP = df$SIMP[i]
    )
  }
  list(
    status = "success",
    count = nrow(df),
    data = records
  )
}

#* Get default analysis result
#* @get /api/default-analysis
#* @serializer unboxedJSON
function() {
  cache_file <- file.path(backend_dir, "data", "default_analysis.json")
  if (file.exists(cache_file)) {
    json_data <- fromJSON(cache_file, simplifyVector = FALSE)
    return(list(
      status = "success",
      source = "cache",
      result = json_data
    ))
  }
  
  # Otherwise compute on the fly
  df <- read.csv(file.path(backend_dir, "data", "Sawit_Clean.csv"), stringsAsFactors = FALSE)
  analysis_result <- run_full_analysis(df, train_rows = 132, forecast_horizon = 12)
  return(list(
    status = "success",
    source = "computed",
    result = analysis_result
  ))
}

#* Upload and validate dataset
#* @post /api/upload
#* @parser multi
#* @parser json
#* @parser octet
#* @parser text
#* @serializer unboxedJSON
function(req, res) {
  tryCatch({
    df <- NULL
    
    # Check if JSON payload with records
    if (!is.null(req$body$records)) {
      df <- as.data.frame(req$body$records)
    } else if (!is.null(req$body$file)) {
      # File upload handling
      uploaded <- req$body$file
      temp_path <- tempfile(fileext = ".tmp")
      writeBin(uploaded$value, temp_path)
      
      filename <- uploaded$filename
      if (grepl("\\.xlsx?$", filename, ignore.case = TRUE)) {
        df <- as.data.frame(read_excel(temp_path))
      } else {
        df <- read.csv(temp_path, stringsAsFactors = FALSE)
      }
      unlink(temp_path)
    } else {
      res$status <- 400
      return(list(status = "error", message = "Tidak ada file atau data yang dikirim."))
    }
    
    # Case-insensitive column renaming for SMAR, AALI, SIMP
    for (col in names(df)) {
      col_clean <- toupper(trimws(col))
      if (col_clean == "SMAR") names(df)[names(df) == col] <- "SMAR"
      if (col_clean == "AALI") names(df)[names(df) == col] <- "AALI"
      if (col_clean == "SIMP") names(df)[names(df) == col] <- "SIMP"
    }
    
    var_names <- c("SMAR", "AALI", "SIMP")
    missing_cols <- setdiff(var_names, names(df))
    
    # Check column existence
    if (length(missing_cols) > 0) {
      res$status <- 400
      return(list(
        status = "error",
        message = sprintf("Kolom yang diperlukan tidak lengkap. Kolom wajib: SMAR, AALI, SIMP. Kurang: %s", paste(missing_cols, collapse = ", "))
      ))
    }
    
    # Check numeric types
    for (v in var_names) {
      df[[v]] <- suppressWarnings(as.numeric(df[[v]]))
    }
    
    # Filter complete cases ONLY on target variables (not on possible empty auxiliary columns in Excel)
    complete_idx <- complete.cases(df[, var_names])
    n_total <- nrow(df)
    n_na <- sum(!complete_idx)
    valid_df <- df[complete_idx, ]
    n_clean <- nrow(valid_df)
    
    if (n_clean < 30) {
      res$status <- 400
      return(list(
        status = "error",
        message = sprintf("Jumlah baris data bersih (%d) kurang dari batas minimum (30 baris) untuk analisis VAR/VECM.", n_clean)
      ))
    }
    
    # Detect or create date column
    date_col <- NULL
    for (col in names(valid_df)) {
      if (grepl("date|tanggal|periode|waktu", col, ignore.case = TRUE) || inherits(valid_df[[col]], "POSIXt") || inherits(valid_df[[col]], "Date")) {
        date_col <- col
        break
      }
    }
    
    if (!is.null(date_col)) {
      if (inherits(valid_df[[date_col]], "POSIXt") || inherits(valid_df[[date_col]], "Date")) {
        valid_df$Date <- format(valid_df[[date_col]], "%Y-%m")
      } else {
        valid_df$Date <- as.character(valid_df[[date_col]])
      }
    } else {
      valid_df$Date <- paste0("P_", 1:n_clean)
    }
    
    clean_df <- valid_df[, c("Date", var_names)]
    
    # Build clean row records list for JSON response
    records <- list()
    for (i in 1:nrow(clean_df)) {
      records[[i]] <- list(
        date = clean_df$Date[i],
        Date = clean_df$Date[i],
        SMAR = clean_df$SMAR[i],
        AALI = clean_df$AALI[i],
        SIMP = clean_df$SIMP[i]
      )
    }
    
    list(
      status = "success",
      validation = list(
        is_valid = TRUE,
        total_rows = n_total,
        valid_rows = n_clean,
        missing_rows = n_na,
        columns = names(clean_df),
        has_date_column = !is.null(date_col),
        variables = var_names
      ),
      preview = list(
        head = head(records, 10),
        tail = tail(records, 10)
      ),
      clean_data = records
    )
  }, error = function(e) {
    res$status <- 500
    list(
      status = "error",
      message = paste("Gagal memproses file:", e$message)
    )
  })
}

#* Run econometric analysis on provided data
#* @post /api/analyze
#* @parser json
#* @serializer unboxedJSON
function(req, res) {
  tryCatch({
    body <- req$body
    
    df <- NULL
    if (!is.null(body$records)) {
      # Handle records list or data frame
      raw_rec <- body$records
      if (is.data.frame(raw_rec)) {
        df <- raw_rec
      } else if (is.list(raw_rec)) {
        # Check if list of rows
        df <- as.data.frame(do.call(rbind, lapply(raw_rec, function(x) {
          data.frame(
            Date = if (!is.null(x$date)) as.character(x$date) else if (!is.null(x$Date)) as.character(x$Date) else "",
            SMAR = as.numeric(x$SMAR),
            AALI = as.numeric(x$AALI),
            SIMP = as.numeric(x$SIMP),
            stringsAsFactors = FALSE
          )
        })))
      }
    } else {
      # Fallback to default
      df <- read.csv(file.path(backend_dir, "data", "Sawit_Clean.csv"), stringsAsFactors = FALSE)
    }
    
    train_rows <- if (!is.null(body$train_rows)) as.integer(body$train_rows) else NULL
    horizon <- if (!is.null(body$forecast_horizon)) as.integer(body$forecast_horizon) else 12
    
    analysis_res <- run_full_analysis(df, train_rows = train_rows, forecast_horizon = horizon)
    
    list(
      status = "success",
      result = analysis_res
    )
  }, error = function(e) {
    res$status <- 500
    list(
      status = "error",
      message = paste("Analisis gagal dijalankan:", e$message)
    )
  })
}

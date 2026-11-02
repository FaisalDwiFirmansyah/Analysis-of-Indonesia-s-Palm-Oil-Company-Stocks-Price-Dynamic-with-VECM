# Script to run Plumber API server
suppressPackageStartupMessages(library(plumber))

cat("Starting Palm Oil Stock Analytics R Backend API on http://localhost:8000...\n")
pr <- pr("backend/plumber.R")
pr$run(host = "0.0.0.0", port = 8000)

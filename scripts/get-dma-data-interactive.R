#!/usr/bin/env Rscript
# Interactive script to get DMA data using zip2dma package
# 
# This script guides you through the process interactively
# Run this in R or RStudio for best results

cat("========================================\n")
cat("DMA Data Export - Interactive Guide\n")
cat("========================================\n\n")

# Check if packages are installed
if (!require("zip2dma", quietly = TRUE)) {
  cat("Installing zip2dma package...\n")
  if (!require("remotes", quietly = TRUE)) {
    install.packages("remotes", repos = "https://cran.rstudio.com/")
  }
  remotes::install_github("mmdatasci/zip2dma")
  library(zip2dma)
}

cat("\nStep 1: Initialize Dataverse connection\n")
cat("You will be prompted to enter your API token.\n")
cat("Token:", Sys.getenv("DATAVERSE_API_TOKEN"), "\n\n")

# Initialize - this will prompt for token
mapping <- dvinit()

cat("\nStep 2: Creating comprehensive zip code list\n")
cat("This will take a few minutes as we query all zip codes...\n\n")

# Create a comprehensive list of all possible 5-digit zip codes
# US zip codes range from 00501 to 99999
all_zips <- data.frame(
  zip_code = sprintf("%05d", 501:99999)
)

cat("Step 3: Getting DMA mappings for all zip codes\n")
cat("This may take 10-15 minutes...\n\n")

# Get DMA data for all zip codes
dma_data <- zip2dma(all_zips, dvdata = mapping, zip_col = "zip_code")

cat("\nStep 4: Cleaning and formatting data\n")

# Extract just the columns we need
output_data <- data.frame(
  zip_code = dma_data$zip_code,
  dma_code = dma_data$DMA.CODE,
  dma_name = dma_data$DMA.NAME,
  stringsAsFactors = FALSE
)

# Remove rows with missing DMA data
output_data <- output_data[!is.na(output_data$dma_code) & !is.na(output_data$dma_name), ]

# Remove duplicates
output_data <- unique(output_data)

cat(paste("✅ Extracted", nrow(output_data), "zip code to DMA mappings\n"))
cat(paste("Unique DMAs:", length(unique(output_data$dma_code)), "\n\n"))

# Create data directory
data_dir <- file.path(getwd(), "data")
if (!dir.exists(data_dir)) {
  dir.create(data_dir, showWarnings = FALSE)
}

# Write to CSV
output_file <- file.path(data_dir, "dma-mappings.csv")
write.csv(output_data, output_file, row.names = FALSE, quote = FALSE)

cat("✅ Successfully exported to:", output_file, "\n")
cat("\nNext step: npm run import:dmas\n")



# ========================================
# DMA Data Export Script
# Run this in R or RStudio
# ========================================

# Set your working directory to the project root
setwd("/Users/drussotto/code-projects/divorcelawyer-modern")

# Load required packages
if (!require("zip2dma", quietly = TRUE)) {
  if (!require("remotes", quietly = TRUE)) {
    install.packages("remotes", repos = "https://cran.rstudio.com/")
  }
  remotes::install_github("mmdatasci/zip2dma")
}
library(zip2dma)

cat("========================================\n")
cat("DMA Data Export\n")
cat("========================================\n\n")

# Your API token
api_token <- "a7a73014-0cce-4ab0-b825-c629c6dd7be8"

cat("Step 1: Initialize Dataverse connection\n")
cat("When prompted, paste this token:\n")
cat(api_token, "\n\n")

# Initialize - you'll need to paste the token when prompted
mapping <- dvinit()

cat("\n✅ Connected to Dataverse!\n\n")

cat("Step 2: Creating zip code list\n")
cat("US zip codes range from 00501 to 99999\n")
cat("This creates a data frame with all possible zip codes...\n\n")

# Create comprehensive zip code list
# US zip codes: 00501 to 99999 (but many don't exist)
# We'll query a large range to get all valid mappings
all_zips <- data.frame(
  zip_code = sprintf("%05d", 501:99999)
)

cat("Created", nrow(all_zips), "zip codes to query\n\n")

cat("Step 3: Getting DMA mappings\n")
cat("⚠️  This will take 10-15 minutes as it queries each zip code...\n")
cat("Please be patient - you'll see progress as it runs.\n\n")

# Get DMA data - this is the slow part
dma_data <- zip2dma(all_zips, dvdata = mapping, zip_col = "zip_code")

cat("\n✅ Data retrieval complete!\n\n")

cat("Step 4: Processing and cleaning data\n")

# Extract the columns we need
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

# Normalize zip codes (ensure 5 digits)
output_data$zip_code <- sprintf("%05d", as.integer(gsub("[^0-9]", "", output_data$zip_code)))

cat("✅ Processed", nrow(output_data), "unique zip code to DMA mappings\n")
cat("   Unique DMAs:", length(unique(output_data$dma_code)), "\n\n")

# Create data directory
data_dir <- file.path(getwd(), "data")
if (!dir.exists(data_dir)) {
  dir.create(data_dir, showWarnings = FALSE)
}

# Write to CSV
output_file <- file.path(data_dir, "dma-mappings.csv")
write.csv(output_data, output_file, row.names = FALSE, quote = FALSE)

cat("========================================\n")
cat("✅ SUCCESS!\n")
cat("========================================\n")
cat("Exported to:", output_file, "\n")
cat("Total mappings:", nrow(output_data), "\n")
cat("Unique DMAs:", length(unique(output_data$dma_code)), "\n\n")
cat("Next step: Run this command in your terminal:\n")
cat("  npm run import:dmas\n")
cat("========================================\n")



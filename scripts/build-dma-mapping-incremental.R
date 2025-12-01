# ========================================
# Incremental DMA Mapping Builder
# Since the full dataset is unavailable, this builds the mapping
# by querying zip codes in batches
# ========================================

library(zip2dma)
library(dataverse)

api_token <- "a7a73014-0cce-4ab0-b825-c629c6dd7be8"
Sys.setenv("DATAVERSE_SERVER" = "dataverse.harvard.edu")
Sys.setenv("DATAVERSE_KEY" = api_token)

cat("========================================\n")
cat("Incremental DMA Mapping Builder\n")
cat("========================================\n\n")

cat("Note: The original dataset appears unavailable.\n")
cat("This script will query zip codes in batches to build the mapping.\n")
cat("This will take a LONG time (hours) for all zip codes.\n\n")

# Initialize (you'll need to paste token when prompted)
cat("Step 1: Initialize Dataverse\n")
cat("When prompted, paste token:", api_token, "\n\n")

mapping <- dvinit()

# Start with a sample of zip codes to test
# You can expand this gradually
cat("Step 2: Querying sample zip codes\n")
cat("Starting with zip codes 10001-10100 (100 zip codes)...\n\n")

# Sample batch
sample_zips <- data.frame(
  zip_code = sprintf("%05d", 10001:10100)
)

# Get DMA data
dma_data <- zip2dma(sample_zips, dvdata = mapping, zip_col = "zip_code")

# Process
output_data <- data.frame(
  zip_code = dma_data$zip_code,
  dma_code = dma_data$DMA.CODE,
  dma_name = dma_data$DMA.NAME,
  stringsAsFactors = FALSE
)

output_data <- output_data[!is.na(output_data$dma_code) & !is.na(output_data$dma_name), ]
output_data <- unique(output_data)

cat("✅ Got", nrow(output_data), "mappings from sample\n\n")

# Save
data_dir <- file.path(getwd(), "data")
if (!dir.exists(data_dir)) dir.create(data_dir)

output_file <- file.path(data_dir, "dma-mappings.csv")
write.csv(output_data, output_file, row.names = FALSE, quote = FALSE)

cat("Saved to:", output_file, "\n")
cat("\nTo get more data, you can:\n")
cat("1. Run this script multiple times with different zip code ranges\n")
cat("2. Manually add more zip codes to the CSV\n")
cat("3. Use the admin interface to add mappings\n\n")
cat("Current mappings:", nrow(output_data), "\n")



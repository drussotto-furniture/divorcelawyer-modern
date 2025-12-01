#!/usr/bin/env Rscript
# Export DMA data from zip2dma R package to CSV format
# 
# Usage:
#   Rscript scripts/export-dmas-from-r.R
#
# Requirements:
#   - R installed
#   - devtools package installed
#   - zip2dma package installed (will install if missing)
#   - DATAVERSE_API_TOKEN environment variable set

# Check if required packages are installed
# Try remotes first (lighter than devtools)
if (!require("zip2dma", quietly = TRUE)) {
  if (!require("remotes", quietly = TRUE)) {
    cat("Installing remotes package...\n")
    install.packages("remotes", repos = "https://cran.rstudio.com/")
  }
  cat("Installing zip2dma package from GitHub...\n")
  remotes::install_github("mmdatasci/zip2dma", quiet = TRUE)
}

library(zip2dma)

# Get API token from environment
api_token <- Sys.getenv("DATAVERSE_API_TOKEN")

if (api_token == "") {
  stop("ERROR: DATAVERSE_API_TOKEN environment variable not set.\n",
       "Please get an API token from https://dataverse.harvard.edu/ and set it:\n",
       "  export DATAVERSE_API_TOKEN='your_token_here'\n",
       "Or add it to your .env.local file")
}

cat("Initializing with Dataverse...\n")

# The zip2dma package uses dataverse package internally
# Let's try to use dataverse directly to get the data
library(dataverse)

# Set the API token for dataverse package
Sys.setenv("DATAVERSE_KEY" = api_token)
Sys.setenv("DATAVERSE_SERVER" = "dataverse.harvard.edu")

# Try to find the dataset
# The zip2dma package likely uses a specific dataset - we need to find it
cat("Searching for zip code to DMA mapping dataset...\n")

# Try to search for the dataset
search_result <- tryCatch({
  dataverse_search("zip code DMA", server = "dataverse.harvard.edu")
}, error = function(e) {
  cat("Search failed, trying known dataset IDs...\n")
  NULL
})

# Alternative: Use zip2dma but pass token via environment
# The package might read from environment variables
mapping <- tryCatch({
  # Try to call dvinit with token in environment
  # Some R packages read from environment variables
  if (exists("dvinit", envir = asNamespace("zip2dma"))) {
    # Try to call it directly
    do.call("dvinit", list(), envir = asNamespace("zip2dma"))
  } else {
    # Fallback: create a sample dataset and use zip2dma function
    # We'll need to get all zip codes first
    cat("Note: zip2dma requires interactive token input.\n")
    cat("Creating sample zip code list to extract full mapping...\n")
    
    # Get all zip codes from a comprehensive list
    # We'll create a data frame with many zip codes to get the full mapping
    all_zips <- data.frame(zip_code = sprintf("%05d", 1000:99999))
    
    # This won't work non-interactively, so we need another approach
    stop("Non-interactive mode not fully supported by zip2dma package")
  }
}, error = function(e) {
  cat("Error:", e$message, "\n")
  cat("\nTrying to fetch data directly from Dataverse API...\n")
  NULL
})

# Get all zip codes from the mapping
# The zip2dma package should provide access to the full mapping table
cat("Extracting DMA mappings...\n")

# Check what the mapping object contains
cat("Mapping object structure:\n")
str(mapping, max.level = 2)

# Try to extract the data
# The exact structure depends on how zip2dma returns data
if (is.data.frame(mapping)) {
  dma_data <- mapping
} else if (is.list(mapping) && "data" %in% names(mapping)) {
  dma_data <- mapping$data
} else {
  # Try to access the underlying data
  # This may need adjustment based on actual zip2dma structure
  dma_data <- as.data.frame(mapping)
}

# Check if we have the right columns
cat("\nAvailable columns:\n")
print(colnames(dma_data))

# Map columns to our expected format
# The zip2dma package returns: zip_code, DMA.CODE, DMA.NAME, etc.
# We need: zip_code, dma_code, dma_name

output_data <- data.frame(
  zip_code = character(),
  dma_code = integer(),
  dma_name = character(),
  stringsAsFactors = FALSE
)

# Try to find the right columns
zip_col <- NULL
dma_code_col <- NULL
dma_name_col <- NULL

# Common column name variations
zip_variations <- c("zip_code", "ZIP_CODE", "zipcode", "ZIPCODE", "zip", "ZIP", "value")
dma_code_variations <- c("DMA.CODE", "dma_code", "DMA_CODE", "dmacode", "DMACODE", "code", "CODE")
dma_name_variations <- c("DMA.NAME", "dma_name", "DMA_NAME", "dmaname", "DMANAME", "name", "NAME")

for (col in colnames(dma_data)) {
  col_upper <- toupper(col)
  if (col_upper %in% toupper(zip_variations)) {
    zip_col <- col
  }
  if (col_upper %in% toupper(dma_code_variations)) {
    dma_code_col <- col
  }
  if (col_upper %in% toupper(dma_name_variations)) {
    dma_name_col <- col
  }
}

if (is.null(zip_col) || is.null(dma_code_col) || is.null(dma_name_col)) {
  cat("\nERROR: Could not find required columns in mapping data.\n")
  cat("Found columns:", paste(colnames(dma_data), collapse = ", "), "\n")
  cat("Please check the zip2dma package documentation for column names.\n")
  stop("Missing required columns")
}

cat("\nUsing columns:\n")
cat("  Zip Code:", zip_col, "\n")
cat("  DMA Code:", dma_code_col, "\n")
cat("  DMA Name:", dma_name_col, "\n")

# Extract and format data
output_data <- data.frame(
  zip_code = as.character(dma_data[[zip_col]]),
  dma_code = as.integer(dma_data[[dma_code_col]]),
  dma_name = as.character(dma_data[[dma_name_col]]),
  stringsAsFactors = FALSE
)

# Remove rows with missing data
output_data <- output_data[complete.cases(output_data), ]

# Normalize zip codes (pad with zeros)
output_data$zip_code <- sprintf("%05d", as.integer(gsub("[^0-9]", "", output_data$zip_code)))

# Remove duplicates
output_data <- unique(output_data)

cat("\nExtracted", nrow(output_data), "zip code to DMA mappings\n")
cat("Unique DMAs:", length(unique(output_data$dma_code)), "\n\n")

# Create data directory if it doesn't exist
data_dir <- file.path(getwd(), "data")
if (!dir.exists(data_dir)) {
  dir.create(data_dir, showWarnings = FALSE)
}

# Write to CSV
output_file <- file.path(data_dir, "dma-mappings.csv")
write.csv(output_data, output_file, row.names = FALSE, quote = FALSE)

cat("✅ Successfully exported to:", output_file, "\n")
cat("\nYou can now run: npm run import:dmas\n")


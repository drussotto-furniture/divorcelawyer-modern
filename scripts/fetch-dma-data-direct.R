# ========================================
# Fetch DMA Data Directly from Dataverse
# This bypasses zip2dma and fetches the data directly
# ========================================

library(dataverse)

# Set up Dataverse connection
api_token <- "a7a73014-0cce-4ab0-b825-c629c6dd7be8"
Sys.setenv("DATAVERSE_SERVER" = "dataverse.harvard.edu")
Sys.setenv("DATAVERSE_KEY" = api_token)

cat("========================================\n")
cat("Fetching DMA Data from Harvard Dataverse\n")
cat("========================================\n\n")

# The zip2dma package uses this dataset
# Dataset ID: 2850125, Identifier: DVN/IVXEHT
dataset_id <- "2850125"  # Use numeric ID
dataset_persistent_id <- "doi:10.7910/DVN/IVXEHT"
file_name <- "DMA-zip.tab"

cat("Dataset ID:", dataset_id, "\n")
cat("Persistent ID:", dataset_persistent_id, "\n")
cat("File:", file_name, "\n\n")

cat("📥 Downloading file...\n")

# Get the file directly
tryCatch({
  # Try with numeric ID first
  files <- tryCatch({
    dataset_files(dataset_id, server = "dataverse.harvard.edu")
  }, error = function(e) {
    # Fallback to persistent ID
    dataset_files(dataset_persistent_id, server = "dataverse.harvard.edu")
  })
  
  # Find the DMA-zip.tab file
  target_file <- NULL
  for (file in files) {
    if (file$label == file_name || grepl("DMA.*zip", file$label, ignore.case = TRUE)) {
      target_file <- file
      break
    }
  }
  
  if (is.null(target_file)) {
    # Try to get file by name directly using persistent ID
    cat("File not found in file list, trying direct download...\n")
    file_data <- tryCatch({
      get_file(file_name, dataset_persistent_id, server = "dataverse.harvard.edu")
    }, error = function(e) {
      get_file(file_name, dataset_id, server = "dataverse.harvard.edu")
    })
  } else {
    cat("Found file:", target_file$label, "\n")
    file_data <- tryCatch({
      get_file(target_file, dataset_id, server = "dataverse.harvard.edu")
    }, error = function(e) {
      get_file(target_file, dataset_persistent_id, server = "dataverse.harvard.edu")
    })
  }
  
  # Save to temporary file
  tmp_file <- tempfile(fileext = ".tab")
  writeBin(file_data, tmp_file)
  
  cat("✅ File downloaded\n")
  cat("📊 Reading data...\n")
  
  # Read the tab-delimited file
  mapping_data <- read.delim(tmp_file, header = TRUE, stringsAsFactors = FALSE)
  
  cat("✅ Data loaded:", nrow(mapping_data), "rows\n")
  cat("Columns:", paste(colnames(mapping_data), collapse = ", "), "\n\n")
  
  # Clean up temp file
  file.remove(tmp_file)
  
  # Identify columns
  # The file should have: ZIP_CODE, DMA.CODE, DMA.NAME (or similar)
  zip_col <- NULL
  dma_code_col <- NULL
  dma_name_col <- NULL
  
  for (col in colnames(mapping_data)) {
    col_lower <- tolower(col)
    if (grepl("^zip", col_lower) || grepl("zip.*code", col_lower)) {
      zip_col <- col
    }
    if (grepl("dma.*code", col_lower) || (grepl("code", col_lower) && !grepl("zip", col_lower))) {
      dma_code_col <- col
    }
    if (grepl("dma.*name", col_lower) || (grepl("name", col_lower) && !grepl("zip", col_lower))) {
      dma_name_col <- col
    }
  }
  
  # Fallback: use first three columns
  if (is.null(zip_col)) zip_col <- colnames(mapping_data)[1]
  if (is.null(dma_code_col)) dma_code_col <- colnames(mapping_data)[2]
  if (is.null(dma_name_col)) dma_name_col <- colnames(mapping_data)[3]
  
  cat("Using columns:\n")
  cat("  Zip Code:", zip_col, "\n")
  cat("  DMA Code:", dma_code_col, "\n")
  cat("  DMA Name:", dma_name_col, "\n\n")
  
  # Extract and format data
  output_data <- data.frame(
    zip_code = sprintf("%05d", as.integer(gsub("[^0-9]", "", mapping_data[[zip_col]]))),
    dma_code = as.integer(mapping_data[[dma_code_col]]),
    dma_name = as.character(mapping_data[[dma_name_col]]),
    stringsAsFactors = FALSE
  )
  
  # Remove rows with missing data
  output_data <- output_data[complete.cases(output_data), ]
  
  # Remove duplicates
  output_data <- unique(output_data)
  
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
  
}, error = function(e) {
  cat("\n❌ Error:", e$message, "\n")
  cat("\nTrying alternative approach...\n")
  
  # Alternative: try to get file by ID if we know it
  # Or search for the file differently
  stop("Could not fetch data. Error: ", e$message)
})


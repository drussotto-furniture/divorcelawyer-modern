#!/usr/bin/env Rscript
# Simplified script to get DMA data - handles token automatically
# This version tries to work around the interactive prompt issue

library(zip2dma)
library(dataverse)

# Get token from environment
api_token <- Sys.getenv("DATAVERSE_API_TOKEN")

if (api_token == "") {
  stop("DATAVERSE_API_TOKEN not set")
}

cat("========================================\n")
cat("DMA Data Export\n")
cat("========================================\n\n")

cat("Setting up Dataverse connection...\n")
Sys.setenv("DATAVERSE_KEY" = api_token)
Sys.setenv("DATAVERSE_SERVER" = "dataverse.harvard.edu")

# The zip2dma package's dvinit() function prompts interactively
# We need to work around this. Let's try to use dataverse package directly
# to get the mapping data, or create a workaround.

cat("\nAttempting to initialize zip2dma...\n")
cat("Note: If this prompts for a token, enter:", api_token, "\n\n")

# Try to initialize - this may still prompt
# We'll create a workaround by using dataverse package directly
cat("Using dataverse package to find the dataset...\n")

# Search for the dataset that zip2dma uses
# The package likely uses a specific dataset - we need to find it
search_results <- dataverse_search("zip code designated market area", server = "dataverse.harvard.edu")

if (nrow(search_results) > 0) {
  cat("Found", nrow(search_results), "potential datasets\n")
  
  # Look for the most relevant one
  for (i in 1:min(10, nrow(search_results))) {
    cat("\nChecking:", search_results$dataset_name[i], "\n")
    
    # Try to get files from this dataset
    tryCatch({
      dataset_id <- gsub("^doi:", "", search_results$dataset_persistent_id[i])
      files <- dataset_files(dataset_id, server = "dataverse.harvard.edu")
      
      # Check if any file looks like zip/DMA mapping
      for (file in files) {
        filename <- file$label
        if (grepl("\\.(csv|tsv|xlsx)$", filename, ignore.case = TRUE)) {
          cat("  Found file:", filename, "\n")
          
          # Download and check if it has zip/DMA data
          file_data <- get_file(file, dataset_id, server = "dataverse.harvard.edu")
          
          # Save temporarily to check
          temp_file <- tempfile(fileext = ".csv")
          writeBin(file_data, temp_file)
          
          # Try to read and check structure
          tryCatch({
            test_data <- read.csv(temp_file, nrows = 10)
            if (any(grepl("zip", tolower(colnames(test_data)), ignore.case = TRUE)) &&
                any(grepl("dma", tolower(colnames(test_data)), ignore.case = TRUE))) {
              cat("  ✅ This looks like the right file!\n")
              
              # Read full file
              full_data <- read.csv(temp_file)
              
              # Extract zip and DMA columns
              zip_col <- colnames(full_data)[grepl("zip", tolower(colnames(full_data)), ignore.case = TRUE)][1]
              dma_code_col <- colnames(full_data)[grepl("dma.*code|code", tolower(colnames(full_data)), ignore.case = TRUE)][1]
              dma_name_col <- colnames(full_data)[grepl("dma.*name|name", tolower(colnames(full_data)), ignore.case = TRUE)][1]
              
              if (!is.na(zip_col) && !is.na(dma_code_col) && !is.na(dma_name_col)) {
                output_data <- data.frame(
                  zip_code = sprintf("%05d", as.integer(gsub("[^0-9]", "", full_data[[zip_col]]))),
                  dma_code = as.integer(full_data[[dma_code_col]]),
                  dma_name = as.character(full_data[[dma_name_col]]),
                  stringsAsFactors = FALSE
                )
                
                output_data <- output_data[complete.cases(output_data), ]
                output_data <- unique(output_data)
                
                # Save
                data_dir <- file.path(getwd(), "data")
                if (!dir.exists(data_dir)) dir.create(data_dir)
                
                output_file <- file.path(data_dir, "dma-mappings.csv")
                write.csv(output_data, output_file, row.names = FALSE, quote = FALSE)
                
                cat("\n✅ Successfully exported", nrow(output_data), "mappings to:", output_file, "\n")
                cat("Unique DMAs:", length(unique(output_data$dma_code)), "\n\n")
                cat("Next: npm run import:dmas\n")
                
                quit(save = "no", status = 0)
              }
            }
          }, error = function(e) {
            # Not the right format, continue
          })
          
          unlink(temp_file)
        }
      }
    }, error = function(e) {
      # Skip this dataset
    })
  }
}

# If we get here, the automatic approach didn't work
# Fall back to using zip2dma with a sample approach
cat("\n⚠️  Could not automatically find the dataset.\n")
cat("Trying alternative approach with zip2dma package...\n\n")

# Create a comprehensive zip code list
cat("Creating zip code list (this will query all US zip codes)...\n")
all_zips <- data.frame(zip_code = sprintf("%05d", 501:99999))

cat("Initializing zip2dma (you may be prompted for token)...\n")
cat("If prompted, enter token:", api_token, "\n\n")

# Try to initialize - user may need to enter token
mapping <- tryCatch({
  dvinit()
}, error = function(e) {
  cat("Error:", e$message, "\n")
  cat("\nPlease run this in RStudio or R interactively:\n")
  cat("  source('scripts/get-dma-data-interactive.R')\n")
  stop("Interactive mode required")
})

cat("Getting DMA mappings (this will take 10-15 minutes)...\n")
dma_data <- zip2dma(all_zips, dvdata = mapping, zip_col = "zip_code")

# Process results
output_data <- data.frame(
  zip_code = dma_data$zip_code,
  dma_code = dma_data$DMA.CODE,
  dma_name = dma_data$DMA.NAME,
  stringsAsFactors = FALSE
)

output_data <- output_data[!is.na(output_data$dma_code) & !is.na(output_data$dma_name), ]
output_data <- unique(output_data)

# Save
data_dir <- file.path(getwd(), "data")
if (!dir.exists(data_dir)) dir.create(data_dir)

output_file <- file.path(data_dir, "dma-mappings.csv")
write.csv(output_data, output_file, row.names = FALSE, quote = FALSE)

cat("\n✅ Successfully exported", nrow(output_data), "mappings to:", output_file, "\n")
cat("Unique DMAs:", length(unique(output_data$dma_code)), "\n\n")
cat("Next: npm run import:dmas\n")




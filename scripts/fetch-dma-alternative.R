# ========================================
# Alternative: Search and Find DMA Dataset
# ========================================

library(dataverse)

api_token <- "a7a73014-0cce-4ab0-b825-c629c6dd7be8"
Sys.setenv("DATAVERSE_SERVER" = "dataverse.harvard.edu")
Sys.setenv("DATAVERSE_KEY" = api_token)

cat("========================================\n")
cat("Searching for DMA Dataset\n")
cat("========================================\n\n")

# Try multiple search terms
search_terms <- c(
  "DMA zip code",
  "zip code DMA mapping",
  "designated market area zip",
  "Nielsen DMA zip"
)

found_dataset <- FALSE

for (term in search_terms) {
  cat("Searching:", term, "\n")
  
  tryCatch({
    results <- dataverse_search(term, server = "dataverse.harvard.edu")
    
    if (nrow(results) > 0) {
      cat("  Found", nrow(results), "results\n")
      
      # Look through results for relevant datasets
      for (i in 1:min(10, nrow(results))) {
        dataset_name <- results$dataset_name[i]
        dataset_id <- results$dataset_persistent_id[i]
        
        cat("  Checking:", dataset_name, "\n")
        
        # Try to get files from this dataset
        tryCatch({
          clean_id <- gsub("^doi:", "", dataset_id)
          files <- dataset_files(clean_id, server = "dataverse.harvard.edu")
          
          # Check file names
          for (file in files) {
            filename <- tolower(file$label)
            if (grepl("dma.*zip|zip.*dma|dma-zip", filename)) {
              cat("    ✅ Found relevant file:", file$label, "\n")
              
              # Download the file
              file_data <- get_file(file, clean_id, server = "dataverse.harvard.edu")
              
              # Save temporarily
              tmp_file <- tempfile(fileext = if (grepl("\\.tab$", file$label)) ".tab" else ".csv")
              writeBin(file_data, tmp_file)
              
              # Try to read it
              if (grepl("\\.tab$", file$label)) {
                data <- read.delim(tmp_file, header = TRUE, stringsAsFactors = FALSE)
              } else {
                data <- read.csv(tmp_file, header = TRUE, stringsAsFactors = FALSE)
              }
              
              cat("    ✅ Read", nrow(data), "rows\n")
              cat("    Columns:", paste(colnames(data), collapse = ", "), "\n")
              
              # Process the data
              # Find zip and DMA columns
              zip_col <- colnames(data)[grepl("zip", tolower(colnames(data)), ignore.case = TRUE)][1]
              dma_code_col <- colnames(data)[grepl("dma.*code|code", tolower(colnames(data)), ignore.case = TRUE) & !grepl("zip", tolower(colnames(data)), ignore.case = TRUE)][1]
              dma_name_col <- colnames(data)[grepl("dma.*name|name", tolower(colnames(data)), ignore.case = TRUE) & !grepl("zip", tolower(colnames(data)), ignore.case = TRUE)][1]
              
              if (is.null(zip_col)) zip_col <- colnames(data)[1]
              if (is.null(dma_code_col)) dma_code_col <- colnames(data)[2]
              if (is.null(dma_name_col)) dma_name_col <- colnames(data)[3]
              
              # Create output
              output_data <- data.frame(
                zip_code = sprintf("%05d", as.integer(gsub("[^0-9]", "", data[[zip_col]]))),
                dma_code = as.integer(data[[dma_code_col]]),
                dma_name = as.character(data[[dma_name_col]]),
                stringsAsFactors = FALSE
              )
              
              output_data <- output_data[complete.cases(output_data), ]
              output_data <- unique(output_data)
              
              # Save
              data_dir <- file.path(getwd(), "data")
              if (!dir.exists(data_dir)) dir.create(data_dir)
              
              output_file <- file.path(data_dir, "dma-mappings.csv")
              write.csv(output_data, output_file, row.names = FALSE, quote = FALSE)
              
              cat("\n✅ SUCCESS! Exported", nrow(output_data), "mappings to:", output_file, "\n")
              cat("Unique DMAs:", length(unique(output_data$dma_code)), "\n\n")
              cat("Next: npm run import:dmas\n")
              
              found_dataset <- TRUE
              break
            }
          }
          
          if (found_dataset) break
          
        }, error = function(e) {
          # Skip this dataset
        })
      }
      
      if (found_dataset) break
    }
  }, error = function(e) {
    cat("  Search failed:", e$message, "\n")
  })
}

if (!found_dataset) {
  cat("\n❌ Could not find the dataset automatically.\n")
  cat("\nAlternative options:\n")
  cat("1. Manually search https://dataverse.harvard.edu/ for 'zip code DMA'\n")
  cat("2. Download a CSV file and place it at data/dma-mappings.csv\n")
  cat("3. Use the admin interface to enter data manually\n")
}



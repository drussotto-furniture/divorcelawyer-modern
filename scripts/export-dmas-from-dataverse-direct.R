#!/usr/bin/env Rscript
# Export DMA data directly from Harvard Dataverse
# This bypasses the zip2dma package's interactive prompts

library(dataverse)

# Get API token from environment
api_token <- Sys.getenv("DATAVERSE_API_TOKEN")

if (api_token == "") {
  stop("ERROR: DATAVERSE_API_TOKEN environment variable not set.\n",
       "Please set it: export DATAVERSE_API_TOKEN='your_token_here'")
}

# Set server and token
Sys.setenv("DATAVERSE_SERVER" = "dataverse.harvard.edu")
Sys.setenv("DATAVERSE_KEY" = api_token)

cat("🔍 Searching for zip code to DMA mapping dataset...\n")

# Search for datasets related to zip codes and DMA
search_terms <- c("zip code DMA", "zip2dma", "zip code designated market area")

dataset_found <- FALSE
dataset_id <- NULL

for (term in search_terms) {
  cat(paste("Trying search term:", term, "\n"))
  tryCatch({
    results <- dataverse_search(term, server = "dataverse.harvard.edu")
    if (!is.null(results) && nrow(results) > 0) {
      cat(paste("✅ Found", nrow(results), "result(s)\n"))
      
      # Find the most relevant result
      # Look for datasets with zip/dma in name or description
      # Also check file names
      relevant_indices <- which(
        grepl("zip.*dma|dma.*zip|zip.*designated|designated.*market.*area", tolower(results$dataset_name), ignore.case = TRUE) |
        grepl("zip.*dma|dma.*zip|zip.*designated", tolower(results$name), ignore.case = TRUE) |
        grepl("zip.*dma|dma.*zip", tolower(results$description), ignore.case = TRUE)
      )
      
      if (length(relevant_indices) > 0) {
        # Use the first relevant result
        idx <- relevant_indices[1]
        dataset_id <- results$dataset_persistent_id[idx]
        dataset_found <- TRUE
        cat(paste("✅ Found relevant dataset:", results$dataset_name[idx], "\n"))
        cat(paste("DOI:", dataset_id, "\n\n"))
        break
      } else {
        # Check all results more carefully
        cat("Checking all results for zip/DMA content...\n")
        for (i in 1:min(5, nrow(results))) {
          cat(paste("  Checking:", results$dataset_name[i], "\n"))
          # Try to get this dataset and check its files
          tryCatch({
            test_id <- gsub("^doi:", "", results$dataset_persistent_id[i])
            test_files <- dataset_files(test_id, server = "dataverse.harvard.edu")
            # Check if any file looks like it has zip/DMA data
            file_names <- sapply(test_files, function(f) f$label)
            if (any(grepl("zip|dma|mapping", tolower(file_names), ignore.case = TRUE))) {
              dataset_id <- results$dataset_persistent_id[i]
              dataset_found <- TRUE
              cat(paste("✅ Found dataset with relevant files:", results$dataset_name[i], "\n"))
              cat(paste("DOI:", dataset_id, "\n\n"))
              break
            }
          }, error = function(e) {
            # Skip this dataset
          })
        }
        if (dataset_found) break
      }
    }
  }, error = function(e) {
    cat(paste("Search error:", e$message, "\n"))
  })
}

if (!dataset_found) {
  cat("⚠️  Could not find dataset via search.\n")
  cat("Trying known dataset DOI...\n")
  
  # Try some common dataset patterns
  # You may need to find the actual DOI from the zip2dma package documentation
  known_dois <- c(
    # Add known DOIs here if you find them
  )
  
  for (doi in known_dois) {
    tryCatch({
      dataset <- get_dataset(doi, server = "dataverse.harvard.edu")
      dataset_id <- doi
      dataset_found <- TRUE
      cat(paste("✅ Found dataset:", dataset$title, "\n"))
      break
    }, error = function(e) {
      # Continue to next
    })
  }
}

if (!dataset_found) {
  stop("Could not find the dataset. Please:\n",
       "1. Find the dataset DOI from https://dataverse.harvard.edu/\n",
       "2. Or use a CSV file with the data instead\n",
       "3. See documentation/DMA-SETUP-GUIDE.md for alternatives")
}

# Get dataset files
cat("📥 Fetching dataset files...\n")
# Remove 'doi:' prefix if present
clean_id <- gsub("^doi:", "", dataset_id)
files <- dataset_files(clean_id, server = "dataverse.harvard.edu")

# Find CSV/TSV files
data_files <- files[sapply(files, function(f) {
  filename <- f$label
  grepl("\\.(csv|tsv)$", filename, ignore.case = TRUE)
})]

if (length(data_files) == 0) {
  stop("No CSV/TSV files found in dataset")
}

cat(paste("Found", length(data_files), "data file(s)\n\n"))

# Download and parse the first data file
output_data <- data.frame(
  zip_code = character(),
  dma_code = integer(),
  dma_name = character(),
  stringsAsFactors = FALSE
)

for (file in data_files) {
  cat(paste("Downloading:", file$label, "\n"))
  
  # Download file
  file_data <- get_file(file, dataset_id, server = "dataverse.harvard.edu")
  
  # Parse CSV/TSV
  delimiter <- if (grepl("\\.tsv$", file$label, ignore.case = TRUE)) "\t" else ","
  lines <- strsplit(rawToChar(file_data), "\n")[[1]]
  
  # Skip header
  header <- tolower(lines[1])
  has_header <- grepl("zip", header) && (grepl("dma", header) || grepl("code", header))
  data_lines <- if (has_header) lines[-1] else lines
  
  for (line in data_lines) {
    if (trimws(line) == "") next
    
    parts <- strsplit(line, delimiter)[[1]]
    parts <- trimws(gsub('^"|"$', '', parts))
    
    if (length(parts) < 3) next
    
    # Try to identify columns
    zip_code <- NA
    dma_code <- NA
    dma_name <- NA
    
    for (part in parts) {
      # Zip code: 5 digits
      if (grepl("^\\d{5}$", part)) {
        zip_code <- part
      }
      # DMA code: 3-4 digits
      else if (grepl("^\\d{3,4}$", part) && is.na(dma_code)) {
        dma_code <- as.integer(part)
      }
      # DMA name: contains hyphen or is long
      else if ((grepl("-", part) || nchar(part) > 10) && is.na(dma_name)) {
        dma_name <- part
      }
    }
    
    # Fallback: assume order is zip, code, name
    if (is.na(zip_code) && length(parts) >= 1) {
      zip_code <- gsub("[^0-9]", "", parts[1])
      zip_code <- sprintf("%05s", zip_code)
    }
    if (is.na(dma_code) && length(parts) >= 2) {
      dma_code <- as.integer(gsub("[^0-9]", "", parts[2]))
    }
    if (is.na(dma_name) && length(parts) >= 3) {
      dma_name <- paste(parts[3:length(parts)], collapse = " ")
    }
    
    if (!is.na(zip_code) && !is.na(dma_code) && !is.na(dma_name)) {
      output_data <- rbind(output_data, data.frame(
        zip_code = zip_code,
        dma_code = dma_code,
        dma_name = dma_name,
        stringsAsFactors = FALSE
      ))
    }
  }
}

if (nrow(output_data) == 0) {
  stop("No data extracted from files. Please check the file format.")
}

# Remove duplicates and normalize
output_data <- unique(output_data)
output_data$zip_code <- sprintf("%05d", as.integer(output_data$zip_code))

cat(paste("\n✅ Extracted", nrow(output_data), "zip code to DMA mappings\n"))
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
cat("\nYou can now run: npm run import:dmas\n")


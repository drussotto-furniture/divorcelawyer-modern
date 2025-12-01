# Getting DMA Data - Complete Guide

Since the zip2dma R package requires interactive input, here are your options:

## Option 1: Use R Interactively (Recommended)

1. **Open R or RStudio**

2. **Install packages** (if not already done):
   ```r
   install.packages("remotes")
   remotes::install_github("mmdatasci/zip2dma")
   ```

3. **Run the interactive script**:
   ```r
   source("scripts/get-dma-data-interactive.R")
   ```
   
   When prompted for the API token, enter: `a7a73014-0cce-4ab0-b825-c629c6dd7be8`

4. **Wait for completion** (10-15 minutes for all zip codes)

5. **Import to database**:
   ```bash
   npm run import:dmas
   ```

## Option 2: Manual CSV Creation

1. **Use the template**: `data/dma-mappings-template.csv`

2. **Get data from public sources**:
   - Search for "zip code DMA mapping" datasets
   - Download CSV files
   - Format as: `zip_code,dma_code,dma_name`

3. **Place CSV at**: `data/dma-mappings.csv`

4. **Import**:
   ```bash
   npm run import:dmas
   ```

## Option 3: Use the Admin Interface

1. **Run the database migration** (if not done):
   ```sql
   -- Run migration 043_create_dmas_tables.sql
   ```

2. **Create DMAs manually**:
   - Go to `/admin/directory/locations/dmas`
   - Click "Add DMA"
   - Enter DMA code, name, slug

3. **Assign zip codes**:
   - Edit each DMA
   - Search for zip codes
   - Add them one by one

## Quick Start (If you have a CSV)

If you already have a CSV file with zip code to DMA mappings:

1. **Place it at**: `data/dma-mappings.csv`
2. **Format**: `zip_code,dma_code,dma_name` (header row optional)
3. **Run**: `npm run import:dmas`

## Finding the Data

The zip2dma package uses Harvard Dataverse. To find the source dataset:

1. Go to https://dataverse.harvard.edu/
2. Search for "zip code DMA" or "designated market area"
3. Look for datasets with zip code mappings
4. Download the CSV/TSV file
5. Format it according to the template

## Need Help?

- Check the zip2dma package: https://github.com/mmdatasci/zip2dma
- Dataverse search: https://dataverse.harvard.edu/dataverse/harvard
- Contact support if you need help finding the specific dataset


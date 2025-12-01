# DMA Import Guide

This guide explains how to import Designated Marketing Area (DMA) data and zip code mappings into the system.

## Overview

DMAs (Designated Marketing Areas) are geographic market areas used for television and advertising. Each zip code maps to exactly one DMA.

## Database Schema

- **`dmas` table**: Stores DMA information (code, name, slug, description)
- **`zip_code_dmas` table**: Junction table mapping zip codes to DMAs

## Import Methods

### Method 1: CSV Import (Recommended)

1. **Prepare your CSV file** with the following format:
   ```csv
   zip_code,dma_code,dma_name
   32180,534,ORLANDO-DAYTONA BEACH-MELBOURNE
   32505,686,MOBILE-PENSACOLA
   38281,632,PADUCAH-CAPE GIRARDEAU-HARRISBURG
   ```

2. **Place the CSV file** in one of these locations:
   - `data/dma-mappings.csv` (default)
   - Or set `DMA_CSV_PATH` environment variable to your file path

3. **Run the import script**:
   ```bash
   npm run import:dmas
   ```

### Method 2: Harvard Dataverse API (Future)

The script includes placeholder code for fetching from Harvard Dataverse. To use this:

1. Get an API token from https://dataverse.harvard.edu/
2. Add to `.env.local`:
   ```
   DATAVERSE_API_TOKEN=your_token_here
   ```
3. Run: `npm run import:dmas`

**Note**: The Dataverse API integration needs to be completed based on the actual API structure.

## Getting DMA Data

### Option A: From the R Package

The [zip2dma R package](https://github.com/mmdatasci/zip2dma.git) uses Harvard Dataverse. You can:

1. Use the R package to export data to CSV
2. Format it as described above
3. Import using Method 1

### Option B: Public Sources

Look for public DMA mapping data sources that provide zip code to DMA mappings.

### Option C: Manual Entry

Use the admin interface to manually create DMAs and assign zip codes:
- Navigate to `/admin/directory/locations/dmas`
- Create DMAs
- Edit each DMA to add zip code mappings

## Admin Interface

### Viewing DMAs

Navigate to: `/admin/directory/locations/dmas`

Features:
- Sort by code, name, or zip code count
- Search by code, name, or description
- View zip code count for each DMA

### Managing DMAs

1. **Create/Edit DMA**: Click "Add DMA" or edit an existing one
2. **Add Zip Codes**: 
   - Search for zip codes by entering the zip code
   - Click "Add" to assign to the DMA
3. **Remove Zip Codes**: Click "Remove" next to any assigned zip code

### Viewing Zip Code DMA Assignments

- Zip codes page (`/admin/directory/locations/zip-codes`) now shows the DMA for each zip code
- You can sort by DMA to see all zip codes in a particular DMA

## Data Format Requirements

### CSV Format

- **Header row** (optional): `zip_code,dma_code,dma_name`
- **Data rows**: Three columns separated by commas
- **Zip codes**: Will be normalized (padded with zeros if needed)
- **DMA codes**: Must be integers
- **DMA names**: Full DMA name (e.g., "BURLINGTON-PLATTSBURGH")

### Example CSV

```csv
zip_code,dma_code,dma_name
05061,506,BOSTON
12937,523,BURLINGTON-PLATTSBURGH
03243,506,BOSTON
32180,534,ORLANDO-DAYTONA BEACH-MELBOURNE
32505,686,MOBILE-PENSACOLA
```

## Troubleshooting

### Zip codes not found

If the import script reports "Zip code not found", ensure:
- The zip code exists in your `zip_codes` table
- The zip code format matches (5 digits, padded with zeros)

### Duplicate DMA codes

Each DMA code must be unique. If you get a duplicate error:
- Check if the DMA already exists
- Update the existing DMA instead of creating a new one

### Import script errors

- Check that `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` set
- Ensure the CSV file is properly formatted
- Check that zip codes exist in the database before importing mappings

## Next Steps

After importing:
1. Review DMAs in the admin interface
2. Verify zip code assignments
3. Use DMA data for marketing/analytics features


# DMA Setup Guide - Using the R Package (zip2dma)

This guide walks you through setting up and using the R package to export DMA data.

## Prerequisites

### 1. Install R

**macOS:**
```bash
brew install r
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install r-base
```

**Windows:**
Download from: https://cran.r-project.org/bin/windows/base/

**Verify installation:**
```bash
R --version
```

### 2. Get Dataverse API Token

1. Go to https://dataverse.harvard.edu/
2. Sign up or log in
3. Click on your profile (top right)
4. Go to "API Token" section
5. Click "Create Token"
6. Copy the token

### 3. Set Environment Variable

Add to your `.env.local` file:
```bash
DATAVERSE_API_TOKEN=your_token_here
```

Or export it in your terminal:
```bash
export DATAVERSE_API_TOKEN='your_token_here'
```

## Method 1: Automated Setup (Recommended)

Run the setup script:
```bash
./scripts/setup-r-dma-export.sh
```

This will:
- Check if R is installed
- Install required R packages (devtools, zip2dma)
- Verify your API token is set

Then export the data:
```bash
npm run export:dmas:r
```

Or directly:
```bash
Rscript scripts/export-dmas-from-r.R
```

## Method 2: Manual Setup

### Step 1: Install R Packages

Open R (or RStudio) and run:
```r
# Install devtools if needed
install.packages("devtools")

# Install zip2dma package
devtools::install_github("mmdatasci/zip2dma")
```

### Step 2: Export Data

Run the export script:
```bash
Rscript scripts/export-dmas-from-r.R
```

The script will:
1. Initialize connection to Dataverse (may prompt for API token)
2. Fetch all zip code to DMA mappings
3. Export to `data/dma-mappings.csv`

### Step 3: Import to Database

Once the CSV is created, import it:
```bash
npm run import:dmas
```

## Troubleshooting

### R Not Found

If you get "R not found":
- Make sure R is installed and in your PATH
- Try: `which R` to check installation
- On macOS, you may need to add R to PATH:
  ```bash
  export PATH="/usr/local/bin:$PATH"
  ```

### Package Installation Fails

If `devtools::install_github("mmdatasci/zip2dma")` fails:
- Make sure you have internet connection
- Try installing devtools first: `install.packages("devtools")`
- Check R version: `R --version` (should be 3.6+)

### API Token Issues

If you get token errors:
- Verify token is set: `echo $DATAVERSE_API_TOKEN`
- Make sure token is valid (not expired)
- Try creating a new token at https://dataverse.harvard.edu/

### Interactive Prompt Issues

The zip2dma package may prompt for the API token interactively. If the script hangs:
1. Check the R script output
2. Enter your token when prompted
3. The script will continue automatically

## Alternative: Direct Dataverse API (No R Required)

If you prefer not to use R, you can try fetching directly:

```bash
npm run fetch:dmas
```

This uses the Dataverse API directly. You'll still need:
- `DATAVERSE_API_TOKEN` in `.env.local`
- Optionally: `DATAVERSE_DOI` if you know the dataset DOI

**Note:** This method requires finding the correct dataset DOI in Dataverse.

## Expected Output

After running the export, you should have:
- `data/dma-mappings.csv` with format:
  ```csv
  zip_code,dma_code,dma_name
  32180,534,ORLANDO-DAYTONA BEACH-MELBOURNE
  32505,686,MOBILE-PENSACOLA
  ```

Then import with:
```bash
npm run import:dmas
```

## Next Steps

1. ✅ Export DMA data (using R or direct API)
2. ✅ Import to database: `npm run import:dmas`
3. ✅ Verify in admin: `/admin/directory/locations/dmas`
4. ✅ Check zip code assignments

## Need Help?

- Check the R package docs: https://github.com/mmdatasci/zip2dma
- Dataverse API docs: https://guides.dataverse.org/en/latest/api/
- See `DMA-IMPORT-GUIDE.md` for import details


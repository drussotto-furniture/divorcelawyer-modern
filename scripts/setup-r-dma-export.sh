#!/bin/bash
# Setup script for exporting DMA data from R package
# This script helps set up the R environment and export DMA data

set -e

echo "🚀 Setting up R DMA Export"
echo ""

# Check if R is installed
if ! command -v R &> /dev/null; then
    echo "❌ R is not installed."
    echo ""
    echo "Please install R:"
    echo "  macOS: brew install r"
    echo "  Ubuntu/Debian: sudo apt-get install r-base"
    echo "  Or download from: https://www.r-project.org/"
    exit 1
fi

echo "✅ R is installed: $(R --version | head -1)"
echo ""

# Check for API token
if [ -z "$DATAVERSE_API_TOKEN" ]; then
    echo "⚠️  DATAVERSE_API_TOKEN not set in environment"
    echo ""
    echo "To get an API token:"
    echo "  1. Go to https://dataverse.harvard.edu/"
    echo "  2. Sign up or log in"
    echo "  3. Go to your profile settings"
    echo "  4. Create an API token"
    echo ""
    echo "Then set it:"
    echo "  export DATAVERSE_API_TOKEN='your_token_here'"
    echo ""
    echo "Or add it to your .env.local file and source it:"
    echo "  source .env.local"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ DATAVERSE_API_TOKEN is set"
fi

echo ""
echo "📦 Installing R dependencies..."
echo ""

# Install devtools if needed
Rscript -e "if (!require('devtools', quietly = TRUE)) install.packages('devtools', repos = 'https://cran.rstudio.com/')" 2>&1 | grep -v "^>"

# Install zip2dma package
echo "Installing zip2dma package from GitHub..."
Rscript -e "if (!require('zip2dma', quietly = TRUE)) devtools::install_github('mmdatasci/zip2dma')" 2>&1 | grep -v "^>"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To export DMA data, run:"
echo "  Rscript scripts/export-dmas-from-r.R"
echo ""
echo "Or use the npm script:"
echo "  npm run export:dmas:r"




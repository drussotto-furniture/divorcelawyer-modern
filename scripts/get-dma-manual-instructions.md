# Manual DMA Data Collection

Since the zip2dma package's dataset appears to be unavailable, here are alternative ways to get the data:

## Option 1: Find Alternative Public Dataset

Search for public zip code to DMA mapping data:

1. **Nielsen DMA Data**: Nielsen provides DMA definitions
2. **Census Bureau**: May have zip code to DMA crosswalks
3. **Other Dataverse datasets**: Search for "zip code DMA" or "designated market area"

## Option 2: Use Sample Data + Manual Entry

1. Start with the template: `data/dma-mappings-template.csv`
2. Add more zip codes manually as needed
3. Use admin interface to bulk import

## Option 3: Contact Package Maintainer

The zip2dma package maintainer might know where the dataset moved:
- GitHub: https://github.com/mmdatasci/zip2dma
- Email: matthiasmueller924@gmail.com

## Option 4: Purchase Commercial Data

Commercial providers like:
- Nielsen (they define DMAs)
- Data providers that sell zip-to-DMA mappings

## Quick Start with Template

You can start with just a few DMAs and expand:

1. Use `data/dma-mappings-template.csv` as a starting point
2. Add more zip codes manually
3. Import: `npm run import:dmas`




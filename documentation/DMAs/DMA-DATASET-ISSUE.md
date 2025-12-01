# DMA Dataset Access Issue

## Problem

The zip2dma R package tries to access dataset `doi:10.7910/DVN/IVXEHT` (ID: 2850125) from Harvard Dataverse, but the dataset files appear to be unavailable or deaccessioned.

## Status

- ✅ Dataset metadata exists (published 2016-07-08)
- ❌ Dataset files are not accessible via API
- ❌ No "latest" version available
- ❌ No published version accessible

## Solutions

### Option 1: Contact Package Maintainer

The zip2dma package maintainer may know:
- Where the dataset moved
- Alternative access methods
- Updated dataset location

**Contact**: matthiasmueller924@gmail.com  
**GitHub**: https://github.com/mmdatasci/zip2dma

### Option 2: Find Alternative Source

Search for alternative zip code to DMA mapping datasets:
- Nielsen (they define DMAs)
- Census Bureau crosswalks
- Other Dataverse repositories
- Commercial data providers

### Option 3: Manual Entry

1. Start with template: `data/dma-mappings-template.csv`
2. Add zip codes manually
3. Use admin interface: `/admin/directory/locations/dmas`

### Option 4: Incremental Building

Use the incremental script to query zip codes in batches:
```r
source("scripts/build-dma-mapping-incremental.R")
```

This queries zip codes one batch at a time (slow but works).

### Option 5: Purchase Commercial Data

Commercial providers sell zip-to-DMA mappings:
- Nielsen
- Data providers
- Marketing data companies

## Recommended Next Steps

1. **Try the incremental script** with a small batch to test
2. **Contact the package maintainer** for updated dataset location
3. **Search for alternative datasets** on Dataverse
4. **Start with template CSV** and expand manually as needed

## Current Status

- ✅ Database tables created (migration 043)
- ✅ Admin interface ready
- ✅ Import script ready
- ⏳ Waiting for data source

Once you have a CSV file at `data/dma-mappings.csv`, run:
```bash
npm run import:dmas
```


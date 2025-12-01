#!/bin/bash
# Download DMA file directly using curl

API_TOKEN="a7a73014-0cce-4ab0-b825-c629c6dd7be8"
DATASET_ID="2850125"
PERSISTENT_ID="doi:10.7910/DVN/IVXEHT"
FILE_NAME="DMA-zip.tab"

echo "Fetching dataset metadata..."

# Get dataset info
DATASET_INFO=$(curl -s -H "X-Dataverse-key: $API_TOKEN" \
  "https://dataverse.harvard.edu/api/datasets/:persistentId?persistentId=$PERSISTENT_ID")

echo "$DATASET_INFO" | python3 -m json.tool | grep -E '"versionState"|"versionNumber"|"id"' | head -10

# Try to get files from version 1.0 (published)
echo ""
echo "Trying to get files from published version..."
FILES=$(curl -s -H "X-Dataverse-key: $API_TOKEN" \
  "https://dataverse.harvard.edu/api/datasets/$DATASET_ID/versions/1.0/files")

echo "$FILES" | python3 -m json.tool | head -100

# Try to find and download the file
FILE_ID=$(echo "$FILES" | python3 -c "import sys, json; data=json.load(sys.stdin); files=data.get('data', []); [print(f['dataFile']['id']) for f in files if '$FILE_NAME' in f.get('label', '')]" 2>/dev/null | head -1)

if [ ! -z "$FILE_ID" ]; then
  echo ""
  echo "Found file ID: $FILE_ID"
  echo "Downloading..."
  
  mkdir -p data
  curl -s -H "X-Dataverse-key: $API_TOKEN" \
    "https://dataverse.harvard.edu/api/access/datafile/$FILE_ID" \
    -o data/dma-zip.tab
    
  if [ -f data/dma-zip.tab ]; then
    echo "✅ Downloaded to data/dma-zip.tab"
    echo "File size: $(wc -l < data/dma-zip.tab) lines"
  fi
else
  echo "Could not find file ID automatically"
  echo "Files available:"
  echo "$FILES" | python3 -c "import sys, json; data=json.load(sys.stdin); files=data.get('data', []); [print(f.get('label', 'Unknown')) for f in files]" 2>/dev/null
fi




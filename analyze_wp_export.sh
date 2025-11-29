#!/bin/bash

XML_FILE="public/divorcelawyercom.WordPress.2025-11-27.xml"

echo "=== WordPress Export Analysis ==="
echo ""
echo "Content Type Counts:"
echo "===================="
grep "<wp:post_type>" "$XML_FILE" | sort | uniq -c | sort -rn

echo ""
echo "Post Status Counts:"
echo "==================="
grep "<wp:status>" "$XML_FILE" | sort | uniq -c | sort -rn

echo ""
echo "Total Items:"
echo "============"
grep -c "<item>" "$XML_FILE"

echo ""
echo "Authors:"
echo "========"
grep "<dc:creator>" "$XML_FILE" | sort | uniq -c | sort -rn | head -20

echo ""
echo "Published Posts by Type:"
echo "========================"
# Count published items by type
awk '/<item>/,/<\/item>/ {content = content $0 "\n"} /<\/item>/ {if (content ~ /<wp:status><!\[CDATA\[publish\]\]><\/wp:status>/) {match(content, /<wp:post_type><!\[CDATA\[([^\]]+)\]\]><\/wp:post_type>/, arr); types[arr[1]]++} content=""}END{for (type in types) print types[type], type}' "$XML_FILE" | sort -rn

#!/usr/bin/env python3
"""
Extract all zip codes from WordPress XML export
This script extracts all zip codes (not just 100 sample) to output/zip_codes.json
"""

import xml.etree.ElementTree as ET
import json
from pathlib import Path

XML_FILE = 'public/divorcelawyercom.WordPress.2025-11-27.xml'
OUTPUT_FILE = 'output/zip_codes.json'

def extract_zip_codes():
    print(f"Extracting zip codes from {XML_FILE}...")
    print("This may take a few minutes for 40,954 zip codes...")
    
    zip_codes = []
    item_count = 0
    zip_count = 0
    
    # Use iterparse for large files
    context = ET.iterparse(XML_FILE, events=('start', 'end'))
    context = iter(context)
    event, root = next(context)
    
    for event, elem in context:
        if event == 'end' and elem.tag == 'item':
            item_count += 1
            if item_count % 5000 == 0:
                print(f"  Processed {item_count} items, found {zip_count} zip codes...")
            
            # Check if this is a zip_code post type
            post_type = None
            title = None
            post_name = None
            post_id = None
            meta = {}
            
            for child in elem:
                if child.tag.endswith('post_type'):
                    post_type = child.text
                elif child.tag.endswith('title'):
                    title = child.text
                elif child.tag.endswith('post_name'):
                    post_name = child.text
                elif child.tag.endswith('post_id'):
                    post_id = child.text
                elif child.tag.endswith('postmeta'):
                    meta_key = None
                    meta_value = None
                    for meta_child in child:
                        if meta_child.tag.endswith('meta_key'):
                            meta_key = meta_child.text
                        elif meta_child.tag.endswith('meta_value'):
                            meta_value = meta_child.text
                    if meta_key:
                        meta[meta_key] = meta_value
            
            if post_type == 'zip_code' and title:
                zip_codes.append({
                    'title': title,
                    'post_id': post_id,
                    'post_name': post_name or title.lower().replace(' ', '-'),
                    'post_type': post_type,
                    'meta': meta
                })
                zip_count += 1
            
            # Clear element to save memory
            elem.clear()
            root.clear()
    
    print(f"\n✓ Found {zip_count} zip codes")
    
    # Save to JSON
    output_path = Path(OUTPUT_FILE)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(zip_codes, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved to {OUTPUT_FILE}")
    print(f"  Total zip codes: {len(zip_codes)}")
    
    return zip_codes

if __name__ == '__main__':
    extract_zip_codes()




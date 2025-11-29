#!/usr/bin/env python3
"""
WordPress XML Parser for DivorceLawyer.com Migration

This script parses the WordPress XML export and extracts structured data
for migration to Supabase/PostgreSQL.

Usage:
    python parse-wordpress-xml.py

Output:
    - JSON files for each content type in ./output/ directory
    - CSV files for bulk import
    - Redirect mapping file
"""

import xml.etree.ElementTree as ET
import json
import csv
import re
from collections import defaultdict
from pathlib import Path
from datetime import datetime
import html

# WordPress XML namespaces
NAMESPACES = {
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'wfw': 'http://wellformedweb.org/CommentAPI/',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'wp': 'http://wordpress.org/export/1.2/'
}

class WordPressParser:
    def __init__(self, xml_file):
        self.xml_file = xml_file
        self.tree = None
        self.root = None
        self.items = []
        self.output_dir = Path('./output')
        self.output_dir.mkdir(exist_ok=True)

        # Data collections
        self.states = []
        self.counties = []
        self.cities = []
        self.zip_codes = []
        self.articles = []
        self.article_categories = []
        self.videos = []
        self.questions = []
        self.lawyers = []
        self.law_firms = []
        self.stages = []
        self.emotions = []
        self.team_members = []
        self.pages = []
        self.posts = []

    def parse(self):
        """Parse the XML file"""
        print(f"Parsing {self.xml_file}...")
        print("This may take a few minutes for large files...")

        # Use iterparse for large files
        context = ET.iterparse(self.xml_file, events=('start', 'end'))
        context = iter(context)
        event, root = next(context)

        self.root = root
        item_count = 0

        for event, elem in context:
            if event == 'end' and elem.tag == 'item':
                item_count += 1
                if item_count % 5000 == 0:
                    print(f"Processed {item_count} items...")

                item_data = self.parse_item(elem)
                if item_data:
                    self.items.append(item_data)
                    self.categorize_item(item_data)

                # Clear element to save memory
                elem.clear()
                root.clear()

        print(f"✓ Parsed {item_count} total items")
        return self.items

    def parse_item(self, item):
        """Parse a single item element"""
        data = {}

        # Basic fields
        data['title'] = self.get_text(item, 'title')
        data['link'] = self.get_text(item, 'link')
        data['pubDate'] = self.get_text(item, 'pubDate')
        data['creator'] = self.get_text(item, 'dc:creator')
        data['content'] = self.get_text(item, 'content:encoded')
        data['excerpt'] = self.get_text(item, 'excerpt:encoded')

        # WordPress specific fields
        data['post_id'] = self.get_text(item, 'wp:post_id')
        data['post_date'] = self.get_text(item, 'wp:post_date')
        data['post_date_gmt'] = self.get_text(item, 'wp:post_date_gmt')
        data['post_modified'] = self.get_text(item, 'wp:post_modified')
        data['post_modified_gmt'] = self.get_text(item, 'wp:post_modified_gmt')
        data['post_name'] = self.get_text(item, 'wp:post_name')
        data['post_type'] = self.get_text(item, 'wp:post_type')
        data['status'] = self.get_text(item, 'wp:status')
        data['post_parent'] = self.get_text(item, 'wp:post_parent')

        # Parse post meta
        data['meta'] = self.parse_postmeta(item)

        return data

    def get_text(self, elem, tag):
        """Get text content from element with namespace support"""
        for ns_prefix, ns_uri in NAMESPACES.items():
            tag_with_ns = tag.replace(f'{ns_prefix}:', f'{{{ns_uri}}}')
            found = elem.find(tag_with_ns)
            if found is not None:
                return found.text or ''

        # Try without namespace
        found = elem.find(tag)
        if found is not None:
            return found.text or ''

        return ''

    def parse_postmeta(self, item):
        """Parse post meta fields"""
        meta = {}
        postmeta_elements = item.findall('wp:postmeta', NAMESPACES)

        for postmeta in postmeta_elements:
            key = self.get_text(postmeta, 'wp:meta_key')
            value = self.get_text(postmeta, 'wp:meta_value')
            if key and key not in meta:  # Skip duplicate keys
                meta[key] = value

        return meta

    def categorize_item(self, item):
        """Categorize item by post type"""
        post_type = item.get('post_type', '')
        status = item.get('status', '')

        # Only process published items (except attachments which are 'inherit')
        if status not in ['publish', 'inherit'] and post_type != 'attachment':
            return

        if post_type == 'state':
            self.states.append(item)
        elif post_type == 'county':
            self.counties.append(item)
        elif post_type == 'city':
            self.cities.append(item)
        elif post_type == 'zip_code':
            self.zip_codes.append(item)
        elif post_type == 'articles':
            self.articles.append(item)
        elif post_type == 'articlecategories':
            self.article_categories.append(item)
        elif post_type == 'videos':
            self.videos.append(item)
        elif post_type == 'questions':
            self.questions.append(item)
        elif post_type == 'lawyer':
            self.lawyers.append(item)
        elif post_type == 'law_firm':
            self.law_firms.append(item)
        elif post_type == 'stages':
            self.stages.append(item)
        elif post_type == 'emotions':
            self.emotions.append(item)
        elif post_type == 'teammembers':
            self.team_members.append(item)
        elif post_type == 'page':
            self.pages.append(item)
        elif post_type == 'post':
            self.posts.append(item)

    def export_json(self):
        """Export all data to JSON files"""
        exports = {
            'states': self.states,
            'counties': self.counties,
            'cities': self.cities[:100],  # Sample first 100 cities due to size
            'zip_codes': self.zip_codes,  # Export all zip codes (40,954 total)
            'articles': self.articles,
            'article_categories': self.article_categories,
            'videos': self.videos,
            'questions': self.questions,
            'lawyers': self.lawyers,
            'law_firms': self.law_firms,
            'stages': self.stages,
            'emotions': self.emotions,
            'team_members': self.team_members,
            'pages': self.pages,
            'posts': self.posts,
        }

        for name, data in exports.items():
            if data:
                output_file = self.output_dir / f'{name}.json'
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"✓ Exported {len(data)} {name} to {output_file}")

    def export_csv_simple(self, data, filename, fields):
        """Export data to CSV with specified fields"""
        if not data:
            return

        output_file = self.output_dir / filename
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()

            for item in data:
                row = {}
                for field in fields:
                    if field == 'slug':
                        row[field] = item.get('post_name', '')
                    elif field == 'name':
                        row[field] = item.get('title', '')
                    elif field in item:
                        row[field] = item[field]
                    elif field in item.get('meta', {}):
                        row[field] = item['meta'][field]
                    else:
                        row[field] = ''
                writer.writerow(row)

        print(f"✓ Exported {len(data)} items to {output_file}")

    def generate_redirects(self):
        """Generate redirect mapping CSV"""
        redirects = []

        # Add redirects for all content types
        for item in self.items:
            old_url = item.get('link', '')
            post_type = item.get('post_type', '')
            slug = item.get('post_name', '')

            if not old_url or not slug:
                continue

            # Determine new URL based on post type
            new_url = self.get_new_url(post_type, slug, item)

            if new_url and old_url != new_url:
                redirects.append({
                    'old_url': old_url,
                    'new_url': new_url,
                    'status_code': 301,
                    'post_type': post_type
                })

        # Export redirects
        output_file = self.output_dir / 'redirects.csv'
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['old_url', 'new_url', 'status_code', 'post_type'])
            writer.writeheader()
            writer.writerows(redirects)

        print(f"✓ Generated {len(redirects)} redirects to {output_file}")

    def get_new_url(self, post_type, slug, item):
        """Determine new URL based on post type"""
        base_url = 'https://www.divorcelawyer.com'

        if post_type == 'articles':
            return f'{base_url}/articles/{slug}'
        elif post_type == 'videos':
            return f'{base_url}/videos/{slug}'
        elif post_type == 'lawyer':
            return f'{base_url}/lawyers/{slug}'
        elif post_type == 'law_firm':
            return f'{base_url}/law-firms/{slug}'
        elif post_type == 'page':
            return f'{base_url}/{slug}'
        elif post_type == 'post':
            return f'{base_url}/blog/{slug}'
        # Location pages - would need actual URL structure from site
        # For now, return None to skip
        return None

    def generate_summary(self):
        """Generate a summary report"""
        summary = {
            'total_items': len(self.items),
            'content_types': {
                'states': len(self.states),
                'counties': len(self.counties),
                'cities': len(self.cities),
                'zip_codes': len(self.zip_codes),
                'articles': len(self.articles),
                'article_categories': len(self.article_categories),
                'videos': len(self.videos),
                'questions': len(self.questions),
                'lawyers': len(self.lawyers),
                'law_firms': len(self.law_firms),
                'stages': len(self.stages),
                'emotions': len(self.emotions),
                'team_members': len(self.team_members),
                'pages': len(self.pages),
                'posts': len(self.posts),
            },
            'parsed_at': datetime.now().isoformat()
        }

        output_file = self.output_dir / 'summary.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2)

        print("\n" + "="*50)
        print("MIGRATION SUMMARY")
        print("="*50)
        print(f"Total items: {summary['total_items']}")
        print("\nContent Types:")
        for content_type, count in summary['content_types'].items():
            if count > 0:
                print(f"  {content_type:20} {count:>6}")
        print("="*50)

        return summary


def main():
    xml_file = 'public/divorcelawyercom.WordPress.2025-11-27.xml'

    print("WordPress to Next.js Migration Parser")
    print("="*50)

    parser = WordPressParser(xml_file)

    # Parse XML
    parser.parse()

    # Export data
    print("\nExporting data...")
    parser.export_json()

    # Export specific CSV files for easy import
    print("\nExporting CSV files...")
    parser.export_csv_simple(
        parser.states,
        'states.csv',
        ['post_id', 'name', 'slug', 'content']
    )

    # Generate redirects
    print("\nGenerating redirects...")
    parser.generate_redirects()

    # Generate summary
    parser.generate_summary()

    print("\n✓ Migration data export complete!")
    print(f"Output directory: {parser.output_dir.absolute()}")


if __name__ == '__main__':
    main()

/**
 * WordPress Content Analysis Script
 * Analyzes exported WordPress content and generates insights
 */

import * as fs from 'fs';
import * as path from 'path';

const EXPORT_DIR = path.join(process.cwd(), 'wordpress-export');

interface AnalysisReport {
  overview: {
    totalPosts: number;
    totalPages: number;
    totalMedia: number;
    totalUsers: number;
    totalCategories: number;
    totalTags: number;
  };
  posts: {
    statusBreakdown: { [status: string]: number };
    authorsBreakdown: { [author: string]: number };
    categoriesBreakdown: { [category: string]: number };
    averageContentLength: number;
    oldestPost: string;
    newestPost: string;
  };
  pages: {
    statusBreakdown: { [status: string]: number };
    hierarchy: any[];
    averageContentLength: number;
  };
  media: {
    typeBreakdown: { [type: string]: number };
    totalSize: string;
    mostUsedImages: any[];
  };
  urlStructure: {
    samplePostUrls: string[];
    samplePageUrls: string[];
    urlPatterns: string[];
  };
  seo: {
    hasYoastData: boolean;
    metaDescriptions: number;
    focusKeywords: number;
  };
  customPostTypes: { [type: string]: number };
  recommendations: string[];
}

function loadJSON(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function analyzeContent(): AnalysisReport {
  console.log('='.repeat(60));
  console.log('WordPress Content Analysis');
  console.log('='.repeat(60));
  console.log('');

  const posts = loadJSON(path.join(EXPORT_DIR, 'posts', 'all-posts.json')) || [];
  const pages = loadJSON(path.join(EXPORT_DIR, 'pages', 'all-pages.json')) || [];
  const media = loadJSON(path.join(EXPORT_DIR, 'media', 'all-media.json')) || [];
  const users = loadJSON(path.join(EXPORT_DIR, 'users', 'all-users.json')) || [];
  const categories = loadJSON(path.join(EXPORT_DIR, 'taxonomies', 'categories.json')) || [];
  const tags = loadJSON(path.join(EXPORT_DIR, 'taxonomies', 'tags.json')) || [];
  const summary = loadJSON(path.join(EXPORT_DIR, 'export-summary.json'));

  const report: AnalysisReport = {
    overview: {
      totalPosts: posts.length,
      totalPages: pages.length,
      totalMedia: media.length,
      totalUsers: users.length,
      totalCategories: categories.length,
      totalTags: tags.length,
    },
    posts: {
      statusBreakdown: {},
      authorsBreakdown: {},
      categoriesBreakdown: {},
      averageContentLength: 0,
      oldestPost: '',
      newestPost: '',
    },
    pages: {
      statusBreakdown: {},
      hierarchy: [],
      averageContentLength: 0,
    },
    media: {
      typeBreakdown: {},
      totalSize: 'N/A',
      mostUsedImages: [],
    },
    urlStructure: {
      samplePostUrls: [],
      samplePageUrls: [],
      urlPatterns: [],
    },
    seo: {
      hasYoastData: false,
      metaDescriptions: 0,
      focusKeywords: 0,
    },
    customPostTypes: summary?.customPostTypes || {},
    recommendations: [],
  };

  // Analyze Posts
  if (posts.length > 0) {
    console.log('📝 Analyzing Posts...');

    let totalContentLength = 0;
    posts.forEach((post: any) => {
      // Status breakdown
      report.posts.statusBreakdown[post.status] = (report.posts.statusBreakdown[post.status] || 0) + 1;

      // Authors breakdown
      const authorName = users.find((u: any) => u.id === post.author)?.name || `Author ${post.author}`;
      report.posts.authorsBreakdown[authorName] = (report.posts.authorsBreakdown[authorName] || 0) + 1;

      // Content length
      const contentText = stripHtml(post.content.rendered);
      totalContentLength += contentText.length;

      // Categories
      post.categories.forEach((catId: number) => {
        const catName = categories.find((c: any) => c.id === catId)?.name || `Category ${catId}`;
        report.posts.categoriesBreakdown[catName] = (report.posts.categoriesBreakdown[catName] || 0) + 1;
      });

      // SEO data
      if (post.yoast_head_json) {
        report.seo.hasYoastData = true;
        if (post.yoast_head_json.description) report.seo.metaDescriptions++;
        if (post.yoast_head_json.keywords) report.seo.focusKeywords++;
      }
    });

    report.posts.averageContentLength = Math.round(totalContentLength / posts.length);

    // Date range
    const sortedPosts = [...posts].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    report.posts.oldestPost = sortedPosts[0]?.date || 'N/A';
    report.posts.newestPost = sortedPosts[sortedPosts.length - 1]?.date || 'N/A';

    // Sample URLs
    report.urlStructure.samplePostUrls = posts.slice(0, 5).map((p: any) => p.link);
  }

  // Analyze Pages
  if (pages.length > 0) {
    console.log('📄 Analyzing Pages...');

    let totalContentLength = 0;
    pages.forEach((page: any) => {
      // Status breakdown
      report.pages.statusBreakdown[page.status] = (report.pages.statusBreakdown[page.status] || 0) + 1;

      // Content length
      const contentText = stripHtml(page.content.rendered);
      totalContentLength += contentText.length;

      // SEO data
      if (page.yoast_head_json) {
        report.seo.hasYoastData = true;
        if (page.yoast_head_json.description) report.seo.metaDescriptions++;
      }
    });

    report.pages.averageContentLength = Math.round(totalContentLength / pages.length);

    // Build page hierarchy
    const rootPages = pages.filter((p: any) => p.parent === 0);
    report.pages.hierarchy = rootPages.map((p: any) => ({
      id: p.id,
      title: p.title.rendered,
      slug: p.slug,
      children: pages.filter((child: any) => child.parent === p.id).length,
    }));

    // Sample URLs
    report.urlStructure.samplePageUrls = pages.slice(0, 5).map((p: any) => p.link);
  }

  // Analyze Media
  if (media.length > 0) {
    console.log('🖼️  Analyzing Media...');

    media.forEach((item: any) => {
      const mimeType = item.mime_type || 'unknown';
      report.media.typeBreakdown[mimeType] = (report.media.typeBreakdown[mimeType] || 0) + 1;
    });
  }

  // URL Patterns
  console.log('🔗 Analyzing URL Structure...');
  const allUrls = [...posts.map((p: any) => p.link), ...pages.map((p: any) => p.link)];
  const urlPatterns = new Set<string>();

  allUrls.forEach(url => {
    try {
      const path = new URL(url).pathname;
      const parts = path.split('/').filter(Boolean);

      if (parts.length > 0) {
        // Check for date patterns
        if (/^\d{4}$/.test(parts[0])) {
          urlPatterns.add('/YYYY/MM/DD/post-name/ (Date-based)');
        } else if (parts.length === 1) {
          urlPatterns.add('/post-name/ (Simple)');
        } else {
          urlPatterns.add(`/${parts[0]}/... (Category or custom structure)`);
        }
      }
    } catch (error) {
      // Invalid URL
    }
  });

  report.urlStructure.urlPatterns = Array.from(urlPatterns);

  // Recommendations
  console.log('💡 Generating Recommendations...');

  if (posts.length > 50) {
    report.recommendations.push('Consider implementing pagination or infinite scroll for blog posts');
  }

  if (media.length > 100) {
    report.recommendations.push('Use Supabase Storage or Cloudinary for optimized image delivery');
    report.recommendations.push('Implement image optimization with Next.js Image component');
  }

  if (report.seo.hasYoastData) {
    report.recommendations.push('Migrate Yoast SEO metadata to Next.js metadata API');
  }

  if (Object.keys(report.customPostTypes).length > 0) {
    report.recommendations.push(`Design Supabase schema for custom post types: ${Object.keys(report.customPostTypes).join(', ')}`);
  }

  if (categories.length > 0) {
    report.recommendations.push('Implement category filtering and navigation');
  }

  if (pages.some((p: any) => p.parent !== 0)) {
    report.recommendations.push('Preserve page hierarchy in new site structure');
  }

  report.recommendations.push('Set up 301 redirects to preserve SEO rankings');
  report.recommendations.push('Implement static generation (ISR) for better performance');
  report.recommendations.push('Set up Supabase auth if user accounts are needed');

  // Save report
  const reportPath = path.join(EXPORT_DIR, 'analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // Print report
  console.log('\n' + '='.repeat(60));
  console.log('📊 Analysis Report');
  console.log('='.repeat(60));
  console.log('\n🎯 OVERVIEW');
  console.log(`  Posts: ${report.overview.totalPosts}`);
  console.log(`  Pages: ${report.overview.totalPages}`);
  console.log(`  Media: ${report.overview.totalMedia}`);
  console.log(`  Users: ${report.overview.totalUsers}`);
  console.log(`  Categories: ${report.overview.totalCategories}`);
  console.log(`  Tags: ${report.overview.totalTags}`);

  if (posts.length > 0) {
    console.log('\n📝 POSTS');
    console.log(`  Status: ${Object.entries(report.posts.statusBreakdown).map(([k, v]) => `${k}(${v})`).join(', ')}`);
    console.log(`  Average Length: ${report.posts.averageContentLength} characters`);
    console.log(`  Date Range: ${report.posts.oldestPost.split('T')[0]} to ${report.posts.newestPost.split('T')[0]}`);
    console.log(`  Top Authors: ${Object.entries(report.posts.authorsBreakdown).slice(0, 3).map(([k, v]) => `${k}(${v})`).join(', ')}`);
    console.log(`  Top Categories: ${Object.entries(report.posts.categoriesBreakdown).slice(0, 3).map(([k, v]) => `${k}(${v})`).join(', ')}`);
  }

  if (pages.length > 0) {
    console.log('\n📄 PAGES');
    console.log(`  Status: ${Object.entries(report.pages.statusBreakdown).map(([k, v]) => `${k}(${v})`).join(', ')}`);
    console.log(`  Root Pages: ${report.pages.hierarchy.length}`);
    console.log(`  Average Length: ${report.pages.averageContentLength} characters`);
  }

  if (media.length > 0) {
    console.log('\n🖼️  MEDIA');
    Object.entries(report.media.typeBreakdown).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }

  if (report.urlStructure.urlPatterns.length > 0) {
    console.log('\n🔗 URL PATTERNS');
    report.urlStructure.urlPatterns.forEach(pattern => {
      console.log(`  ${pattern}`);
    });
  }

  if (report.seo.hasYoastData) {
    console.log('\n🔍 SEO');
    console.log(`  Yoast Data: Yes`);
    console.log(`  Meta Descriptions: ${report.seo.metaDescriptions}`);
    console.log(`  Focus Keywords: ${report.seo.focusKeywords}`);
  }

  if (Object.keys(report.customPostTypes).length > 0) {
    console.log('\n📦 CUSTOM POST TYPES');
    Object.entries(report.customPostTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }

  console.log('\n💡 RECOMMENDATIONS');
  report.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📁 Full report saved to: ${reportPath}`);
  console.log('='.repeat(60));

  return report;
}

analyzeContent();

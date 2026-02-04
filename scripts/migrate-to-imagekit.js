// ============================================================================
// IMAGE MIGRATION SCRIPT: Google Drive → ImageKit (WITH DEDUPLICATION)
// ============================================================================
//
// This script:
// 1. Fetches all image URLs from Supabase (categories, sub-categories, products)
// 2. Collects UNIQUE Google Drive URLs (deduplication)
// 3. Downloads & uploads each unique URL ONCE
// 4. Generates CSV mapping file for manual Supabase update
//
// Usage:
//   npm run migrate:images
//
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Supabase credentials (use service role key for full access)
  SUPABASE_URL: 'https://tlczvpepvxmsrlexzurj.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsY3p2cGVwdnhtc3JsZXh6dXJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4MTQyMiwiZXhwIjoyMDc2NDU3NDIyfQ.mYopqzMYd7KVRCGrFAUBdzgZqyNJmx1SRebeLjsEgd8',

  // ImageKit credentials
  IMAGEKIT_PRIVATE_KEY: 'private_1CDzNa8xgXrvNNhij3ULPbSMEPo=',
  IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/fq27eon0z',

  // Single folder for all migrated images (easier to manage)
  IMAGEKIT_FOLDER: 'threadcart/migrated',

  // Output file
  OUTPUT_DIR: path.join(__dirname, '../migration-output'),

  // Delay between uploads (ms) to avoid rate limiting
  UPLOAD_DELAY: 500,
};

// ============================================================================
// HELPERS
// ============================================================================

function isGoogleDriveUrl(url) {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('googleusercontent.com');
}

function extractFileId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

// ============================================================================
// GOOGLE DRIVE DOWNLOAD
// ============================================================================

async function downloadFromGoogleDrive(fileId) {
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

  const response = await fetch(thumbnailUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: arrayBuffer,
    contentType: response.headers.get('content-type') || 'image/jpeg',
  };
}

// ============================================================================
// IMAGEKIT UPLOAD
// ============================================================================

async function uploadToImageKit(imageData, fileName) {
  const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';

  const base64 = arrayBufferToBase64(imageData.buffer);
  const base64WithPrefix = `data:${imageData.contentType};base64,${base64}`;

  const formData = new FormData();
  formData.append('file', base64WithPrefix);
  formData.append('fileName', fileName);
  formData.append('folder', CONFIG.IMAGEKIT_FOLDER);
  formData.append('useUniqueFileName', 'false');

  const authHeader = 'Basic ' + btoa(CONFIG.IMAGEKIT_PRIVATE_KEY + ':');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Authorization': authHeader },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.url;
}

// ============================================================================
// MAIN MIGRATION
// ============================================================================

async function runMigration() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   IMAGE MIGRATION: Google Drive → ImageKit (DEDUPLICATED)        ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // Create output directory
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  // Initialize Supabase
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

  // ========================================================================
  // STEP 1: COLLECT ALL DATA
  // ========================================================================
  console.log('📥 STEP 1: Fetching all data from Supabase...\n');

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, image_url')
    .order('sort_number');

  const { data: subCategories, error: subCatError } = await supabase
    .from('sub-categories')
    .select('id, name, image_url')
    .order('sort_number');

  const { data: products, error: prodError } = await supabase
    .from('product')
    .select('id, name, image_url')
    .order('sort_number');

  if (catError || subCatError || prodError) {
    console.error('Error fetching data:', catError || subCatError || prodError);
    process.exit(1);
  }

  console.log(`   Categories:     ${categories.length}`);
  console.log(`   Sub-Categories: ${subCategories.length}`);
  console.log(`   Products:       ${products.length}`);

  // ========================================================================
  // STEP 2: COLLECT UNIQUE GOOGLE DRIVE URLs
  // ========================================================================
  console.log('\n🔍 STEP 2: Collecting unique Google Drive URLs...\n');

  const uniqueUrls = new Map(); // Map<googleDriveUrl, { fileId, usedIn: [] }>

  // From categories
  for (const cat of categories) {
    if (isGoogleDriveUrl(cat.image_url)) {
      const fileId = extractFileId(cat.image_url);
      if (fileId && !uniqueUrls.has(cat.image_url)) {
        uniqueUrls.set(cat.image_url, { fileId, usedIn: [] });
      }
      if (fileId) {
        uniqueUrls.get(cat.image_url).usedIn.push(`category:${cat.id}`);
      }
    }
  }

  // From sub-categories
  for (const subCat of subCategories) {
    if (isGoogleDriveUrl(subCat.image_url)) {
      const fileId = extractFileId(subCat.image_url);
      if (fileId && !uniqueUrls.has(subCat.image_url)) {
        uniqueUrls.set(subCat.image_url, { fileId, usedIn: [] });
      }
      if (fileId) {
        uniqueUrls.get(subCat.image_url).usedIn.push(`subcategory:${subCat.id}`);
      }
    }
  }

  // From products (array of URLs)
  for (const product of products) {
    if (product.image_url && Array.isArray(product.image_url)) {
      for (const url of product.image_url) {
        if (isGoogleDriveUrl(url)) {
          const fileId = extractFileId(url);
          if (fileId && !uniqueUrls.has(url)) {
            uniqueUrls.set(url, { fileId, usedIn: [] });
          }
          if (fileId) {
            uniqueUrls.get(url).usedIn.push(`product:${product.id}`);
          }
        }
      }
    }
  }

  console.log(`   Found ${uniqueUrls.size} UNIQUE Google Drive URLs`);

  // Show some stats about reuse
  let reusedCount = 0;
  for (const [url, data] of uniqueUrls) {
    if (data.usedIn.length > 1) {
      reusedCount++;
    }
  }
  console.log(`   URLs used multiple times: ${reusedCount}`);

  // ========================================================================
  // STEP 3: MIGRATE UNIQUE URLs (DOWNLOAD & UPLOAD ONCE)
  // ========================================================================
  console.log('\n🚀 STEP 3: Migrating unique URLs to ImageKit...\n');

  const urlMapping = new Map(); // Map<googleDriveUrl, imagekitUrl>
  const failedUrls = new Map(); // Map<googleDriveUrl, errorMessage>

  let current = 0;
  const total = uniqueUrls.size;

  for (const [googleUrl, data] of uniqueUrls) {
    current++;
    const progress = `[${current}/${total}]`;

    console.log(`${progress} Processing: ${data.fileId}`);
    console.log(`        Used in: ${data.usedIn.length} place(s)`);

    try {
      // Download from Google Drive
      console.log(`        Downloading...`);
      const imageData = await downloadFromGoogleDrive(data.fileId);

      // Upload to ImageKit (use fileId as filename for consistency)
      console.log(`        Uploading to ImageKit...`);
      const fileName = `${data.fileId}.jpg`;
      const imagekitUrl = await uploadToImageKit(imageData, fileName);

      urlMapping.set(googleUrl, imagekitUrl);
      console.log(`        ✅ Done: ${imagekitUrl}\n`);

    } catch (error) {
      console.log(`        ❌ Failed: ${error.message}\n`);
      failedUrls.set(googleUrl, error.message);
      urlMapping.set(googleUrl, googleUrl); // Keep original on failure
    }

    await delay(CONFIG.UPLOAD_DELAY);
  }

  // ========================================================================
  // STEP 4: GENERATE CSV WITH MAPPING
  // ========================================================================
  console.log('\n📄 STEP 4: Generating CSV files...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // ----- CSV 1: URL Mapping (unique URLs) -----
  const mappingRows = [['Google Drive URL', 'ImageKit URL', 'File ID', 'Used In (count)', 'Status']];

  for (const [googleUrl, data] of uniqueUrls) {
    const imagekitUrl = urlMapping.get(googleUrl) || googleUrl;
    const status = failedUrls.has(googleUrl) ? `FAILED: ${failedUrls.get(googleUrl)}` : 'SUCCESS';
    mappingRows.push([
      `"${googleUrl}"`,
      `"${imagekitUrl}"`,
      data.fileId,
      data.usedIn.length,
      status
    ]);
  }

  const mappingCsv = mappingRows.map(row => row.join(',')).join('\n');
  const mappingPath = path.join(CONFIG.OUTPUT_DIR, `url-mapping-${timestamp}.csv`);
  fs.writeFileSync(mappingPath, mappingCsv, 'utf8');
  console.log(`   ✅ URL Mapping: ${mappingPath}`);

  // ----- CSV 2: Categories -----
  const catRows = [['ID', 'Name', 'Old URL', 'New URL']];
  for (const cat of categories) {
    const newUrl = urlMapping.get(cat.image_url) || cat.image_url;
    catRows.push([
      cat.id,
      `"${cat.name.replace(/"/g, '""')}"`,
      `"${cat.image_url}"`,
      `"${newUrl}"`
    ]);
  }
  const catCsv = catRows.map(row => row.join(',')).join('\n');
  const catPath = path.join(CONFIG.OUTPUT_DIR, `categories-${timestamp}.csv`);
  fs.writeFileSync(catPath, catCsv, 'utf8');
  console.log(`   ✅ Categories:  ${catPath}`);

  // ----- CSV 3: Sub-Categories -----
  const subCatRows = [['ID', 'Name', 'Old URL', 'New URL']];
  for (const subCat of subCategories) {
    const newUrl = urlMapping.get(subCat.image_url) || subCat.image_url;
    subCatRows.push([
      subCat.id,
      `"${subCat.name.replace(/"/g, '""')}"`,
      `"${subCat.image_url}"`,
      `"${newUrl}"`
    ]);
  }
  const subCatCsv = subCatRows.map(row => row.join(',')).join('\n');
  const subCatPath = path.join(CONFIG.OUTPUT_DIR, `subcategories-${timestamp}.csv`);
  fs.writeFileSync(subCatPath, subCatCsv, 'utf8');
  console.log(`   ✅ SubCategories: ${subCatPath}`);

  // ----- CSV 4: Products -----
  const prodRows = [['ID', 'Name', 'Old URLs (JSON)', 'New URLs (JSON)']];
  for (const product of products) {
    if (product.image_url && Array.isArray(product.image_url)) {
      const newUrls = product.image_url.map(url => urlMapping.get(url) || url);
      prodRows.push([
        product.id,
        `"${product.name.replace(/"/g, '""')}"`,
        `"${JSON.stringify(product.image_url).replace(/"/g, '""')}"`,
        `"${JSON.stringify(newUrls).replace(/"/g, '""')}"`
      ]);
    }
  }
  const prodCsv = prodRows.map(row => row.join(',')).join('\n');
  const prodPath = path.join(CONFIG.OUTPUT_DIR, `products-${timestamp}.csv`);
  fs.writeFileSync(prodPath, prodCsv, 'utf8');
  console.log(`   ✅ Products:    ${prodPath}`);

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`📊 Unique URLs found:     ${uniqueUrls.size}`);
  console.log(`✅ Successfully migrated: ${uniqueUrls.size - failedUrls.size}`);
  console.log(`❌ Failed:                ${failedUrls.size}`);
  console.log(`💾 Storage saved:         ${reusedCount} duplicate uploads avoided`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  if (failedUrls.size > 0) {
    console.log('Failed URLs:');
    for (const [url, error] of failedUrls) {
      console.log(`  - ${extractFileId(url)}: ${error}`);
    }
    console.log('');
  }

  console.log('📁 OUTPUT FILES:');
  console.log(`   1. ${mappingPath}`);
  console.log(`   2. ${catPath}`);
  console.log(`   3. ${subCatPath}`);
  console.log(`   4. ${prodPath}`);
  console.log('\n✨ Use these CSV files to update Supabase!\n');
}

// ============================================================================
// RUN
// ============================================================================

runMigration().catch(console.error);

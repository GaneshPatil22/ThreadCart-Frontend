// ============================================================================
// IMAGE MIGRATION SCRIPT: Google Drive → ImageKit
// ============================================================================
// This script migrates all existing images from Google Drive to ImageKit
//
// Usage:
//   1. Set environment variables (see below)
//   2. Run: npx ts-node scripts/migrate-images-to-imagekit.ts
//
// Required Environment Variables:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_KEY (service role key, not anon key)
//   - IMAGEKIT_PRIVATE_KEY
//   - IMAGEKIT_PUBLIC_KEY
//   - IMAGEKIT_URL_ENDPOINT
//
// NOTE: This script should be run once to migrate existing data.
// After migration, all new uploads will go directly to ImageKit.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',

  // ImageKit
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || '',
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || '',
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/fq27eon0z',

  // Folders
  FOLDERS: {
    CATEGORIES: 'threadcart/categories',
    SUBCATEGORIES: 'threadcart/subcategories',
    PRODUCTS: 'threadcart/products',
  },

  // Batch size for processing
  BATCH_SIZE: 5,

  // Delay between batches (ms) to avoid rate limiting
  BATCH_DELAY: 1000,

  // Dry run mode - set to false to actually migrate
  DRY_RUN: true,
};

// ============================================================================
// TYPES
// ============================================================================

interface Category {
  id: number;
  name: string;
  image_url: string;
}

interface SubCategory {
  id: number;
  name: string;
  image_url: string;
}

interface Product {
  id: number;
  name: string;
  image_url: string[];
}

interface MigrationResult {
  table: string;
  id: number;
  name: string;
  oldUrl: string;
  newUrl: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if a URL is a Google Drive URL
 */
function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('googleusercontent.com');
}

/**
 * Extracts file ID from Google Drive URL
 */
function extractGoogleDriveFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Downloads image from Google Drive
 */
async function downloadFromGoogleDrive(fileId: string): Promise<Buffer> {
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

  const response = await fetch(thumbnailUrl);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Uploads image to ImageKit
 */
async function uploadToImageKit(
  imageBuffer: Buffer,
  fileName: string,
  folder: string
): Promise<string> {
  const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';

  // Convert buffer to base64
  const base64 = imageBuffer.toString('base64');
  const base64WithPrefix = `data:image/jpeg;base64,${base64}`;

  // Create form data
  const formData = new FormData();
  formData.append('file', base64WithPrefix);
  formData.append('fileName', fileName);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'true');

  // ImageKit uses Basic Auth
  const authHeader = 'Basic ' + Buffer.from(CONFIG.IMAGEKIT_PRIVATE_KEY + ':').toString('base64');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImageKit upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.url;
}

/**
 * Generates a safe filename from the item name
 */
function generateFileName(name: string, index?: number): string {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);

  const suffix = index !== undefined ? `_${index}` : '';
  return `${safeName}${suffix}_${Date.now()}.jpg`;
}

/**
 * Delays execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migrates a single image from Google Drive to ImageKit
 */
async function migrateImage(
  url: string,
  name: string,
  folder: string,
  index?: number
): Promise<{ newUrl: string; success: boolean; error?: string }> {
  try {
    if (!isGoogleDriveUrl(url)) {
      return { newUrl: url, success: true }; // Already not a Google Drive URL
    }

    const fileId = extractGoogleDriveFileId(url);
    if (!fileId) {
      return { newUrl: url, success: false, error: 'Could not extract file ID' };
    }

    if (CONFIG.DRY_RUN) {
      console.log(`  [DRY RUN] Would migrate: ${url}`);
      return { newUrl: `[DRY_RUN]_${url}`, success: true };
    }

    // Download from Google Drive
    const imageBuffer = await downloadFromGoogleDrive(fileId);

    // Upload to ImageKit
    const fileName = generateFileName(name, index);
    const newUrl = await uploadToImageKit(imageBuffer, fileName, folder);

    return { newUrl, success: true };
  } catch (error) {
    return {
      newUrl: url,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Migrates categories
 */
async function migrateCategories(supabase: ReturnType<typeof createClient>): Promise<MigrationResult[]> {
  console.log('\n📁 Migrating Categories...');

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, image_url');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const results: MigrationResult[] = [];
  const googleDriveCategories = (categories as Category[]).filter(c => isGoogleDriveUrl(c.image_url));

  console.log(`  Found ${googleDriveCategories.length} categories with Google Drive URLs`);

  for (const category of googleDriveCategories) {
    console.log(`  Processing: ${category.name}`);

    const { newUrl, success, error } = await migrateImage(
      category.image_url,
      category.name,
      CONFIG.FOLDERS.CATEGORIES
    );

    if (success && !CONFIG.DRY_RUN && newUrl !== category.image_url) {
      // Update database
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: newUrl })
        .eq('id', category.id);

      if (updateError) {
        results.push({
          table: 'categories',
          id: category.id,
          name: category.name,
          oldUrl: category.image_url,
          newUrl,
          success: false,
          error: updateError.message,
        });
        continue;
      }
    }

    results.push({
      table: 'categories',
      id: category.id,
      name: category.name,
      oldUrl: category.image_url,
      newUrl,
      success,
      error,
    });

    await delay(500); // Small delay between items
  }

  return results;
}

/**
 * Migrates subcategories
 */
async function migrateSubCategories(supabase: ReturnType<typeof createClient>): Promise<MigrationResult[]> {
  console.log('\n📁 Migrating SubCategories...');

  const { data: subCategories, error } = await supabase
    .from('sub-categories')
    .select('id, name, image_url');

  if (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }

  const results: MigrationResult[] = [];
  const googleDriveSubCategories = (subCategories as SubCategory[]).filter(sc => isGoogleDriveUrl(sc.image_url));

  console.log(`  Found ${googleDriveSubCategories.length} subcategories with Google Drive URLs`);

  for (const subCategory of googleDriveSubCategories) {
    console.log(`  Processing: ${subCategory.name}`);

    const { newUrl, success, error } = await migrateImage(
      subCategory.image_url,
      subCategory.name,
      CONFIG.FOLDERS.SUBCATEGORIES
    );

    if (success && !CONFIG.DRY_RUN && newUrl !== subCategory.image_url) {
      const { error: updateError } = await supabase
        .from('sub-categories')
        .update({ image_url: newUrl })
        .eq('id', subCategory.id);

      if (updateError) {
        results.push({
          table: 'sub-categories',
          id: subCategory.id,
          name: subCategory.name,
          oldUrl: subCategory.image_url,
          newUrl,
          success: false,
          error: updateError.message,
        });
        continue;
      }
    }

    results.push({
      table: 'sub-categories',
      id: subCategory.id,
      name: subCategory.name,
      oldUrl: subCategory.image_url,
      newUrl,
      success,
      error,
    });

    await delay(500);
  }

  return results;
}

/**
 * Migrates products (handles multiple images per product)
 */
async function migrateProducts(supabase: ReturnType<typeof createClient>): Promise<MigrationResult[]> {
  console.log('\n📁 Migrating Products...');

  const { data: products, error } = await supabase
    .from('product')
    .select('id, name, image_url');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  const results: MigrationResult[] = [];
  const productsWithGoogleDrive = (products as Product[]).filter(p =>
    p.image_url && p.image_url.some(url => isGoogleDriveUrl(url))
  );

  console.log(`  Found ${productsWithGoogleDrive.length} products with Google Drive URLs`);

  for (const product of productsWithGoogleDrive) {
    console.log(`  Processing: ${product.name} (${product.image_url.length} images)`);

    const newUrls: string[] = [];
    let allSuccess = true;
    let errors: string[] = [];

    for (let i = 0; i < product.image_url.length; i++) {
      const url = product.image_url[i];
      const { newUrl, success, error } = await migrateImage(
        url,
        product.name,
        CONFIG.FOLDERS.PRODUCTS,
        i
      );

      newUrls.push(newUrl);
      if (!success) {
        allSuccess = false;
        if (error) errors.push(error);
      }

      await delay(300); // Delay between images
    }

    if (allSuccess && !CONFIG.DRY_RUN) {
      const { error: updateError } = await supabase
        .from('product')
        .update({ image_url: newUrls })
        .eq('id', product.id);

      if (updateError) {
        results.push({
          table: 'product',
          id: product.id,
          name: product.name,
          oldUrl: product.image_url.join(', '),
          newUrl: newUrls.join(', '),
          success: false,
          error: updateError.message,
        });
        continue;
      }
    }

    results.push({
      table: 'product',
      id: product.id,
      name: product.name,
      oldUrl: product.image_url.join(', '),
      newUrl: newUrls.join(', '),
      success: allSuccess,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    });

    await delay(500); // Delay between products
  }

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     IMAGE MIGRATION: Google Drive → ImageKit                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  if (CONFIG.DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Set CONFIG.DRY_RUN = false to perform actual migration\n');
  }

  // Validate configuration
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase configuration');
    console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
  }

  if (!CONFIG.DRY_RUN && !CONFIG.IMAGEKIT_PRIVATE_KEY) {
    console.error('❌ Missing ImageKit private key');
    console.error('   Set IMAGEKIT_PRIVATE_KEY environment variable');
    process.exit(1);
  }

  // Initialize Supabase client with service role key
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

  // Run migrations
  const allResults: MigrationResult[] = [];

  const categoryResults = await migrateCategories(supabase);
  allResults.push(...categoryResults);

  await delay(CONFIG.BATCH_DELAY);

  const subCategoryResults = await migrateSubCategories(supabase);
  allResults.push(...subCategoryResults);

  await delay(CONFIG.BATCH_DELAY);

  const productResults = await migrateProducts(supabase);
  allResults.push(...productResults);

  // Summary
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('MIGRATION SUMMARY');
  console.log('════════════════════════════════════════════════════════════════');

  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed items:');
    failed.forEach(f => {
      console.log(`  - [${f.table}] ${f.name}: ${f.error}`);
    });
  }

  if (CONFIG.DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN. No changes were made.');
    console.log('   Set CONFIG.DRY_RUN = false and run again to perform migration.');
  }
}

main().catch(console.error);

// ============================================================================
// GENERATE SQL UPDATE SCRIPT FROM MIGRATION CSV FILES
// ============================================================================
// This script reads the migration output CSV files and generates SQL statements
// to update Supabase database with the new ImageKit URLs.
//
// Usage:
//   node scripts/generate-sql-update.js
//
// Output:
//   migration-output/update-supabase.sql
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../migration-output');

// ============================================================================
// FIND LATEST CSV FILES
// ============================================================================

function findLatestFile(prefix) {
  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith(prefix) && f.endsWith('.csv'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(OUTPUT_DIR, files[0]) : null;
}

// ============================================================================
// PARSE CSV (Simple parser for our specific format)
// ============================================================================

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// ============================================================================
// ESCAPE SQL STRING
// ============================================================================

function escapeSQL(str) {
  if (!str) return "''";
  return "'" + str.replace(/'/g, "''") + "'";
}

// ============================================================================
// GENERATE SQL
// ============================================================================

function generateSQL() {
  const sqlStatements = [];

  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- SUPABASE IMAGE URL UPDATE SCRIPT');
  sqlStatements.push('-- Generated: ' + new Date().toISOString());
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- Run this script in Supabase SQL Editor');
  sqlStatements.push('-- Make sure to backup your data before running!');
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('');
  sqlStatements.push('BEGIN;');
  sqlStatements.push('');

  // ----- Categories -----
  const catFile = findLatestFile('categories-');
  if (catFile) {
    const catContent = fs.readFileSync(catFile, 'utf8');
    const categories = parseCSV(catContent);

    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('-- CATEGORIES (' + categories.length + ' rows)');
    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('');

    for (const cat of categories) {
      const id = cat['ID'];
      const newUrl = cat['New URL'];

      if (id && newUrl && newUrl.includes('ik.imagekit.io')) {
        sqlStatements.push(`UPDATE categories SET image_url = ${escapeSQL(newUrl)} WHERE id = ${id};`);
      }
    }
    sqlStatements.push('');
  }

  // ----- SubCategories -----
  const subCatFile = findLatestFile('subcategories-');
  if (subCatFile) {
    const subCatContent = fs.readFileSync(subCatFile, 'utf8');
    const subCategories = parseCSV(subCatContent);

    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('-- SUB-CATEGORIES (' + subCategories.length + ' rows)');
    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('');

    for (const subCat of subCategories) {
      const id = subCat['ID'];
      const newUrl = subCat['New URL'];

      if (id && newUrl && newUrl.includes('ik.imagekit.io')) {
        sqlStatements.push(`UPDATE "sub-categories" SET image_url = ${escapeSQL(newUrl)} WHERE id = ${id};`);
      }
    }
    sqlStatements.push('');
  }

  // ----- Products -----
  const prodFile = findLatestFile('products-');
  if (prodFile) {
    const prodContent = fs.readFileSync(prodFile, 'utf8');
    const products = parseCSV(prodContent);

    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('-- PRODUCTS (' + products.length + ' rows)');
    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('');

    for (const product of products) {
      const id = product['ID'];
      let newUrlsJson = product['New URLs (JSON)'];

      if (id && newUrlsJson) {
        // Remove surrounding quotes if present
        if (newUrlsJson.startsWith('"') && newUrlsJson.endsWith('"')) {
          newUrlsJson = newUrlsJson.slice(1, -1);
        }
        // Unescape doubled quotes
        newUrlsJson = newUrlsJson.replace(/""/g, '"');

        // Parse JSON and convert to PostgreSQL array format
        try {
          const urls = JSON.parse(newUrlsJson);
          // PostgreSQL array format: ARRAY['url1', 'url2']
          const pgArray = urls.map(url => `'${url.replace(/'/g, "''")}'`).join(', ');
          sqlStatements.push(`UPDATE product SET image_url = ARRAY[${pgArray}] WHERE id = ${id};`);
        } catch (e) {
          sqlStatements.push(`-- SKIPPED (invalid JSON): Product ID ${id}`);
        }
      }
    }
    sqlStatements.push('');
  }

  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- VERIFY CHANGES (uncomment to check)');
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- SELECT id, name, image_url FROM categories LIMIT 5;');
  sqlStatements.push('-- SELECT id, name, image_url FROM "sub-categories" LIMIT 5;');
  sqlStatements.push('-- SELECT id, name, image_url FROM product LIMIT 5;');
  sqlStatements.push('');
  sqlStatements.push('COMMIT;');
  sqlStatements.push('');
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- ROLLBACK (run this if something goes wrong)');
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- ROLLBACK;');

  return sqlStatements.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('Generating SQL update script...\n');

  const sql = generateSQL();
  const outputPath = path.join(OUTPUT_DIR, 'update-supabase.sql');

  fs.writeFileSync(outputPath, sql, 'utf8');

  console.log('✅ SQL script generated: ' + outputPath);
  console.log('\nNext steps:');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log('2. Copy the contents of update-supabase.sql');
  console.log('3. Paste and run in SQL Editor');
  console.log('4. Verify the changes worked correctly');
}

main();

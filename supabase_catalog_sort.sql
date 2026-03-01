-- Migration: Add catalog_sort_number to sub-categories table
-- This field controls the display order on the Catalog page (all subcategories view)
-- while sort_number continues to control order within a specific category's subcategory page.

ALTER TABLE "sub-categories"
ADD COLUMN IF NOT EXISTS catalog_sort_number INTEGER DEFAULT 0;

-- Initialize catalog_sort_number with existing sort_number values as a starting point
UPDATE "sub-categories"
SET catalog_sort_number = sort_number
WHERE catalog_sort_number = 0 OR catalog_sort_number IS NULL;

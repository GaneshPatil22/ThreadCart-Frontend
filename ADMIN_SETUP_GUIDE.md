# Admin Authorization Setup Guide

## Overview

This guide explains how to set up secure admin-only access for the ThreadCart inventory management system. Only users with the email `superadmin@threadcart.com` will be able to add, edit, or delete categories, subcategories, and products.

## Security Architecture

### Multi-Layer Security

1. **Frontend Protection** (First Line of Defense)
   - Admin Panel link only visible to admin users
   - Route-level protection with admin checks
   - Forms validate admin status before submission

2. **Backend Protection** (Critical Security Layer)
   - Row Level Security (RLS) policies in Supabase
   - Database rejects unauthorized INSERT/UPDATE/DELETE operations
   - Even if someone bypasses frontend, database will block them

## Setup Instructions

### Step 1: Register the Admin User

1. Go to your application
2. Click "Register"
3. Register with:
   - Email: `superadmin@threadcart.com`
   - Password: (choose a strong password)
   - Name: Super Admin
   - Phone: (your phone)

4. Confirm the email by clicking the link sent to superadmin@threadcart.com

### Step 2: Apply Supabase RLS Policies

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your ThreadCart project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute the SQL Script**
   - Open the file `supabase_admin_setup.sql` from your project root
   - Copy the entire content
   - Paste it into the Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Setup**
   - The script will enable RLS on all tables
   - Create policies for READ (everyone), INSERT/UPDATE/DELETE (admin only)
   - Check the output for any errors

### Step 3: Test the Security

#### Test 1: Admin Access ✅
1. Sign in with `superadmin@threadcart.com`
2. You should see "Admin Panel" in the navbar
3. Navigate to Admin Panel
4. Try adding a category - should work ✅
5. Try editing a product - should work ✅
6. Try deleting a subcategory - should work ✅

#### Test 2: Regular User Access 🚫
1. Sign out
2. Register a different user (e.g., `user@example.com`)
3. Sign in with the regular user
4. "Admin Panel" should NOT appear in navbar 🚫
5. Try navigating directly to `/add_item` by typing in browser
6. Should see "Access Denied" page 🚫

#### Test 3: Anonymous Access (No Login) 🚫
1. Sign out completely
2. Try navigating to `/add_item`
3. Should see "Access Denied" page 🚫
4. Regular browsing (home, categories, products) should work ✅

#### Test 4: Database-Level Security 🚫
1. Sign in with a regular user
2. Open browser console (F12)
3. Try to execute:
```javascript
// This should FAIL even though you're authenticated
await supabase.from('categories').insert({
  name: 'Hacked Category',
  image_url: 'hack.jpg',
  description: 'This should fail',
  sort_number: 999
});
```
4. Should see error: "new row violates row-level security policy" 🚫

## What Each Security Layer Does

### Frontend Security (`src/utils/adminCheck.ts`)

```typescript
export async function isAdmin(): Promise<boolean> {
  const user = await supabase.auth.getUser();
  return user.email === 'superadmin@threadcart.com';
}
```

**Purpose**: Fast UI response, good UX
**Limitation**: Can be bypassed by tech-savvy users

### Backend Security (Supabase RLS)

```sql
CREATE POLICY "Enable insert for admin only" ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.email() = 'superadmin@threadcart.com'
    );
```

**Purpose**: **REAL SECURITY** - Cannot be bypassed
**Protection**: Even if someone:
- Uses browser devtools
- Modifies JavaScript
- Calls API directly
- Uses Postman/curl

The database will **reject** their request.

## How RLS Policies Work

### Read Access (Everyone)
```sql
FOR SELECT USING (true)
```
- Anyone can view categories, subcategories, products
- No authentication required
- Good for public e-commerce site

### Write Access (Admin Only)
```sql
FOR INSERT/UPDATE/DELETE
TO authenticated
WITH CHECK (auth.email() = 'superadmin@threadcart.com')
```
- User must be authenticated
- User's email must be superadmin@threadcart.com
- Checked at database level
- Impossible to bypass

## Changing the Admin Email

If you want to change the admin email from `superadmin@threadcart.com` to something else:

### Step 1: Update Frontend
Edit `src/utils/adminCheck.ts`:
```typescript
const ADMIN_EMAIL = "youradmin@example.com"; // Change this
```

### Step 2: Update Database Policies
Run this SQL in Supabase:
```sql
-- Update all policies to use new admin email
DROP POLICY IF EXISTS "Enable insert for admin only" ON categories;
DROP POLICY IF EXISTS "Enable update for admin only" ON categories;
DROP POLICY IF EXISTS "Enable delete for admin only" ON categories;
-- Repeat for sub-categories and product tables

-- Recreate with new email
CREATE POLICY "Enable insert for admin only" ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.email() = 'youradmin@example.com'
    );
-- Repeat for UPDATE, DELETE, and other tables
```

Or simply edit the `supabase_admin_setup.sql` file, replace all instances of `superadmin@threadcart.com` with your new email, and re-run the entire script.

## Adding Multiple Admins (Optional)

If you want multiple admin users:

### Option 1: Add to Admin Check
```typescript
const ADMIN_EMAILS = [
  "superadmin@threadcart.com",
  "admin2@threadcart.com",
  "admin3@threadcart.com"
];

export async function isAdmin(): Promise<boolean> {
  const user = await supabase.auth.getUser();
  return ADMIN_EMAILS.includes(user.email || '');
}
```

### Option 2: Create Admin Role Table (Recommended for many admins)

1. Create an `admins` table:
```sql
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only admins can manage admins table
CREATE POLICY "Admins can read admins table" ON admins
    FOR SELECT
    TO authenticated
    USING (true);
```

2. Update RLS policies to check the admins table:
```sql
CREATE POLICY "Enable insert for admins" ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.email = auth.email()
        )
    );
```

## Troubleshooting

### Issue: Admin can't add items
**Solution**:
1. Verify admin is signed in with exact email: `superadmin@threadcart.com`
2. Check Supabase SQL Editor - verify RLS policies are created
3. Check browser console for errors
4. Try signing out and back in

### Issue: Regular user can access /add_item
**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Verify `adminCheck.ts` is imported correctly
4. Check that `AddItem.tsx` has the admin check

### Issue: Database errors when admin tries to add
**Solution**:
1. Check Supabase logs (Dashboard → Logs → Postgres)
2. Verify RLS policies are applied: Run verification queries from `supabase_admin_setup.sql`
3. Check that user is authenticated (not anonymous)

### Issue: "new row violates row-level security policy"
**Solution**:
- This is CORRECT behavior for non-admin users!
- It means the security is working
- Admin users should not see this error

## Security Best Practices

1. ✅ **Never disable RLS** - Keep Row Level Security enabled on all tables
2. ✅ **Use strong admin password** - At least 12 characters, mixed case, numbers, symbols
3. ✅ **Keep admin email private** - Don't share or expose it publicly
4. ✅ **Enable 2FA for admin** - Set up in Supabase if available
5. ✅ **Regular audits** - Check Supabase logs for unauthorized access attempts
6. ✅ **Backup database** - Regular backups in case of issues

## Files Modified

### New Files Created:
- `src/utils/adminCheck.ts` - Admin validation utilities
- `src/components/Unauthorized.tsx` - Access denied page
- `supabase_admin_setup.sql` - Database security policies
- `ADMIN_SETUP_GUIDE.md` - This guide

### Modified Files:
- `src/components/Navbar.tsx` - Admin check for showing Admin Panel link
- `src/components/AddItems/AddItem.tsx` - Route protection
- `src/components/AddItems/AddCategoryForm.tsx` - Admin validation before submit

## Summary

✅ **Frontend Protection**: UI hides admin features from non-admins
✅ **Backend Protection**: Database rejects unauthorized operations
✅ **Defense in Depth**: Multiple layers of security
✅ **User Experience**: Clear "Access Denied" messages
✅ **Maintainable**: Easy to change admin email or add more admins

Your inventory system is now secure! Only `superadmin@threadcart.com` can manage products.

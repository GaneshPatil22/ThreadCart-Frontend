# Admin Setup - Quick Start

## 🚀 Quick Setup (5 minutes)

### Step 1: Register Admin User
1. Open your app
2. Click "Register"
3. Use email: `superadmin@threadcart.com`
4. Complete registration and confirm email

### Step 2: Apply Database Security
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire content from `supabase_admin_setup.sql`
4. Paste and run in Supabase SQL Editor

### Step 3: Test
1. Sign in as `superadmin@threadcart.com`
2. Check if "Admin Panel" appears in navbar ✅
3. Navigate to Admin Panel
4. Try adding a test category ✅

Done! Your admin system is secure.

## 🔒 Security Layers

### Layer 1: Frontend (Good UX)
- Admin Panel link hidden from non-admins
- Route protection on `/add_item`
- Forms check admin before submit

### Layer 2: Database (Real Security) 🛡️
- Row Level Security (RLS) policies
- Database rejects unauthorized writes
- **Cannot be bypassed** - even with devtools

## 🧪 Testing Security

### As Admin (superadmin@threadcart.com):
- ✅ Can see "Admin Panel" link
- ✅ Can access `/add_item`
- ✅ Can add/edit/delete items

### As Regular User:
- 🚫 No "Admin Panel" link
- 🚫 Cannot access `/add_item` (shows Access Denied)
- 🚫 Database blocks any write attempts

### As Anonymous (Not logged in):
- 🚫 No "Admin Panel" link
- 🚫 Cannot access `/add_item` (shows Access Denied)
- ✅ Can browse products (read-only)

## 📝 Admin Email Location

To change admin email, edit these 2 places:

1. **Frontend**: `src/utils/adminCheck.ts`
```typescript
const ADMIN_EMAIL = "superadmin@threadcart.com"; // Change here
```

2. **Backend**: `supabase_admin_setup.sql`
```sql
-- Find and replace all instances of 'superadmin@threadcart.com'
WITH CHECK (auth.email() = 'YOUR_NEW_EMAIL@example.com')
```

Then re-run the SQL script in Supabase.

## 🆘 Troubleshooting

### "Access Denied" when signed in as admin
- Verify exact email: `superadmin@threadcart.com` (no typos!)
- Sign out and sign back in
- Clear browser cache

### Database error: "violates row-level security policy"
- Good! This means non-admins are being blocked ✅
- If you're the admin, verify RLS policies are applied
- Check Supabase Dashboard → SQL Editor → Run verification queries

### Admin Panel link not showing
- Check browser console for errors
- Verify user is signed in
- Hard refresh (Ctrl+Shift+R)

## 📚 Full Documentation

See `ADMIN_SETUP_GUIDE.md` for complete details including:
- Multi-admin setup
- Security best practices
- Testing procedures
- Changing admin email
- Troubleshooting guide

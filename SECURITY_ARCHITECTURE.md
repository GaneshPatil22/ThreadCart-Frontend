# Security Architecture

## Overview
ThreadCart uses a **defense-in-depth** approach with multiple security layers to protect admin functionality.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER TYPES                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  👤 Anonymous        👤 Regular User      👑 Admin          │
│  (Not logged in)     (user@email.com)    (superadmin@...)  │
│                                                              │
└──────────────┬───────────────┬──────────────┬──────────────┘
               │               │              │
               ▼               ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                             │
│                   (First Defense)                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Navbar.tsx:                                                  │
│  ┌────────────────────────────────────┐                      │
│  │ isUserAdmin = await isAdmin()      │                      │
│  │                                    │                      │
│  │ {isUserAdmin && (                  │                      │
│  │   <Link to="/add_item">           │                      │
│  │     Admin Panel                    │                      │
│  │   </Link>                          │                      │
│  │ )}                                 │                      │
│  └────────────────────────────────────┘                      │
│                                                               │
│  Result:                                                      │
│  🚫 Anonymous:    No Admin Panel link                        │
│  🚫 Regular User: No Admin Panel link                        │
│  ✅ Admin:        Shows Admin Panel link                     │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                           │
            User tries to access /add_item
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    ROUTE LAYER                                │
│                  (Second Defense)                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  AddItem.tsx:                                                 │
│  ┌────────────────────────────────────┐                      │
│  │ const adminStatus = await isAdmin()│                      │
│  │                                    │                      │
│  │ if (!adminStatus) {                │                      │
│  │   return <Unauthorized />          │                      │
│  │ }                                  │                      │
│  └────────────────────────────────────┘                      │
│                                                               │
│  Result:                                                      │
│  🚫 Anonymous:    "Access Denied" page                       │
│  🚫 Regular User: "Access Denied" page                       │
│  ✅ Admin:        Shows Admin Panel                          │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                           │
         Admin fills form and clicks submit
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    FORM LAYER                                 │
│                  (Third Defense)                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  AddCategoryForm.tsx:                                         │
│  ┌────────────────────────────────────┐                      │
│  │ try {                              │                      │
│  │   await requireAdmin()             │                      │
│  │   await supabase.from('categories')│                      │
│  │     .insert([data])                │                      │
│  │ } catch (error) {                  │                      │
│  │   alert("Unauthorized")            │                      │
│  │ }                                  │                      │
│  └────────────────────────────────────┘                      │
│                                                               │
│  Result:                                                      │
│  🚫 Non-Admin: "Unauthorized" error                          │
│  ✅ Admin:     Proceeds to database                          │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                           │
            Request sent to Supabase
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                             │
│            🛡️  (ULTIMATE DEFENSE) 🛡️                         │
│             Row Level Security (RLS)                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Supabase checks RLS policy:                                 │
│  ┌────────────────────────────────────────────────┐          │
│  │ CREATE POLICY "Enable insert for admin only"  │          │
│  │ ON categories                                 │          │
│  │ FOR INSERT                                    │          │
│  │ TO authenticated                              │          │
│  │ WITH CHECK (                                  │          │
│  │   auth.email() = 'superadmin@threadcart.com' │          │
│  │ )                                             │          │
│  └────────────────────────────────────────────────┘          │
│                                                               │
│  Database verifies:                                           │
│  1. ✓ Is user authenticated?                                 │
│  2. ✓ Does auth.email() match admin email?                   │
│  3. ✓ Both true → Allow INSERT                               │
│     ✗ Either false → REJECT with RLS error                   │
│                                                               │
│  Result:                                                      │
│  🚫 Anonymous:    ❌ REJECTED (not authenticated)            │
│  🚫 Regular User: ❌ REJECTED (wrong email)                  │
│  ✅ Admin:        ✅ ALLOWED (correct email)                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Attack Scenarios & Defenses

### Scenario 1: Hacker uses Browser DevTools
```
Hacker opens Chrome DevTools
↓
Modifies JavaScript to show "Admin Panel" link
↓
LAYER 1 BYPASSED ⚠️
↓
Clicks link, navigates to /add_item
↓
LAYER 2 DEFENSE: Route checks admin status
↓
isAdmin() checks email against Supabase
↓
Email = user@hacker.com ≠ superadmin@threadcart.com
↓
❌ BLOCKED - Shows "Access Denied" page
```

### Scenario 2: Hacker modifies client-side code
```
Hacker edits local JavaScript files
↓
Changes isAdmin() to always return true
↓
LAYER 1 BYPASSED ⚠️
LAYER 2 BYPASSED ⚠️
LAYER 3 BYPASSED ⚠️
↓
Fills form and clicks submit
↓
Request sent directly to Supabase
↓
LAYER 4 DEFENSE: Database RLS
↓
Database checks: auth.email() = 'superadmin@threadcart.com'
↓
Actual email = user@hacker.com
↓
❌ BLOCKED - Database returns error:
"new row violates row-level security policy"
```

### Scenario 3: Hacker uses API directly (Postman/curl)
```
Hacker obtains Supabase URL and anon key
↓
Registers account: hacker@evil.com
↓
Gets auth token from Supabase
↓
ALL FRONTEND LAYERS BYPASSED ⚠️⚠️⚠️
↓
Sends POST request directly to Supabase:
curl -X POST https://xxx.supabase.co/rest/v1/categories \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Hacked","image_url":"x.jpg"}'
↓
LAYER 4 DEFENSE: Database RLS
↓
Database verifies token → email = hacker@evil.com
↓
RLS policy checks: hacker@evil.com = superadmin@threadcart.com?
↓
FALSE
↓
❌ BLOCKED - Database rejects INSERT
```

### Scenario 4: Legitimate Admin Access ✅
```
Admin signs in with superadmin@threadcart.com
↓
LAYER 1: Shows Admin Panel link ✅
↓
LAYER 2: Route allows access ✅
↓
LAYER 3: Form validation passes ✅
↓
LAYER 4: Database RLS policy:
  auth.email() = superadmin@threadcart.com ✓
↓
✅ ALLOWED - Data inserted successfully
```

## Why Row Level Security is Critical

### Without RLS (Insecure):
```
Frontend: "You're not admin, can't add"
Hacker: *bypasses frontend*
Database: "Here's your INSERT, no questions asked" ❌
Result: 🚨 Security breach
```

### With RLS (Secure):
```
Frontend: "You're not admin, can't add"
Hacker: *bypasses frontend*
Database: "Who are you? What's your email?"
Hacker: "user@hacker.com"
Database: "Not superadmin@threadcart.com → REJECTED" ✅
Result: 🛡️ Secure
```

## Read vs Write Permissions

```
┌─────────────────────┬──────────┬────────┬────────┬────────┐
│ Operation           │ Anyone   │ User   │ Admin  │ Database│
├─────────────────────┼──────────┼────────┼────────┼────────┤
│ SELECT (Read)       │    ✅    │   ✅   │   ✅   │  Allow │
│ INSERT (Create)     │    🚫    │   🚫   │   ✅   │  Admin │
│ UPDATE (Edit)       │    🚫    │   🚫   │   ✅   │  Admin │
│ DELETE (Remove)     │    🚫    │   🚫   │   ✅   │  Admin │
└─────────────────────┴──────────┴────────┴────────┴────────┘
```

## Code Flow

### Checking if user is admin:

```typescript
// src/utils/adminCheck.ts
export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === 'superadmin@threadcart.com';
}
```

### Protecting a route:

```typescript
// src/components/AddItems/AddItem.tsx
const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);

useEffect(() => {
  const check = async () => {
    setIsUserAdmin(await isAdmin());
  };
  check();
}, []);

if (!isUserAdmin) return <Unauthorized />;
```

### Protecting a form submission:

```typescript
// src/components/AddItems/AddCategoryForm.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await requireAdmin(); // Throws error if not admin

    const { error } = await supabase
      .from('categories')
      .insert([data]);

    if (error) throw error;
  } catch (error) {
    alert(error.message); // "Unauthorized: Admin access required"
  }
};
```

### Database RLS policy:

```sql
-- In Supabase
CREATE POLICY "Enable insert for admin only"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.email() = 'superadmin@threadcart.com'
);
```

## Security Checklist

- ✅ Frontend hides admin UI from non-admins
- ✅ Routes protected with admin checks
- ✅ Forms validate admin before submission
- ✅ Database enforces admin-only writes via RLS
- ✅ Public can read all products (good for e-commerce)
- ✅ Only specific email can modify data
- ✅ Even if frontend bypassed, database blocks unauthorized access
- ✅ Clear error messages for unauthorized attempts
- ✅ Loading states during admin verification

## Testing Security

Run these tests to verify security:

### Test 1: View as non-admin
```
1. Sign out or use regular account
2. No "Admin Panel" should appear ✅
3. Try URL: /add_item
4. Should see "Access Denied" ✅
```

### Test 2: Try API bypass
```
1. Sign in as regular user
2. Open browser console
3. Run:
   await supabase.from('categories').insert({
     name: 'Test', image_url: 'x', description: 'x', sort_number: 0
   })
4. Should get RLS error ✅
```

### Test 3: Admin can modify
```
1. Sign in as superadmin@threadcart.com
2. Navigate to Admin Panel
3. Add a test category
4. Should work ✅
```

## Summary

**4 Layers of Security:**
1. UI Layer - Hide admin links
2. Route Layer - Block unauthorized page access
3. Form Layer - Validate before submission
4. **Database Layer** - 🛡️ **ULTIMATE PROTECTION** 🛡️

**Key Takeaway:** Even if someone bypasses layers 1-3, the database (layer 4) will always block unauthorized writes. This is the real security.

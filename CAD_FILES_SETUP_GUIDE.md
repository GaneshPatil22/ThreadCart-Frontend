# CAD Files Feature — Setup Guide

End-to-end setup for the CAD downloads feature (STEP / PDF / SolidWorks / STL).
Read top-to-bottom. Each step is checkable.

---

## Architecture (one-pager)

```
Admin uploads file                         Customer downloads file
─────────────────────                      ─────────────────────────
1. Browser picks file                      1. Browser clicks button
2. Calls edge function                     2. Calls edge function
3. Edge fn (admin check)                   3. Edge fn (auth check)
   returns presigned PUT URL                  returns presigned GET URL
4. Browser PUTs to R2                      4. Browser opens URL → file downloads
5. DB row inserted in                      5. download_count++
   product_cad_files
```

- **Storage:** Cloudflare R2 (private bucket `threadcart-cad-files`)
- **Auth gatekeeper:** Supabase Edge Function `cad-file-url`
- **Metadata:** Postgres table `product_cad_files`
- **Frontend never holds R2 keys** — all signed via edge function

---

## Implementation status

| # | Step | Status |
|---|---|---|
| 1 | Create Cloudflare R2 account | ⏳ in progress |
| 2 | Create bucket `threadcart-cad-files` | ⏳ pending |
| 3 | Create R2 API token (Read+Write, bucket-scoped) | ⏳ pending |
| 4 | Run SQL migration in Supabase | ⏳ pending |
| 5 | Set Supabase secrets (R2 credentials) | ⏳ pending |
| 6 | Deploy edge function `cad-file-url` | ⏳ pending |
| 7 | Configure CORS on R2 bucket | ⏳ pending |
| 8 | End-to-end test | ⏳ pending |
| ✅ | All frontend code, services, edge function written | done |
| ✅ | `npx tsc -b` passes clean | done |

---

## Step 1–3: Cloudflare R2 account + bucket + token

### 1. Create account
- https://dash.cloudflare.com/sign-up
- Verify email

### 2. Enable R2
- Left sidebar → **R2 Object Storage** → **Enable R2**
- Add billing info (no charges below 10GB / $0 egress)

### 3. Create bucket
- Click **Create bucket**
- Name: `threadcart-cad-files`
- Location: **Asia-Pacific (APAC)** (faster from India)
- Click **Create bucket**

### 4. Create API token
- R2 dashboard → **Manage R2 API Tokens** → **Create API Token**
- Token name: `threadcart-cad-files-token`
- Permissions: **Object Read & Write**
- Specify bucket: `threadcart-cad-files` (least privilege)
- TTL: Forever
- Click **Create**

### 5. Copy these 4 values — keep them safe

| Name | Where to find |
|---|---|
| `R2_ACCOUNT_ID` | R2 dashboard sidebar → "Account details" |
| `R2_ACCESS_KEY_ID` | Shown after token creation |
| `R2_SECRET_ACCESS_KEY` | Shown after token creation (one-time view) |
| `R2_BUCKET` | `threadcart-cad-files` |

⚠️ The secret key shows **once**. Save it to a password manager immediately.

---

## Step 4: Run DB migration

1. Open Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the contents of `supabase_cad_files.sql`
3. Click **Run**
4. Verify with:
   ```sql
   SELECT * FROM product_cad_files;     -- should return 0 rows
   SELECT * FROM pg_policies WHERE tablename = 'product_cad_files';
   ```

The migration is **idempotent** — safe to re-run.

---

## Step 5: Set Supabase Edge Function secrets

Open a terminal in the project root and run:

```bash
# Login first if needed
npx supabase login

# Link to your project (one-time; project ref = tlczvpepvxmsrlexzurj)
npx supabase link --project-ref tlczvpepvxmsrlexzurj

# Set the R2 secrets (replace with your actual values)
npx supabase secrets set \
  R2_ACCOUNT_ID="your_account_id" \
  R2_ACCESS_KEY_ID="your_access_key" \
  R2_SECRET_ACCESS_KEY="your_secret_key" \
  R2_BUCKET="threadcart-cad-files" \
  ADMIN_EMAIL="superadmin@threadcart.com" \
  SIGNED_URL_TTL_SECONDS="300"
```

Verify:
```bash
npx supabase secrets list
```
Should show all 6 names (values are hidden).

---

## Step 6: Deploy edge function

```bash
npx supabase functions deploy cad-file-url --no-verify-jwt
```

> The `--no-verify-jwt` flag is intentional — the function does its own
> JWT verification using `supabase.auth.getUser()` so it can return
> meaningful 401s. The function still **requires** an Authorization header
> from the browser (sent automatically by `supabase.functions.invoke()`).

Verify it deployed:
```bash
npx supabase functions list
```
Should show `cad-file-url` with status `ACTIVE`.

---

## Step 7: Configure CORS on R2 bucket

R2 needs to allow browser uploads/downloads from your domain.

### Via Cloudflare dashboard:
1. R2 → `threadcart-cad-files` bucket → **Settings** tab
2. Scroll to **CORS Policy** → **Add CORS Policy**
3. Paste this JSON (adjust origins for production):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://yourdomain.com"
    ],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

4. Save

> Add your production domain to `AllowedOrigins` when you deploy.

---

## Step 8: End-to-end test

### 8a. Test admin upload
1. `npm run dev`
2. Sign in as `superadmin@threadcart.com`
3. Go to **Admin Panel** → **View & Edit** (Products)
4. Open any product → scroll to **CAD Files** section
5. Click **Upload** under STEP → pick a `.step` file (or any small file)
6. Should see "Uploaded" badge appear

### 8b. Test customer download (logged-in)
1. Stay signed in
2. Go to the product page where you uploaded the file
3. Expand the row — should see **Engineering Downloads** section
4. Click the STEP button → file downloads

### 8c. Test anonymous user
1. Sign out
2. Open the same product
3. Should see download button with "Sign in required" pill
4. Click button → AuthModal appears
5. Sign in → modal closes → click button again → downloads

### 8d. Verify download counter
```sql
SELECT file_type, original_filename, download_count
FROM product_cad_files;
```

---

## Files created/modified

### New files
```
supabase_cad_files.sql                                  -- DB migration
supabase/functions/cad-file-url/index.ts                -- Edge function
src/types/cad-files.types.ts                            -- Types
src/services/storage/storage.types.ts                   -- Provider interface
src/services/storage/r2-storage.provider.ts             -- R2 impl
src/services/storage/storage.service.ts                 -- Public storage API
src/services/cad-files.service.ts                       -- DB CRUD + orchestration
src/components/AddItems/CadFilesManager.tsx             -- Admin upload UI
src/components/product/CadFileDownloads.tsx             -- Customer download UI
CAD_FILES_SETUP_GUIDE.md                                -- This file
```

### Modified files
```
src/utils/constants.ts                  -- + CAD_FILES, CAD_FILE_TYPE_ORDER, buildCadStorageKey
src/components/AddItems/ManageProducts.tsx       -- CadFilesManager in edit modal
src/components/AddItems/AddProductForm.tsx       -- Tip about adding files via edit
src/components/product/ShortProductDetail.tsx    -- CadFileDownloads (compact)
src/components/product/ProductDetailView.tsx     -- CadFileDownloads (full)
```

---

## Troubleshooting

### "Storage not configured" (500)
- One of R2 env vars not set. Run `npx supabase secrets list` and ensure
  `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` are present.

### "Authentication required" (401) on download
- The browser isn't sending the JWT. `supabase.functions.invoke()` does
  this automatically — verify the user is actually logged in.

### "Admin only" (403) on upload
- Logged-in user's email doesn't match `ADMIN_EMAIL` secret. Default is
  `superadmin@threadcart.com`. Change with:
  ```bash
  npx supabase secrets set ADMIN_EMAIL="newadmin@example.com"
  ```

### CORS error in browser console
- R2 CORS policy doesn't include the origin. Add it in Step 7.
- For local dev: ensure `http://localhost:5173` is in the policy.

### Upload succeeds but file isn't visible
- Check the DB — the row may exist:
  ```sql
  SELECT * FROM product_cad_files WHERE product_id = <id>;
  ```
- If row missing, edge function or signed URL failed silently — check
  edge function logs:
  ```bash
  npx supabase functions logs cad-file-url
  ```

### File too large
- Per-type max is in `src/utils/constants.ts` → `CAD_FILES.TYPES.*.maxSizeMB`
- Defaults: STEP 20MB, PDF 10MB, SLDPRT 20MB, STL 50MB

---

## Future migration — switching providers

Should the project ever outgrow R2 (or you want to try Backblaze B2 / AWS S3 / MinIO):

1. Implement a new class against `StorageProvider`
   (see `src/services/storage/storage.types.ts`)
2. Update one line in `src/services/storage/storage.service.ts`:
   ```typescript
   const provider: StorageProvider = newProvider;  // was r2StorageProvider
   ```
3. Update the edge function `cad-file-url` to use the new SDK
4. Run a one-time migration script: download all files from R2 → upload
   to new provider → update `storage_key` field if path format changes
5. DB schema doesn't need to change

The `storage_key` field stores **only the path** (e.g. `products/42/step.step`),
never a full URL. URLs are generated on-demand. This is what makes migration easy.

---

## Cost estimates

At ~500 products × 4 files × ~5MB each = **10GB storage**:

| Provider | Storage | Egress | ~Monthly cost |
|---|---|---|---|
| Cloudflare R2 (current) | 10GB free, then $0.015/GB | **$0** | $0 (within free tier) |
| Supabase Storage | 1GB free, then $0.021/GB | $0.09/GB | $25+ overage |
| AWS S3 | None (free tier expires 12mo) | $0.09/GB | $0.23/GB storage + egress |

R2 wins on every dimension at this scale. The 10GB free tier covers ~200 products with all 4 files; the next ~300 products would cost ~$0.075/month for storage.

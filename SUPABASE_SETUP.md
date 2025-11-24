# Supabase Email Confirmation Setup Guide

## Current Status
- ✅ Google OAuth enabled and configured
- ✅ Email/password authentication enabled
- ✅ Registration form sends confirmation emails
- ✅ UI shows "Check Your Email" message after registration

## Required Supabase Configuration

### 1. Email Confirmation Settings

Go to your Supabase Dashboard → Authentication → Settings:

#### Email Confirmation
- **Enable email confirmations**: ON
- **Confirm email**: Enable this option
- **Email confirmation redirect URL**: `http://localhost:5173/confirm-email` (for development)

For production, add: `https://yourdomain.com/confirm-email`

### 2. Email Templates

Go to Authentication → Email Templates:

#### Customize "Confirm signup" template:
The default template should work, but you can customize it. Make sure it includes:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

The `{{ .ConfirmationURL }}` will automatically redirect to your configured URL after confirmation.

### 3. Site URL Configuration

Go to Authentication → URL Configuration:

- **Site URL**: `http://localhost:5173` (for development)
- **Redirect URLs**: Add both:
  - `http://localhost:5173/**`
  - `http://localhost:5173/confirm-email`

For production, add your production URLs.

### 4. Google OAuth Configuration (Already Done ✅)

You mentioned you already did this, but for reference:

1. Go to Authentication → Providers → Google
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Authorized redirect URIs should include:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`

## Testing the Flow

### Email/Password Registration:
1. User fills out registration form
2. Clicks "Register"
3. Modal shows "Check Your Email!" message with email icon
4. User receives email with confirmation link
5. User clicks link in email
6. User is redirected to `/confirm-email`
7. Confirmation page shows success message
8. User is automatically logged in
9. After 2 seconds, redirected to home page

### Google Sign-In:
1. User clicks "Sign in with Google"
2. OAuth popup opens
3. User signs in with Google
4. User is redirected back and logged in automatically
5. No email confirmation needed for OAuth

## Common Issues & Solutions

### Issue 1: User not receiving confirmation emails
**Solution**:
- Check your email provider's spam folder
- In Supabase Dashboard → Authentication → Settings, verify "Enable email confirmations" is ON
- For development, Supabase uses their own SMTP (emails might be delayed)

### Issue 2: Confirmation link doesn't work
**Solution**:
- Verify "Email confirmation redirect URL" is set correctly
- Make sure the URL includes the protocol (http:// or https://)
- Check that the redirect URL is in the "Redirect URLs" whitelist

### Issue 3: User gets logged in without confirming email
**Solution**:
- In Supabase Dashboard → Authentication → Settings
- Make sure "Confirm email" is ENABLED
- This ensures users MUST confirm before they can sign in

### Issue 4: Google sign-in not working
**Solution**:
- Verify Google OAuth credentials are correct
- Check that redirect URI in Google Console matches Supabase
- Make sure the Google Cloud project is in production mode (not testing)

## Development vs Production

### Development (localhost)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Redirect URLs:
- `http://localhost:5173/confirm-email`
- `http://localhost:5173/**`

### Production
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Redirect URLs:
- `https://yourdomain.com/confirm-email`
- `https://yourdomain.com/**`

## Checking Confirmation Status

You can check if email confirmation is required by looking at the signUp response:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
});

// If email confirmation is enabled, user will be in data.user but session will be null
console.log("User created:", data.user);
console.log("Session:", data.session); // Will be null until confirmed
```

## Database Considerations

If you have Row Level Security (RLS) policies, make sure they allow:
1. Users to read public data (categories, subcategories, products) without authentication
2. Authenticated users to access protected routes
3. Admin users to modify data at `/add_item`

Example RLS policy for public read access:
```sql
-- Allow anyone to read products
CREATE POLICY "Enable read access for all users" ON product
FOR SELECT USING (true);

-- Allow authenticated users to insert (if admin)
CREATE POLICY "Enable insert for authenticated users" ON product
FOR INSERT TO authenticated
USING (true);
```

## Next Steps

1. ✅ Test registration with a real email address
2. ✅ Check if you receive the confirmation email
3. ✅ Click the link and verify you're redirected to `/confirm-email`
4. ✅ Check if you can sign in after confirmation
5. ✅ Test Google OAuth sign-in

If you encounter any issues, check the browser console and Supabase logs for error messages.

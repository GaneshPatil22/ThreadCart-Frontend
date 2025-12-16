# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ThreadCart is an e-commerce application for fashion products built with React, TypeScript, Vite, and Supabase. The application features a three-tier product organization (Categories → SubCategories → Products) with authentication via Supabase Auth.

## Code Standards & Best Practices

When working on this project, always follow these principles:
- **Clean Code**: Write readable, maintainable code with meaningful variable names and single-responsibility functions
- **TypeScript**: Use strict typing, define interfaces for all data structures, avoid `any` types
- **Software Engineering Principles**: Follow SOLID principles, DRY (Don't Repeat Yourself), and proper separation of concerns
- **Tailwind CSS**: Use utility-first CSS with Tailwind, maintain consistency with the existing design system
- **Vite**: Leverage Vite's fast HMR and build optimizations
- **React Best Practices**: Use functional components, React hooks properly, and avoid prop drilling

### Modularity & Configuration Guidelines

**IMPORTANT**: Follow these guidelines for all features and code changes:

1. **Centralized Constants**: Store all configurable values (phone numbers, emails, URLs, messages) in `src/utils/constants.ts`. Never hardcode values directly in components.

2. **Modular Components**: Build components that accept props for configuration. Use dependency injection pattern - pass configurable values as props with sensible defaults from constants.

3. **SOLID Principles** (moderate application):
   - **Single Responsibility**: Each component/function should do one thing well
   - **Open/Closed**: Components should be extendable via props without modifying source
   - **Interface Segregation**: Define focused interfaces, not bloated ones
   - **Dependency Inversion**: Depend on abstractions (props/interfaces) not concrete values

4. **Balance**: Apply these principles moderately. Don't over-engineer simple features. Use good judgment - a small component doesn't need full abstraction layers.

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production (runs TypeScript compiler + Vite build)
npm run build

# Lint codebase
npm run lint

# Preview production build
npm run preview
```

## Environment Setup

The project requires Supabase environment variables. Three environment files exist:
- `.env.development` - for local development
- `.env.production` - for production
- `.env.local` - local overrides

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Architecture

### Data Flow & State Management
- No global state management library (Redux, Zustand, etc.)
- Component-level state using React hooks (`useState`, `useEffect`)
- Navigation state passed via `react-router-dom`'s `location.state`
- Authentication state managed locally in `Navbar.tsx` with Supabase auth listeners

### Routing Structure
React Router DOM v7 with the following routes:
- `/` - Home page with hero and category grid
- `/products` - Products listing page (receives subcategory via location state)
- `/subcategory` - Subcategory listing page (receives category via location state)
- `/add_item` - Admin page for adding/editing/managing categories/subcategories/products (requires authentication)
- `/confirm-email` - Email confirmation page for new user registrations

### Navigation Pattern
The app uses a drill-down navigation pattern:
1. Home → CategoryGrid → navigate to `/subcategory` with `categoryId`, `categoryName`, `description`
2. SubCategory page → SubCategoryGrid → navigate to `/products` with `subCategoryId`, `subCategoryName`, `description`
3. Products page → ProductGrid displays filtered products based on `subCategoryId`

### Database Structure (Supabase)
Three main tables:
- `categories` - Top-level product categories (id, name, image_url, description, sort_number)
- `sub-categories` - Second-level categories linked to parent category (id, name, image_url, description, category_id, sort_number)
- `product` - Individual products (id, name, image_url[], price, quantity, thread_style, thread_size_pitch, fastener_length, head_height, Grade, Coating, part_number, sub_cat_id, sort_number)

Notes:
- Products use `image_url` as an array of strings for multiple product images
- All tables include `sort_number` field for controlling display order on the frontend
- All data is sorted by `sort_number` in ascending order when fetched

### Authentication & Authorization
- Supabase Auth integration via `src/utils/supabase.tsx`
- Modal-based authentication UI (`src/components/auth/AuthModal.tsx`) with signin/register modes
- Full authentication flow:
  - Email/password registration with email confirmation required
  - Email/password sign-in
  - Google OAuth sign-in (requires Supabase provider configuration)
  - Confirmation page at `/confirm-email` for post-registration email verification
- Auth state persisted via Supabase and synced with `onAuthStateChange` listener in Navbar

#### Admin Authorization
- **Admin Email**: `superadmin@threadcart.com` (hardcoded in `src/utils/adminCheck.ts`)
- **Frontend Protection**:
  - Admin Panel link only visible to admin user
  - `/add_item` route protected with admin check (shows Unauthorized page for non-admins)
  - All add/edit forms validate admin status before submission
- **Backend Protection** (CRITICAL):
  - Row Level Security (RLS) policies in Supabase database
  - Only admin email can INSERT/UPDATE/DELETE data
  - Even if frontend is bypassed, database rejects unauthorized operations
  - Public users can READ all data (categories, subcategories, products)
- **Setup Required**: Run `supabase_admin_setup.sql` in Supabase SQL Editor to enable RLS policies

### Image Handling
The app includes a Google Drive URL converter utility (`convertGoogleDriveUrl`) in `CategoryGrid.tsx` that transforms Drive sharing URLs into direct image URLs using the thumbnail API endpoint. This pattern may be reused in other components dealing with image URLs from Google Drive.

### Component Patterns
- **Loading states**: Skeleton components (e.g., `CategorySkeleton`)
- **Error states**: Reusable `ErrorState` component with retry functionality
- **Empty states**: Reusable `EmptyState` component
- **Expandable rows**: Products table in `ProductGrid.tsx` uses click-to-expand pattern with smooth transitions

### Styling
- Tailwind CSS v4.1.14 with custom theme colors defined in `tailwind.config.js`:
  - `primary`: #e11d48 (red)
  - `primary-hover`: #be123c
  - `background`: #f9f9f9
  - `text-primary`: #1f2937
  - `text-secondary`: #6b7280
  - `border`: #e5e7eb
- Uses `@tailwindcss/typography` plugin

### Build Tool
- Uses `rolldown-vite@7.1.14` (Vite alternative) with SWC for Fast Refresh
- React 19.1.1 with strict mode enabled
- TypeScript 5.9.3 with separate configs for app (`tsconfig.app.json`) and node (`tsconfig.node.json`)

## Key Files

### Core
- `src/utils/supabase.tsx` - Supabase client singleton
- `src/App.tsx` - Main app shell with routing
- `src/components/Navbar.tsx` - Global navigation with auth state

### Public-Facing Components
- `src/components/CategoryGrid.tsx` - Fetches and displays categories (sorted by sort_number), includes reusable state components (CategorySkeleton, ErrorState, EmptyState)
- `src/components/sub-categories/SubCategoryGrid.tsx` - Displays subcategories (sorted by sort_number)
- `src/components/product/ProductGrid.tsx` - Table view with expandable product details (sorted by sort_number)

### Admin Components
- `src/components/AddItems/AddItem.tsx` - Admin interface with toggle between "Add New" and "View & Edit" modes
- `src/components/AddItems/AddCategoryForm.tsx` - Form for adding categories
- `src/components/AddItems/AddSubCategoryForm.tsx` - Form for adding subcategories
- `src/components/AddItems/AddProductForm.tsx` - Form for adding products
- `src/components/AddItems/ManageCategories.tsx` - View/edit/delete categories
- `src/components/AddItems/ManageSubCategories.tsx` - View/edit/delete subcategories
- `src/components/AddItems/ManageProducts.tsx` - View/edit/delete products

### Authentication
- `src/components/auth/AuthModal.tsx` - Modal with sign-in/register forms and Google OAuth
- `src/pages/ConfirmEmail.tsx` - Email confirmation landing page

## Database Queries
All database queries use Supabase client methods:
```typescript
// Fetching with sorting (IMPORTANT: always sort by sort_number)
supabase.from("table_name").select("*").order("sort_number", { ascending: true })

// Fetching with filtering
supabase.from("table_name").select("*").eq("column", value)

// Fetching with filtering and sorting
supabase
  .from("table_name")
  .select("*")
  .order("sort_number", { ascending: true })
  .eq("column", value)

// Inserting data
supabase.from("table_name").insert([{ field1: value1, field2: value2, sort_number: 0 }])

// Updating data
supabase.from("table_name").update({ field: newValue }).eq("id", id)

// Deleting data
supabase.from("table_name").delete().eq("id", id)
```

Results always checked for `.error` and `.data` before processing.

## Admin Workflow

The `/add_item` page provides a comprehensive admin interface:
1. **Add New Mode**: Forms to create new categories, subcategories, and products
2. **View & Edit Mode**: List view of all items with inline editing and delete functionality
3. All forms include `sort_number` field to control display order
4. Edit mode allows admins to update all fields including sort order
5. Delete operations include confirmation dialogs with cascade warnings

## WhatsApp Business Integration

- **WhatsApp Business Number**: +91 9187142260
- **Implementation**: Simple Click-to-Chat using `wa.me` links
- **Component**: `src/components/common/FloatingWhatsApp.tsx`
- **Configuration**: All WhatsApp settings in `src/utils/constants.ts` under `WHATSAPP` object
- **Features**:
  - Floating button on bottom-right of all pages
  - Configurable default message, tooltip, and position
  - Opens WhatsApp Web (desktop) or WhatsApp app (mobile)
  - Uses `getWhatsAppUrl()` utility function for generating links

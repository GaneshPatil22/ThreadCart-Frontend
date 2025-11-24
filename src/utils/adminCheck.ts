import supabase from "./supabase";

const ADMIN_EMAIL = "superadmin@threadcart.com";

/**
 * Check if the current user is an admin
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    // Check if user email matches admin email
    return user.email === ADMIN_EMAIL;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get the current user's email
 * @returns Promise<string | null>
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.email ?? null;
  } catch (error) {
    console.error("Error getting user email:", error);
    return null;
  }
}

/**
 * Throw an error if the current user is not an admin
 * Use this in components/functions that require admin access
 */
export async function requireAdmin(): Promise<void> {
  const adminStatus = await isAdmin();

  if (!adminStatus) {
    throw new Error("Unauthorized: Admin access required");
  }
}

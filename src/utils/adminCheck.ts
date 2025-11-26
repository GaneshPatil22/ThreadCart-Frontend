import supabase from "./supabase";
import type { User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "superadmin@threadcart.com";

/**
 * Check if the current user is an admin
 * Can accept an optional user object to avoid redundant API calls
 * @param user - Optional user object from supabase.auth.getUser()
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdmin(user?: User | null): Promise<boolean> {
  try {
    // If user not provided, fetch it
    if (user === undefined) {
      const { data: { user: fetchedUser }, error } = await supabase.auth.getUser();

      if (error || !fetchedUser) {
        return false;
      }

      user = fetchedUser;
    }

    // If user is explicitly null, return false
    if (!user) {
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

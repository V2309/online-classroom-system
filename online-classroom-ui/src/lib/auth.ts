/**
 * Re-export auth functions for backward compatibility across server components / API routes.
 */
export { getCurrentUser } from "@/lib/auth-server";
export type { CurrentUserSession } from "@/lib/auth-server";

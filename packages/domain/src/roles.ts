/**
 * UI-level mirror of server-side permissions. NOT a security boundary: real enforcement is
 * Postgres RLS + triggers (supabase/migrations). Use this only to decide what to show.
 */
export type StaffRole = 'moderator' | 'admin';
export type Role = 'user' | StaffRole;
export const ADMIN_ACTIONS = ['moderate_listing', 'handle_report', 'view_audit_log', 'manage_categories', 'manage_communities', 'manage_users', 'grant_roles'] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

const MODERATOR: readonly AdminAction[] = ['moderate_listing', 'handle_report'];
export function can(role: Role, action: AdminAction): boolean {
  if (role === 'admin') return true;
  if (role === 'moderator') return MODERATOR.includes(action);
  return false;
}

import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "./_generated/dataModel";

/**
 * User role hierarchy (from highest to lowest privileges)
 * - OWNER: Complete system access and control
 * - ADMIN: Administrative access to most system functions
 * - FRIEND: Trusted user with additional permissions
 * - VISITOR: Basic authenticated user with limited access
 * - UNAUTHENTICATED: No role assigned, minimal access
 */
export enum UserRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  FRIEND = "FRIEND",
  VISITOR = "VISITOR",
  UNAUTHENTICATED = "UNAUTHENTICATED",
}

/**
 * Role assignments for specific users by name
 */
export const USER_ROLES: Record<string, UserRole> = {
  "Tan": UserRole.OWNER,  // System owner
  "Kiren": UserRole.ADMIN,  // Admin user
  // Add any additional admin users here with their exact name from the auth system
};

/**
 * Permission definitions that can be checked against roles
 */
export enum Permission {
  READ = "READ",
  WRITE = "WRITE",
  DELETE = "DELETE",
  ADMIN_ACCESS = "ADMIN_ACCESS",
  OWNER_ACCESS = "OWNER_ACCESS",
}

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    Permission.READ,
    Permission.WRITE,
    Permission.DELETE,
    Permission.ADMIN_ACCESS,
    Permission.OWNER_ACCESS,
  ],
  [UserRole.ADMIN]: [
    Permission.READ,
    Permission.WRITE,
    Permission.DELETE,
    Permission.ADMIN_ACCESS,
  ],
  [UserRole.FRIEND]: [
    Permission.READ,
    Permission.WRITE,
  ],
  [UserRole.VISITOR]: [
    Permission.READ,
  ],
  [UserRole.UNAUTHENTICATED]: [],
};

/**
 * Determines a user's role based on their identity
 * @param identity User identity from auth context
 * @returns UserRole assigned to the user
 */
export const getUserRole = (identity: Doc<"users">): UserRole => {
  if (identity === null || identity.email === undefined) {
    return UserRole.UNAUTHENTICATED;
  }
  
  console.log("User identity:", identity.email); // Log the user name for debugging
  return USER_ROLES[identity.email] || UserRole.VISITOR;
};

/**
 * Checks if a user has a specific permission
 * @param identity User identity from auth context
 * @param permission Permission to check for
 * @returns Boolean indicating whether the user has the permission
 */
export const hasPermission = (
  identity: Doc<"users">,
  permission: Permission
): boolean => {
  console.log("Checking permissions for:", identity?.email); // Log the user role for debugging
  const role = getUserRole(identity);
  return ROLE_PERMISSIONS[role].includes(permission);
};

/**
 * Helper: Validates user authentication and optionally checks for specific permissions
 * @param ctx Convex context object containing auth
 * @param requiredPermission Optional permission to verify
 * @returns User identity if authenticated and authorized
 * @throws Error if user is not authenticated or lacks required permission
 */
export const requireAuth = async (
  ctx: any,
  requiredPermission?: Permission
) => {
  const userId = await getAuthUserId(ctx);
  
  if (userId === null) {
    throw new Error("Unauthenticated call");
  }
  
  const identity: Doc<"users"> | null = await ctx.db.get(userId);
  if (identity === null) {
    throw new Error("User not found");
  }
  
  if (requiredPermission) {
    if (!hasPermission(identity, requiredPermission)) {
      throw new Error(`Missing required permission: ${requiredPermission}`);
    }
  }
  
  return identity;
};

import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import { QueryCtx } from "./_generated/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * User role hierarchy (from highest to lowest privileges)
 * - OWNER: Complete system access and control
 * - ADMIN: Administrative access to most system functions
 * - FRIEND: Trusted user with additional permissions
 * - VISITOR: Basic authenticated user with limited access
 * - UNAUTHENTICATED: No role assigned, minimal access
 */
export enum UserRole {
  OWNER = "owner",
  ADMIN = "admin",
  FRIEND = "friend",
  VISITOR = "visitor",
  UNAUTHENTICATED = "unauthenticated",
}

export const SYSTEM_OWNER = "Tan"

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
  console.log("User identity:", identity.email); // Log the user name for debugging
  // return USER_ROLES[identity.email] || UserRole.VISITOR;
  // Ensure the returned value is a valid UserRole enum value
  switch (identity.role) {
    case "owner":
      return UserRole.OWNER;
    case "admin":
      return UserRole.ADMIN;
    case "friend":
      return UserRole.FRIEND;
    case "visitor":
      return UserRole.VISITOR;
    default:
      return UserRole.UNAUTHENTICATED;
  }

};

/**
 * Checks if a user has a specific permission
 * @param userRole User role to check permissions for
 * @param permission Permission to check for
 * @returns Boolean indicating whether the user role has the permission
 */
export const hasPermission = (
  userRole: UserRole,
  permission: Permission
): boolean => {
  return ROLE_PERMISSIONS[userRole].includes(permission);
};

/**
 * Helper: Validates user authentication and optionally checks for specific permissions
 * @param ctx Convex context object containing auth
 * @param requiredPermission Optional permission to verify
 * @returns User identity if authenticated and authorized
 * @throws Error if user is not authenticated or lacks required permission
 */
export const requireAuth = async (
  ctx: QueryCtx | MutationCtx,
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

  const userRole = getUserRole(identity);
  
  if (requiredPermission) {
    if (!hasPermission(userRole, requiredPermission)) {
      throw new Error(`Missing required permission: ${requiredPermission}`);
    }
  }
  
  return identity;
};

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx, Permission.ADMIN_ACCESS);
    return await ctx.db.query("users").collect();
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("friend"), v.literal("visitor")),
  },
  handler: async (ctx, { userId, role }) => {
    const identity = await requireAuth(ctx, Permission.OWNER_ACCESS);
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new Error("Invalid role");
    }
    if (identity.email !== SYSTEM_OWNER) {
      console.log("This case should never happen");
      throw new Error("Owner role must belong by the system owner");
    }
    
    await ctx.db.patch(userId, { role });
    return null;
  },
});

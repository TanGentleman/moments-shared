import { v } from "convex/values";
import { query } from "../_generated/server";
import { UserRole, getUserRole, requireAuth, Permission } from "../admin";
import { TAG_VISIBILITY } from "../lifelogs/access";
import { Doc } from "../_generated/dataModel";
/**
 * List all tags with their visibility scopes
 * Filters tags based on user's role and visibility permissions
 */
export const list = query({
  returns: v.array(v.object({
    _id: v.id("tags"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    createdBy: v.string(),
    visibilityScope: v.string(),
  })),
  handler: async (ctx) => {
    const identity = await requireAuth(ctx, Permission.READ);
    const userRole = getUserRole(identity);

    // Get all tags
    const tags = await ctx.db.query("tags").collect();
    
    // If user is owner or admin, show all tags
    if (userRole === UserRole.OWNER || userRole === UserRole.ADMIN) {
      return tags;
    }
    
    // For other users, only show tags they have access to based on visibility scope
    return tags.filter(tag => {
      // If tag has no visibility scope, use default (admin-only)
      const visibilityScope = tag.visibilityScope || "admin-only";
      const allowedRoles = TAG_VISIBILITY[visibilityScope] || [];
      return allowedRoles.includes(userRole);
    });
  },
});

/**
 * List visibility scopes available for tags
 */
export const visibilityScopes = query({
  handler: async (ctx) => {
    // Require admin access to view visibility scopes
    const identity = await requireAuth(ctx, Permission.ADMIN_ACCESS);
    
    return Object.keys(TAG_VISIBILITY).map(scope => ({
      id: scope,
      name: scope.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      roles: TAG_VISIBILITY[scope as keyof typeof TAG_VISIBILITY],
    }));
  },
}); 
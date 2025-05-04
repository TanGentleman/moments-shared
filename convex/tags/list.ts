import { query } from "../_generated/server";
import { UserRole, getUserRole, requireAuth, Permission } from "../admin";
import { TAG_VISIBILITY, Tag } from "../lifelogs/access";

/**
 * List all tags with their visibility scopes
 * No filtering required as we're fetching all tags
 */
export const list = query({
  handler: async (ctx) => {
    // const identity = await requireAuth(ctx);
    const identity = await requireAuth(ctx, Permission.READ);
    // If user is owner or admin, show all tags
    const userRole = getUserRole(identity);

    // Get all tags
    const tags = await ctx.db.query("tags").collect() as Tag[];
    if (userRole === UserRole.OWNER || userRole === UserRole.ADMIN) {
      return tags;
    }
    
    // For other users, only show tags they have access to
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
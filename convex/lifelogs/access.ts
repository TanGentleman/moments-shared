import { UserRole, getUserRole } from "../admin";
import { QueryCtx } from "../_generated/server";
import { MutationCtx } from "../_generated/server";

/**
 * Tag visibility scopes mapping to user roles
 * This allows tags to control which user roles can see tagged content
 */
export const TAG_VISIBILITY: Record<string, UserRole[]> = {
  "owner-only": [UserRole.OWNER],
  "admin-only": [UserRole.OWNER, UserRole.ADMIN],
  "friends": [UserRole.OWNER, UserRole.ADMIN, UserRole.FRIEND],
  "public": [UserRole.OWNER, UserRole.ADMIN, UserRole.FRIEND, UserRole.VISITOR],
};

/**
 * Helper function to check if a user has access to a lifelog based on its tags
 * Uses the by_lifelog_id index for efficient querying
 */
export const hasAccessToLifelog = async (
  ctx: QueryCtx | MutationCtx,
  lifelogId: string,
  userRole: UserRole
) => {
  // Owners and admins have access to everything
  if (userRole === UserRole.OWNER || userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Get tags for this lifelog using the by_lifelog_id index
  const lifelogTags = await ctx.db
    .query("lifelogTags")
    .withIndex("by_lifelog_id", (q) => q.eq("lifelogId", lifelogId))
    .collect();
    
  // If no tags, default to admin-only access
  if (lifelogTags.length === 0) {
    return false; // Non-admins can't access untagged content
  }
  
  // Check each tag's visibility scope
  for (const lifelogTag of lifelogTags) {
    const tag = await ctx.db.get(lifelogTag.tagId);
    if (!tag) continue;
    
    // If tag has visibility scope, check if user role is allowed
    if (tag.visibilityScope && TAG_VISIBILITY[tag.visibilityScope]) {
      const allowedRoles = TAG_VISIBILITY[tag.visibilityScope];
      if (allowedRoles.includes(userRole)) {
        return true;
      }
    }
  }
  
  // No tag grants access
  return false;
}; 
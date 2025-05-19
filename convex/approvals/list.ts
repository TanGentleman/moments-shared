import { query } from "../_generated/server";
import { requireAuth, Permission } from "../admin";
import { LifelogWithApproval } from "../types";

/**
 * Get lifelogs pending approval (admin only)
 * Uses the by_status index for efficient querying
 */
export const list = query({
  handler: async (ctx) => {
    // Require admin access to view pending approvals
    const identity = await requireAuth(ctx, Permission.ADMIN_ACCESS);

    // Get all pending approvals using the by_status index
    const pendingApprovals = await ctx.db
      .query("approvals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const result: LifelogWithApproval[] = [];
    for (const approval of pendingApprovals) {
      // Get the lifelog for each approval using by_lifelog_id index
      const lifelog = await ctx.db
        .query("lifelogs")
        .withIndex("by_lifelog_id", (q) => q.eq("lifelogId", approval.lifelogId))
        .unique();

      if (lifelog) {
        result.push({
          ...lifelog,
          approval: {
            ...approval,
            _id: approval._id,
          },
        });
      }
      else {
        console.error(`Lifelog not found for approval ${approval._id}`);
      }
    }

    return result;
  },
}); 
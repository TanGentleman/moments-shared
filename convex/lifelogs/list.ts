import { query } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { UserRole, requireAuth, getUserRole } from "../admin";
import { hasAccessToLifelog, TAG_VISIBILITY } from "./access";
import { Id } from "../_generated/dataModel";

/**
 * List all lifelogs with filters and pagination
 * Uses appropriate indexes based on filter criteria
 */
export const list = query({
  args: {
    filters: v.optional(
      v.object({
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        approvalStatus: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected")
          )
        ),
        tagIds: v.optional(v.array(v.string())),
        visibilityScope: v.optional(v.string()),
      })
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    lifelogs: v.array(v.any())
  }),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);

    // Start with base query
    const query = ctx.db.query("lifelogs");
    
    // Apply date filters using by_start_time index if we have a start date
    let filteredQuery = args.filters?.startDate
      ? query.withIndex("by_start_time", (q) => 
          q.gte("startTime", args.filters!.startDate!)
        )
      : query;
      
    // Execute the query with pagination
    const lifelogs = await filteredQuery.paginate(args.paginationOpts);
    let filteredLifelogs = lifelogs.page;

    // Approval status filter using by_status index
    if (args.filters?.approvalStatus !== undefined) {
      const lifelogIds = filteredLifelogs.map(l => l.lifelogId);

      const approvals = await ctx.db
        .query("approvals")
        .withIndex("by_status", (q) => q.eq("status", args.filters!.approvalStatus!))
        .collect();

      const approvedLifelogIds = new Set(
        approvals
          .filter(a => lifelogIds.includes(a.lifelogId))
          .map(a => a.lifelogId)
      );

      filteredLifelogs = filteredLifelogs.filter(l =>
        approvedLifelogIds.has(l.lifelogId)
      );
    }

    // Tag filter using by_tag index for efficiency
    if (args.filters?.tagIds !== undefined && args.filters.tagIds.length > 0) {
      const lifelogIds = filteredLifelogs.map(l => l.lifelogId);
      const foundTagIds: Id<"tags">[] = [];
      const stringTagIds: string[] = [];
      
      // First resolve any tag names to tag IDs
      for (const tagIdOrName of args.filters.tagIds) {
        if (tagIdOrName.startsWith("tags:")) {
          stringTagIds.push(tagIdOrName);
          continue;
        }
        
        // Use by_name index to efficiently find tag by name
        const tag = await ctx.db
          .query("tags")
          .withIndex("by_name", (q) => q.eq("name", tagIdOrName))
          .unique();
          
        if (tag) foundTagIds.push(tag._id);
      }
      
      // Build a map of lifelog ID to set of tag IDs for filtering
      const lifelogToTags = new Map<string, Set<string>>();
      
      // Process resolved tag IDs from the database
      for (const tagId of foundTagIds) {
        const tagsForLifelogs = await ctx.db
          .query("lifelogTags")
          .withIndex("by_tag", (q) => q.eq("tagId", tagId))
          .collect();
          
        for (const lt of tagsForLifelogs) {
          if (!lifelogToTags.has(lt.lifelogId)) {
            lifelogToTags.set(lt.lifelogId, new Set());
          }
          lifelogToTags.get(lt.lifelogId)!.add(lt.tagId.toString());
        }
      }
      
      // Process string tag IDs (if any)
      for (const tagIdString of stringTagIds) {
        // Handle string tag IDs separately if needed
        // This depends on your application logic
        // For now, we'll just skip them
      }

      // Filter lifelogs based on tag matches
      filteredLifelogs = filteredLifelogs.filter(lifelog => {
        const lifelogTagIds = lifelogToTags.get(lifelog.lifelogId);
        if (!lifelogTagIds) return false;
        
        // Check if all found tag IDs are present
        return foundTagIds.every(tagId => 
          lifelogTagIds.has(tagId.toString())
        );
      });
    }
    
    // Visibility scope filter (admins can see all)
    if (args.filters?.visibilityScope !== undefined && userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
      const allowedRoles = TAG_VISIBILITY[args.filters.visibilityScope] || [];
      if (!allowedRoles.includes(userRole)) {
        filteredLifelogs = [];
      }
    }
    
    // Filter by tag-based access
    const accessibleLifelogs = [];
    for (const lifelog of filteredLifelogs) {
      const hasAccess = await hasAccessToLifelog(ctx, lifelog.lifelogId, userRole);
      if (hasAccess) {
        accessibleLifelogs.push(lifelog);
      }
    }

    return {
      lifelogs: accessibleLifelogs,
    };
  },
});

/**
 * Get paginated approved lifelogs, filtered by user's access level
 * Uses the by_status index for approval filtering and by_start_time for sorting
 */
export const approved = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);
    // Get all approved lifelogs using the by_status index
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();
    
    if (approvals.length === 0) {
      // No approved lifelogs at all
      return {
        lifelogs: [],
        continueCursor: null,
        totalCount: 0,
      };
    }
    
    const approvedLifelogIds = approvals.map(a => a.lifelogId);
    
    // Get matching lifelogs in descending order of start time
    const allLifelogs = [];
    
    for (const lifelogId of approvedLifelogIds) {
      // Find the lifelog with this ID using by_lifelog_id index
      const lifelog = await ctx.db
        .query("lifelogs")
        .withIndex("by_lifelog_id", (q) => q.eq("lifelogId", lifelogId))
        .unique();
      
      if (lifelog) {
        // Check tag-based access
        const hasAccess = await hasAccessToLifelog(ctx, lifelog.lifelogId, userRole);
        if (hasAccess) {
          allLifelogs.push(lifelog);
        }
      }
    }
    
    // Sort by startTime descending
    allLifelogs.sort((a, b) => b.startTime - a.startTime);
    
    // Set the limit with a default of 10
    const limit = args.limit ?? 10;
    
    // Handle pagination manually
    let paginatedResults = allLifelogs;
    let hasContinuation = false;
    let nextCursor: string | null = null;
    
    if (args.cursor) {
      // Find the index of the cursor
      const cursorIndex = allLifelogs.findIndex(
        (lifelog) => lifelog._id.toString() === args.cursor
      );
      
      if (cursorIndex !== -1) {
        // Get items after the cursor
        paginatedResults = allLifelogs.slice(cursorIndex + 1);
      }
    }
    
    // Apply limit
    if (paginatedResults.length > limit) {
      hasContinuation = true;
      nextCursor = paginatedResults[limit - 1]._id.toString();
      paginatedResults = paginatedResults.slice(0, limit);
    }
    
    return {
      lifelogs: paginatedResults,
      continueCursor: hasContinuation ? nextCursor : null,
      totalCount: allLifelogs.length,
    };
  }
}); 

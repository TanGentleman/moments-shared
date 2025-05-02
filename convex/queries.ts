import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import {
  ApprovalStatus,
  LifelogComplete,
  LifelogFilters,
  LifelogWithApproval,
  LifelogWithTags,
} from "./types";

// Helper: Auth check
async function requireAuth(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Unauthenticated call to query");
  }
  return identity;
}

// Fetch a single lifelog by ID with approval status
export const getLifelogWithApproval = query({
  args: { lifelogId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const lifelog = await ctx.db
      .query("lifelogs")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();

    if (!lifelog) return null;

    const approval = await ctx.db
      .query("approvals")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();

    return {
      ...lifelog,
      approval,
    } as LifelogWithApproval;
  },
});

// Fetch a single lifelog by ID with tags
export const getLifelogWithTags = query({
  args: { lifelogId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const lifelog = await ctx.db
      .query("lifelogs")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();

    if (!lifelog) return null;

    const lifelogTags = await ctx.db
      .query("lifelogTags")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .collect();

    const tags = [];
    for (const lifelogTag of lifelogTags) {
      const tag = await ctx.db.get(lifelogTag.tagId);
      if (tag) tags.push(tag);
    }

    return {
      ...lifelog,
      tags,
    } as LifelogWithTags;
  },
});

// Fetch a complete lifelog with approval and tags
export const getLifelogComplete = query({
  args: { lifelogId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const lifelog = await ctx.db
      .query("lifelogs")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();

    if (!lifelog) return null;

    const approval = await ctx.db
      .query("approvals")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();

    const lifelogTags = await ctx.db
      .query("lifelogTags")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .collect();

    const tags = [];
    for (const lifelogTag of lifelogTags) {
      const tag = await ctx.db.get(lifelogTag.tagId);
      if (tag) tags.push(tag);
    }

    return {
      ...lifelog,
      approval,
      tags,
    } as LifelogComplete;
  },
});

// Fetch the latest lifelog (optionally filtered by approval status)
export const getLatestLifelog = query({
  args: {
    approvalStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    // Start with all lifelogs, order by startTime descending
    let lifelogsQuery = ctx.db.query("lifelogs").order("desc");

    // If approvalStatus is not provided, filter by approval
    const approvalStatus = args.approvalStatus ?? "approved";
    if (approvalStatus !== undefined) {
      // Get all approvals with the given status
      const approvals = await ctx.db
        .query("approvals")
        .withIndex("by_status", q => q.eq("status", approvalStatus))
        .collect();

      const approvedLifelogIds = new Set(approvals.map(a => a.lifelogId));

      // Find the latest lifelog with matching approval
      const lifelogs = await lifelogsQuery.collect();
      const latest = lifelogs.find(l => approvedLifelogIds.has(l.lifelogId));
      if (!latest) return null;

      // Get approval object
      const approval = approvals.find(a => a.lifelogId === latest.lifelogId) ?? null;
      return {
        ...latest,
        approval,
      } as LifelogWithApproval;
    } else {
      // No approval filter, just get latest lifelog
      const latest = await lifelogsQuery.first();
      if (!latest) return null;

      // Get approval object if exists
      const approval = await ctx.db
        .query("approvals")
        .filter(q => q.eq(q.field("lifelogId"), latest.lifelogId))
        .first();

      return {
        ...latest,
        approval,
      } as LifelogWithApproval;
    }
  },
});

// List all lifelogs with filters and pagination
export const listLifelogs = query({
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
      })
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    let lifelogsQuery = ctx.db.query("lifelogs");

    if (args.filters?.startDate) {
      lifelogsQuery = lifelogsQuery.filter(q =>
        q.gte(q.field("startTime"), args.filters!.startDate!)
      );
    }
    if (args.filters?.endDate) {
      lifelogsQuery = lifelogsQuery.filter(q =>
        q.lte(q.field("endTime"), args.filters!.endDate!)
      );
    }

    const lifelogs = await lifelogsQuery.paginate(args.paginationOpts);

    let filteredLifelogs = lifelogs.page;

    // Approval status filter
    if (args.filters?.approvalStatus) {
      const lifelogIds = filteredLifelogs.map(l => l.lifelogId);

      const approvals = await ctx.db
        .query("approvals")
        .filter(q => q.eq(q.field("status"), args.filters!.approvalStatus!))
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

    // Tag filter
    if (args.filters?.tagIds && args.filters.tagIds.length > 0) {
      const lifelogIds = filteredLifelogs.map(l => l.lifelogId);

      const lifelogTags = await ctx.db
        .query("lifelogTags")
        .collect();

      const relevantLifelogTags = lifelogTags.filter(lt =>
        lifelogIds.includes(lt.lifelogId)
      );

      const lifelogToTags = new Map<string, Set<Id<"tags">>>();
      for (const lt of relevantLifelogTags) {
        if (!lifelogToTags.has(lt.lifelogId)) {
          lifelogToTags.set(lt.lifelogId, new Set());
        }
        lifelogToTags.get(lt.lifelogId)!.add(lt.tagId);
      }

      const tagIds: Id<"tags">[] = [];
      for (const tagIdOrName of args.filters.tagIds) {
        if (tagIdOrName.startsWith("tags:")) {
          tagIds.push(tagIdOrName as Id<"tags">);
          continue;
        }
        const tag = await ctx.db
          .query("tags")
          .filter(q => q.eq(q.field("name"), tagIdOrName))
          .first();
        if (tag) tagIds.push(tag._id);
      }

      filteredLifelogs = filteredLifelogs.filter(lifelog => {
        const lifelogTagIds = lifelogToTags.get(lifelog.lifelogId);
        if (!lifelogTagIds) return false;
        return tagIds.every(tagId => lifelogTagIds.has(tagId));
      });
    }

    return {
      lifelogs: filteredLifelogs,
    };
  },
});

// List all tags
export const listTags = query({
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query("tags").collect();
  },
});

// Get lifelogs pending approval
export const getPendingApprovals = query({
  handler: async (ctx) => {
    await requireAuth(ctx);

    const pendingApprovals = await ctx.db
      .query("approvals")
      .filter(q => q.eq(q.field("status"), "pending"))
      .collect();

    const result: LifelogWithApproval[] = [];
    for (const approval of pendingApprovals) {
      const lifelog = await ctx.db
        .query("lifelogs")
        .filter(q => q.eq(q.field("lifelogId"), approval.lifelogId))
        .first();

      if (lifelog) {
        result.push({
          ...lifelog,
          approval: {
            ...approval,
            _id: approval._id,
          },
        });
      }
    }

    return result;
  },
});

// Get paginated approved lifelogs
export const getPaginatedApprovedLifelogs = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    
    // Get all approved lifelogs
    const approvals = await ctx.db
      .query("approvals")
      .filter(q => q.eq(q.field("status"), "approved"))
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
    // Filter directly by the approved lifelogIds for better matching
    const lifelogResults = [];
    let continueCursor = null;
    
    // Set the limit with a default of 10
    const limit = args.limit ?? 10;
    
    for (const lifelogId of approvedLifelogIds) {
      // Find the lifelog with this ID
      const lifelog = await ctx.db
        .query("lifelogs")
        .filter(q => q.eq(q.field("lifelogId"), lifelogId))
        .first();
      
      if (lifelog) {
        lifelogResults.push(lifelog);
      }
    }
    
    // Sort by startTime descending
    lifelogResults.sort((a, b) => b.startTime - a.startTime);
    
    // Handle pagination manually
    let paginatedResults = lifelogResults;
    let hasContinuation = false;
    
    if (args.cursor) {
      // Find the index of the cursor
      const cursorIndex = lifelogResults.findIndex(
        (lifelog) => lifelog._id.toString() === args.cursor
      );
      
      if (cursorIndex !== -1) {
        // Get items after the cursor
        paginatedResults = lifelogResults.slice(cursorIndex + 1);
      }
    }
    
    // Apply limit
    if (paginatedResults.length > limit) {
      hasContinuation = true;
      continueCursor = paginatedResults[limit - 1]._id.toString();
      paginatedResults = paginatedResults.slice(0, limit);
    }
    
    return {
      lifelogs: paginatedResults,
      continueCursor: hasContinuation ? continueCursor : null,
      totalCount: lifelogResults.length,
    };
  }
});
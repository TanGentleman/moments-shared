import { query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  LifelogComplete,
  LifelogWithApproval,
  LifelogWithTags,
} from "../types";

import { 
  requireAuth, 
  Permission, 
  UserRole,
  getUserRole,
  hasPermission,
} from "../admin";

import { hasAccessToLifelog } from "./access";

/**
 * Fetch a single lifelog by ID with approval status
 * Uses the by_lifelog_id index for efficient querying
 */
export const get = query({
  args: { lifelogId: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);

    const lifelog = await ctx.db
      .query("lifelogs")
      .withIndex("by_lifelog_id", q => q.eq("lifelogId", args.lifelogId))
      .unique();

    if (!lifelog) return null;
    
    // Check access based on tags
    const hasAccess = await hasAccessToLifelog(ctx, args.lifelogId, userRole);
    if (!hasAccess) {
      console.log("User with role", userRole, "does not have permission to view this lifelog");
      return null;
    }

    const approval = await ctx.db
      .query("approvals")
      .withIndex("by_lifelog_id", q => q.eq("lifelogId", args.lifelogId))
      .unique();

    return {
      ...lifelog,
      approval,
    } as LifelogWithApproval;
  },
});

/**
 * Fetch a single lifelog by ID with tags
 * Uses the by_lifelog_id and by_lifelog_id indexes for efficient querying
 */
export const withTags = query({
  args: { lifelogId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);

    const lifelog = await ctx.db
      .query("lifelogs")
      .withIndex("by_lifelog_id", q => q.eq("lifelogId", args.lifelogId))
      .unique();

    if (lifelog === null) return null;
    
    // Check access based on tags
    const hasAccess = await hasAccessToLifelog(ctx, args.lifelogId, userRole);
    if (!hasAccess) {
      console.log("User with role", userRole, "does not have permission to view this lifelog");
      return null;
    }

    const lifelogTags = await ctx.db
      .query("lifelogTags")
      .withIndex("by_lifelog_id", q => q.eq("lifelogId", args.lifelogId))
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

/**
 * Fetch a complete lifelog with approval and tags
 * Uses the by_lifelog_id, by_lifelog_id, and by_lifelog_id indexes for efficient querying
 */
export const complete = query({
  args: { lifelogId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);

    const lifelog = await ctx.db
      .query("lifelogs")
      .withIndex("by_lifelog_id", q => q.eq("lifelogId", args.lifelogId))
      .unique();

    if (!lifelog) return null;
    
    // Special case: Always allow access during approval workflow for admins
    const isApprovalWorkflow = hasPermission(userRole, Permission.ADMIN_ACCESS);
    
    if (!isApprovalWorkflow) {
      // Check regular access based on tags
      const hasAccess = await hasAccessToLifelog(ctx, args.lifelogId, userRole);
      if (!hasAccess) {
        console.log("User with role", userRole, "does not have permission to view this lifelog");
        return null;
      }
    }

    const approval = await ctx.db
      .query("approvals")
      .withIndex("by_lifelog_id", q => q.eq("lifelogId", args.lifelogId))
      .unique();

    const lifelogTags = await ctx.db
      .query("lifelogTags")
      .withIndex("by_lifelog_id", q => q.eq("lifelogId", args.lifelogId))
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

/**
 * Fetch the latest lifelog (optionally filtered by approval status)
 * Uses the by_status and by_start_time indexes for efficient querying
 */
export const latest = query({
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
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);
    // If approvalStatus is not provided, default to approved
    const approvalStatus = args.approvalStatus ?? "approved";
    
    // Get all approvals with the given status using the by_status index
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_status", q => q.eq("status", approvalStatus))
      .collect();

    const approvedLifelogIds = new Set(approvals.map(a => a.lifelogId));

    // Find all lifelogs, ordered by startTime descending using by_start_time index
    const lifelogs = await ctx.db
      .query("lifelogs")
      .withIndex("by_start_time")
      .order("desc")
      .collect();
    
    // Filter by approval status and then by tag-based access
    const accessibleLifelogs = [];
    for (const lifelog of lifelogs) {
      if (approvedLifelogIds.has(lifelog.lifelogId)) {
        const hasAccess = await hasAccessToLifelog(ctx, lifelog.lifelogId, userRole);
        if (hasAccess) {
          accessibleLifelogs.push(lifelog);
        }
      }
    }
    
    // Get the latest accessible lifelog
    const latest = accessibleLifelogs.length > 0 ? accessibleLifelogs[0] : null;
    if (!latest) return null;

    // Get approval object
    const approval = approvals.find(a => a.lifelogId === latest.lifelogId) ?? null;
    
    return {
      ...latest,
      approval,
    } as LifelogWithApproval;
  },
});

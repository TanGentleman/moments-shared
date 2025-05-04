import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireAuth, Permission, UserRole, getUserRole } from "./admin";
import { TAG_VISIBILITY } from "./queries";

// Extended tag type with visibility scope
interface Tag {
  _id: Id<"tags">;
  _creationTime: number;
  name: string;
  color?: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  visibilityScope?: string;
}

/**
 * Approve a lifelog
 */
export const approveLifelog = mutation({
  args: {
    lifelogId: v.string(),
    comments: v.optional(v.string()),
    visibilityScope: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx, Permission.ADMIN_ACCESS);

    // Get user information from identity
    
    // Check if the lifelog exists
    const lifelog = await ctx.db
      .query("lifelogs")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();
      
    if (!lifelog) {
      throw new Error(`Lifelog with ID ${args.lifelogId} not found`);
    }
    
    // Check if an approval record already exists
    const existingApproval = await ctx.db
      .query("approvals")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();
    
    // Apply visibility scope tag if provided
    if (args.visibilityScope) {
      // Find or create a tag for the visibility scope
      const scopeTagName = `scope:${args.visibilityScope}`;
      
      // Check if tag already exists
      const existingTag = await ctx.db
        .query("tags")
        .filter(q => q.eq(q.field("name"), scopeTagName))
        .first() as Tag | null;
        
      let tagId: Id<"tags">;
      
      if (existingTag) {
        tagId = existingTag._id;
      } else {
        // Create a new tag for this visibility scope
        tagId = await ctx.db.insert("tags", {
          name: scopeTagName,
          description: `Visibility: ${args.visibilityScope}`,
          color: "#5D8AA8", // Default blue for visibility tags
          createdBy: identity.email!,
          createdAt: Date.now(),
          visibilityScope: args.visibilityScope,
        });
      }
      
      // Add the tag to the lifelog if not already there
      const existingAssociation = await ctx.db
        .query("lifelogTags")
        .filter(q => 
          q.and(
            q.eq(q.field("lifelogId"), args.lifelogId),
            q.eq(q.field("tagId"), tagId)
          )
        )
        .first();
      
      if (!existingAssociation) {
        await ctx.db.insert("lifelogTags", {
          lifelogId: args.lifelogId,
          tagId,
          addedBy: identity.email!,
          addedAt: Date.now(),
        });
      }
    }
    
    if (existingApproval) {
      // Update existing approval
      return await ctx.db.patch(existingApproval._id, {
        status: "approved",
        reviewerId: identity.email!,
        reviewedAt: Date.now(),
        comments: args.comments,
      });
    } else {
      // Create new approval
      return await ctx.db.insert("approvals", {
        lifelogId: args.lifelogId,
        status: "approved",
        reviewerId: identity.email!,
        reviewedAt: Date.now(),
        comments: args.comments,
      });
    }
  },
});

/**
 * Reject a lifelog
 */
export const rejectLifelog = mutation({
  args: {
    lifelogId: v.string(),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx, Permission.ADMIN_ACCESS);
    
    // Check if the lifelog exists
    const lifelog = await ctx.db
      .query("lifelogs")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();
      
    if (!lifelog) {
      throw new Error(`Lifelog with ID ${args.lifelogId} not found`);
    }
    
    // Check if an approval record already exists
    const existingApproval = await ctx.db
      .query("approvals")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();
    
    if (existingApproval) {
      // Update existing approval
      return await ctx.db.patch(existingApproval._id, {
        status: "rejected",
        reviewerId: identity.email!,
        reviewedAt: Date.now(),
        comments: args.comments,
      });
    } else {
      // Create new approval
      return await ctx.db.insert("approvals", {
        lifelogId: args.lifelogId,
        status: "rejected",
        reviewerId: identity.email!,
        reviewedAt: Date.now(),
        comments: args.comments,
      });
    }
  },
});

/**
 * Create a new tag with optional visibility scope
 */
export const createTag = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    visibilityScope: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);
    
    // Only admins and owners can create tags with visibility scopes
    if (args.visibilityScope && userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
      throw new Error("Only admins can create tags with visibility scopes");
    }
    
    // Validate visibility scope if provided
    if (args.visibilityScope && !TAG_VISIBILITY[args.visibilityScope]) {
      throw new Error(`Invalid visibility scope: ${args.visibilityScope}`);
    }

    // Get all tags and manually check for case-insensitive match
    const allTags = await ctx.db.query("tags").collect();
    const existingTag = allTags.find(
      tag => tag.name.toLowerCase() === args.name.toLowerCase()
    );
    
    if (existingTag) {
      return existingTag._id;
    }
    
    // Create the new tag
    return await ctx.db.insert("tags", {
      name: args.name,
      description: args.description,
      color: args.color,
      createdBy: identity.email!,
      createdAt: Date.now(),
      visibilityScope: args.visibilityScope,
    });
  },
});

/**
 * Update a tag's properties including visibility scope
 */
export const updateTag = mutation({
  args: {
    tagId: v.id("tags"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    visibilityScope: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);

    // Only admins and owners can update tags with visibility scopes
    if (args.visibilityScope && userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
      throw new Error("Only admins can update tags with visibility scopes");
    }
    
    // Validate visibility scope if provided
    if (args.visibilityScope && !TAG_VISIBILITY[args.visibilityScope]) {
      throw new Error(`Invalid visibility scope: ${args.visibilityScope}`);
    }
    
    // Get the existing tag
    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      throw new Error(`Tag with ID ${args.tagId} not found`);
    }
    
    // Update fields
    const updates: Record<string, any> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.color !== undefined) updates.color = args.color;
    if (args.visibilityScope !== undefined) updates.visibilityScope = args.visibilityScope;
    
    // Apply updates
    return await ctx.db.patch(args.tagId, updates);
  },
});

/**
 * Add a tag to a lifelog
 */
export const addTagToLifelog = mutation({
  args: {
    lifelogId: v.string(),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);
    
    // Only admins and owners can add tags to lifelogs
    if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
      throw new Error("Only admins can add tags to lifelogs");
    }

    // Check if the lifelog exists
    const lifelog = await ctx.db
      .query("lifelogs")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();
      
    if (!lifelog) {
      throw new Error(`Lifelog with ID ${args.lifelogId} not found`);
    }
    
    // Check if the tag exists
    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      throw new Error(`Tag with ID ${args.tagId} not found`);
    }
    
    // Check if the association already exists
    const existingAssociation = await ctx.db
      .query("lifelogTags")
      .filter(q => 
        q.and(
          q.eq(q.field("lifelogId"), args.lifelogId),
          q.eq(q.field("tagId"), args.tagId)
        )
      )
      .first();
    
    if (existingAssociation) {
      // Association already exists, return it
      return existingAssociation._id;
    }
    
    // Create the new association
    return await ctx.db.insert("lifelogTags", {
      lifelogId: args.lifelogId,
      tagId: args.tagId,
      addedBy: identity.email!,
      addedAt: Date.now(),
    });
  },
});

/**
 * Remove a tag from a lifelog
 */
export const removeTagFromLifelog = mutation({
  args: {
    lifelogId: v.string(),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userRole = getUserRole(identity);
    
    // Only admins and owners can remove tags from lifelogs
    if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
      throw new Error("Only admins can remove tags from lifelogs");
    }
    
    // Find the association
    const association = await ctx.db
      .query("lifelogTags")
      .filter(q => 
        q.and(
          q.eq(q.field("lifelogId"), args.lifelogId),
          q.eq(q.field("tagId"), args.tagId)
        )
      )
      .first();
    
    if (!association) {
      throw new Error(`Tag association not found for lifelog ${args.lifelogId} and tag ${args.tagId}`);
    }
    
    // Delete the association
    await ctx.db.delete(association._id);
    
    return true;
  },
});

/**
 * Set visibility scope on a lifelog by adding the appropriate tag
 */
export const setLifelogVisibility = mutation({
  args: {
    lifelogId: v.string(),
    visibilityScope: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx, Permission.ADMIN_ACCESS);
    
    // Validate visibility scope
    if (!TAG_VISIBILITY[args.visibilityScope]) {
      throw new Error(`Invalid visibility scope: ${args.visibilityScope}`);
    }
    
    // Check if the lifelog exists
    const lifelog = await ctx.db
      .query("lifelogs")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .first();
      
    if (!lifelog) {
      throw new Error(`Lifelog with ID ${args.lifelogId} not found`);
    }
    
    // Remove any existing visibility scope tags
    const existingScopeTags = await ctx.db
      .query("lifelogTags")
      .filter(q => q.eq(q.field("lifelogId"), args.lifelogId))
      .collect();
      
    for (const tagAssoc of existingScopeTags) {
      const tag = await ctx.db.get(tagAssoc.tagId) as Tag | null;
      
      // Delete existing scope tag associations
      if (tag && tag.name.startsWith("scope:")) {
        await ctx.db.delete(tagAssoc._id);
      }
    }
    
    // Create or get scope tag
    const scopeTagName = `scope:${args.visibilityScope}`;
    
    // Check if tag already exists
    const existingTag = await ctx.db
      .query("tags")
      .filter(q => q.eq(q.field("name"), scopeTagName))
      .first() as Tag | null;
      
    let tagId: Id<"tags">;
    
    if (existingTag) {
      tagId = existingTag._id;
    } else {
      // Create a new tag for this visibility scope
      tagId = await ctx.db.insert("tags", {
        name: scopeTagName,
        description: `Visibility: ${args.visibilityScope}`,
        color: "#5D8AA8", // Default blue for visibility tags
        createdBy: identity.email!,
        createdAt: Date.now(),
        visibilityScope: args.visibilityScope,
      });
    }
    
    // Add the tag to the lifelog
    return await ctx.db.insert("lifelogTags", {
      lifelogId: args.lifelogId,
      tagId,
      addedBy: identity.email!,
      addedAt: Date.now(),
    });
  },
});

// Original example mutation
export const myMutation = mutation({
  args: {
    // ...
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to mutation");
    }
    //...
  },
});
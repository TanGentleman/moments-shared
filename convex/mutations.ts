import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Approve a lifelog
export const approveLifelog = mutation({
  args: {
    lifelogId: v.string(),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to mutation");
    }

    // Get user information from identity
    const userId = identity.subject;
    
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
        status: "approved",
        reviewerId: userId,
        reviewedAt: Date.now(),
        comments: args.comments,
      });
    } else {
      // Create new approval
      return await ctx.db.insert("approvals", {
        lifelogId: args.lifelogId,
        status: "approved",
        reviewerId: userId,
        reviewedAt: Date.now(),
        comments: args.comments,
      });
    }
  },
});

// Reject a lifelog
export const rejectLifelog = mutation({
  args: {
    lifelogId: v.string(),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to mutation");
    }

    // Get user information from identity
    const userId = identity.subject;
    
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
        reviewerId: userId,
        reviewedAt: Date.now(),
        comments: args.comments,
      });
    } else {
      // Create new approval
      return await ctx.db.insert("approvals", {
        lifelogId: args.lifelogId,
        status: "rejected",
        reviewerId: userId,
        reviewedAt: Date.now(),
        comments: args.comments,
      });
    }
  },
});

// Create a new tag
export const createTag = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to mutation");
    }

    // Get user information from identity
    const userId = identity.subject;
    
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
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

// Add a tag to a lifelog
export const addTagToLifelog = mutation({
  args: {
    lifelogId: v.string(),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to mutation");
    }

    // Get user information from identity
    const userId = identity.subject;
    
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
      addedBy: userId,
      addedAt: Date.now(),
    });
  },
});

// Remove a tag from a lifelog
export const removeTagFromLifelog = mutation({
  args: {
    lifelogId: v.string(),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated call to mutation");
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
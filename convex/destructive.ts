import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { UserRole, SYSTEM_OWNER, requireAuth, Permission } from "./admin";

export const deleteCompleteUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Delete all authAccounts for this user
    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // Delete all authSessions for this user
    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    // For each session, delete associated authRefreshTokens and the session itself
    for (const session of authSessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of refreshTokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }

    // Delete the user
    await ctx.db.delete(userId);
  },
});


export const deleteUser = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }: { userId: Id<"users"> }) => {
    const identity = await requireAuth(ctx, Permission.OWNER_ACCESS);
    if (identity.email !== SYSTEM_OWNER) {
      console.log("This case should never happen");
      throw new Error("You are not authorized to delete users");
    }
    // Delete all authAccounts for this user
    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // Delete all authSessions for this user
    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    // For each session, delete associated authRefreshTokens and the session itself
    for (const session of authSessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of refreshTokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }

    // TODO: Delete any other user data you store (e.g., messages, posts, etc.)

    // Delete the user
    await ctx.db.delete(userId);

    return null;
  },
});

export const updateAllUserRoles = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // This is an administrative function, so we require admin access
    // Note: In production, you might want to restrict this further or use a system token
    
    // Get all users
    const users = await ctx.db.query("users").collect();
    let updatedCount = 0;
    
    // Update each user's role based on their profile
    for (const user of users) {
      try {
        // Determine the appropriate role for this user
        const role = determineUserRole(user);
        const roleString = role.toLowerCase() as "owner" | "admin" | "friend" | "visitor";
        
        // Update the user with the new role
        await ctx.db.patch(user._id, { role: roleString });
        updatedCount++;
      } catch (error) {
        // Log errors but continue processing other users
        console.error(`Failed to update role for user ${user._id}:`, error);
      }
    }
    
    return updatedCount;
  },
});

/**
 * Determines the appropriate role for a user based on their profile
 * @param user The user document
 * @returns The role to assign to the user
 */
function determineUserRole(user: Doc<"users">): UserRole {
  // Default role
  
  // Example logic for role determination:
  // 1. Check email domain for admin privileges
  if (!user.email) {
    throw new Error("User email is required");
  }
  if (user.email === SYSTEM_OWNER) { 
      return UserRole.OWNER;
  }
  const adminEmails = ["Kiren"];
  if (adminEmails.includes(user.email)) {
    return UserRole.ADMIN;
  }
  if (user.email === "Manit") {
    return UserRole.FRIEND;
  }

  return UserRole.VISITOR;
}
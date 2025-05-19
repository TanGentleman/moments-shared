import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { MutationCtx } from "./_generated/server";
// import { SYSTEM_OWNER } from "./admin";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [Password],
    callbacks: {
      // Ensure a role is set for the user
      async afterUserCreatedOrUpdated(ctx: MutationCtx, { userId }) {
        console.log("afterUserCreatedOrUpdated", userId);
        // check if the user exists
        const user = await ctx.db.get(userId);
        if (user === null) {
          throw new Error("User not found");
        }
        if (user.role !== undefined) {
          return;
        }
        // Check if this is an anonymous user
        const isAnonymous = user.email === "anon";
        const newRole = "visitor"; //user.email === SYSTEM_OWNER ? "owner" : "visitor";
        
        // For anonymous users, generate a random email and set isAnonymous flag
        if (isAnonymous) {
          const randomEmail = `anon-${Date.now().toString(36)}`;
          await ctx.db.patch(userId, { 
            role: newRole,
            email: randomEmail,
            isAnonymous: true 
          });
          
          console.log(`Created anonymous user ${user._id} deletion in 2 minutes`);
          // schedule deletion of user after 2 minutes
          ctx.scheduler.runAfter(2 * 60 * 1000, internal.destructive.deleteCompleteUser, { userId: user._id });
        }
        else {
          // For regular users, just set the role
          await ctx.db.patch(userId, { role: newRole });
        }
      },
    },
  });
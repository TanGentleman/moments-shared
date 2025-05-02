/**
 * This is a helper script to create test data for the Approval Workflow.
 * It will:
 * 1. Create sample tags
 * 2. Create sample lifelogs
 * 3. Create pending approvals for those lifelogs
 * 4. Associate some tags with the lifelogs
 * 
 * Run with: npx convex run populateTestData:populateApprovalData
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const populateApprovalData = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Authentication required. Please log in first.");
    }

    // Use the authenticated user's ID
    const userId = identity.subject;
    console.log(`Running as user: ${userId}`);
    
    // Check if we already have test data to avoid duplicates
    const existingLifelogs = await ctx.db
      .query("lifelogs")
      .filter(q => q.eq(q.field("lifelogId"), "test-lifelog-1"))
      .first();
    
    if (existingLifelogs) {
      console.log("Test data already exists. Skipping creation.");
      return { status: "skipped", message: "Test data already exists" };
    }
    
    // 1. Create tags
    console.log("Creating tags...");
    const tagIds = [];
    
    const tagData = [
      { name: "Important", color: "#EF4444" }, // Red
      { name: "Personal", color: "#3B82F6" },  // Blue
      { name: "Work", color: "#10B981" },      // Green
      { name: "Health", color: "#8B5CF6" }     // Purple
    ];
    
    for (const tag of tagData) {
      const tagId = await ctx.db.insert("tags", {
        name: tag.name,
        color: tag.color,
        createdBy: userId,
        createdAt: Date.now()
      });
      tagIds.push(tagId);
      console.log(`Created tag: ${tag.name}`);
    }
    
    // 2. Create sample lifelogs
    console.log("Creating lifelogs...");
    const lifelogData = [
      {
        lifelogId: "test-lifelog-1",
        title: "Morning Reflection",
        markdown: `# Morning Reflection\n\nWoke up at 6:30 AM and had a great start to the day. I spent about 30 minutes meditating and then another 15 minutes doing some light stretching.\n\n## Goals for today\n\n- Finish the presentation for the team meeting\n- Call mom\n- Schedule dentist appointment\n\n> "The morning is wiser than the evening." - Russian Proverb`,
        contents: [],
        startTime: Date.now() - 86400000, // Yesterday
        endTime: Date.now() - 85800000,
        embeddingId: null
      },
      {
        lifelogId: "test-lifelog-2",
        title: "Work Meeting Notes",
        markdown: `# Team Meeting Notes\n\n## Project Status\n- Frontend: 80% complete\n- Backend: 65% complete\n- QA: Starting next week\n\n## Action Items\n1. Alex: Finalize API documentation\n2. Sarah: Complete user flow diagrams\n3. Me: Prepare demo for stakeholders\n\n**Next meeting:** Tuesday, 10:00 AM`,
        contents: [],
        startTime: Date.now() - 43200000, // 12 hours ago
        endTime: Date.now() - 39600000,
        embeddingId: null
      },
      {
        lifelogId: "test-lifelog-3",
        title: "Evening Workout",
        markdown: `# Evening Workout\n\n- 5 min warm-up\n- 3 sets of squats (12 reps each)\n- 3 sets of push-ups (15 reps each)\n- 2 sets of planks (60 seconds each)\n- 10 min cool-down\n\nFelt stronger today. Considering increasing weights next week.`,
        contents: [],
        startTime: Date.now() - 14400000, // 4 hours ago
        endTime: Date.now() - 10800000,
        embeddingId: null
      }
    ];
    
    const lifelogIds = [];
    for (const lifelog of lifelogData) {
      const lifelogId = await ctx.db.insert("lifelogs", lifelog);
      lifelogIds.push(lifelogId);
      console.log(`Created lifelog: ${lifelog.title}`);
      
      // 3. Create pending approval for this lifelog
      await ctx.db.insert("approvals", {
        lifelogId: lifelog.lifelogId,
        status: "pending",
        reviewerId: userId,
        reviewedAt: Date.now(),
        comments: ""
      });
      console.log(`Created pending approval for: ${lifelog.title}`);
    }
    
    // 4. Associate tags with lifelogs
    const tagAssociations = [
      { lifelogId: "test-lifelog-1", tagIdx: 0 }, // Important
      { lifelogId: "test-lifelog-1", tagIdx: 1 }, // Personal
      { lifelogId: "test-lifelog-2", tagIdx: 2 }, // Work
      { lifelogId: "test-lifelog-3", tagIdx: 3 }, // Health
      { lifelogId: "test-lifelog-3", tagIdx: 1 }  // Personal
    ];
    
    for (const assoc of tagAssociations) {
      await ctx.db.insert("lifelogTags", {
        lifelogId: assoc.lifelogId,
        tagId: tagIds[assoc.tagIdx],
        addedBy: userId,
        addedAt: Date.now()
      });
      console.log(`Associated tag with lifelog: ${assoc.lifelogId}`);
    }
    
    return {
      status: "success",
      message: "Test data created successfully!",
      data: {
        tagIds,
        lifelogIds
      }
    };
  }
}); 
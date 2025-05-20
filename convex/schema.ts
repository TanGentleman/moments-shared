import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// TODO: Expand conversation schema after lifelog view and search is implemented

const roleType = v.union(
  v.literal("owner"), v.literal("admin"),
  v.literal("friend"),v.literal("visitor")
);

const contentNodeType = v.union(
  v.literal("heading1"),
  v.literal("heading2"),
  v.literal("heading3"),
  v.literal("blockquote"),
  v.literal("paragraph"),
);

const contentNodeSchema = v.object({
  type: contentNodeType,
  content: v.string(),
  startTime: v.optional(v.number()),
  endTime: v.optional(v.number()),
  startOffsetMs: v.optional(v.number()),
  endOffsetMs: v.optional(v.number()),
  children: v.optional(v.array(v.any())),
  speakerName: v.optional(v.union(v.string(), v.null())),
  speakerIdentifier: v.optional(v.union(v.literal("user"), v.null())),
});

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // other "users" fields...
    role: v.optional(roleType),
  }),
  // .index("email", ["email"]),
  conversations: defineTable({
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  }),
  
  // Lifelog tables
  lifelogs: defineTable({
    lifelogId: v.string(),
    title: v.string(),
    markdown: v.union(v.string(), v.null()),
    contents: v.array(contentNodeSchema),
    startTime: v.number(),
    endTime: v.number(),
    embeddingId: v.union(v.id("markdownEmbeddings"), v.null()),
    lastUpdated: v.number(),
    scope: roleType,
  })
    .index("by_start_time", ["startTime"])
    .index("by_lifelog_id", ["lifelogId"])
    .searchIndex("search_title_content", {
      searchField: "title",
    })
    .searchIndex("search_markdown_content", {
      searchField: "markdown",
      filterFields: ["lifelogId"],
    }),

  metadata: defineTable({
    startTime: v.number(),
    endTime: v.number(),
    syncedUntil: v.number(),
    lifelogIds: v.array(v.string()),
  }),

  operations: defineTable({
    operation: v.union(
      v.literal("create"),
      v.literal("read"),
      v.literal("update"),
      v.literal("delete"),
    ),
    table: v.union(
      v.literal("lifelogs"),
      v.literal("metadata"),
      v.literal("users"),
      v.literal("markdownEmbeddings"),
      v.literal("approvals"),
      v.literal("tags"),
      v.literal("lifelogTags"),
    ),
    success: v.boolean(),
    data: v.object({
      message: v.optional(v.string()),
      error: v.optional(v.string()),
    }),
  }),

  markdownEmbeddings: defineTable({
    lifelogId: v.string(),
    markdown: v.string(),
    embedding: v.optional(v.array(v.number())),
  }).vectorIndex("byEmbedding", {
    vectorField: "embedding",
    dimensions: 1536,
  }),
  
  // Approval and tagging tables
  approvals: defineTable({
    lifelogId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewerId: v.string(),
    reviewedAt: v.number(),
    comments: v.optional(v.string()),
  })
    .index("by_lifelog_id", ["lifelogId"])
    .index("by_status", ["status"])
    .index("by_reviewer", ["reviewerId"]),
    
  tags: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    createdBy: v.string(),
    visibilityScope: v.string(),
  })
    .index("by_name", ["name"])
    .searchIndex("search_tags", {
      searchField: "name",
    }),
    
  lifelogTags: defineTable({
    lifelogId: v.string(),
    tagId: v.id("tags"),
    addedBy: v.string(),
  })
    .index("by_lifelog_id", ["lifelogId"])
    .index("by_tag_id", ["tagId"])
    .index("by_lifelog_and_tag", ["lifelogId", "tagId"]),
});
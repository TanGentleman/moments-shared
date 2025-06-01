import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { getLifelogs } from "./helpers";

type Default = undefined;

/**
 * Fetches lifelogs from the Limitless API.
 *
 * @returns An array of lifelog objects from the API.
 */
export const fetchLifelogs = internalAction({
  args: {
    limit: v.optional(v.union(v.number(), v.null())),
    includeMarkdown: v.optional(v.boolean()),
    includeHeadings: v.optional(v.boolean()),
    date: v.optional(v.string()),
    timezone: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIMITLESS_API_KEY;
    const apiUrl = process.env.LIMITLESS_API_URL;
    if (apiKey === undefined) throw new Error("LIMITLESS_API_KEY must be set");
    if (apiUrl === undefined) throw new Error("LIMITLESS_API_URL must be set");

    return await getLifelogs({
      apiKey,
      apiUrl,
      endpoint: undefined,
      limit: args.limit,
      batchSize: undefined,
      includeMarkdown: args.includeMarkdown,
      includeHeadings: args.includeHeadings,
      date: args.date,
      timezone: args.timezone || process.env.TIMEZONE || undefined,
      direction: args.direction,
    });
  },
});

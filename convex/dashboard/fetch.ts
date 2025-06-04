import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { getLifelogs } from "./helpers";
import axios from "axios";

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

/**
 * Searches lifelogs using a query via the Limitless API.
 *
 * @param query - The search query string.
 * @returns An array of matching lifelog objects.
 */
export const searchLifelogs = internalAction({
  args: {
    query: v.string(),
    limit: v.optional(v.union(v.number(), v.null())),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIMITLESS_API_KEY;
    const apiUrl = process.env.LIMITLESS_API_URL;
    if (apiKey === undefined) throw new Error("LIMITLESS_API_KEY must be set");
    if (apiUrl === undefined) throw new Error("LIMITLESS_API_URL must be set");

    const searchEndpoint = "/v1/search";
    const params: Record<string, string> = {
      query: args.query,
      limit: args.limit?.toString() || "50", // Default to 50 if limit is not provided
    };
    if (args.startTime) {
      params.startTime = args.startTime.toString();
    }
    if (args.endTime) {
      params.endTime = args.endTime.toString();
    }

    // Make the request to the Limitless API
    try {
      const response = await axios.get<Response>(`${apiUrl}${searchEndpoint}`, {
          headers: { "X-API-Key": apiKey },
          params,
        });
      return response.data;
    } 
    catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(`HTTP error! Status: ${error.response?.status}`);
      }
      console.error(`Unknown error searching lifelogs!`);
    }
    return {};
  }
});

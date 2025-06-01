"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const syncWithLimitlessAPI = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    data: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const limitlessApiUrl = process.env.LIMITLESS_API_URL;
      console.log('limitlessApiUrl', limitlessApiUrl);
      
      if (!limitlessApiUrl) {
        return {
          success: false,
          message: 'LIMITLESS_API_URL environment variable is not set',
        };
      }

      const response = await fetch(`${limitlessApiUrl}/sync`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Sync failed: ${response.status} ${response.statusText}`,
        };
      }

      const result = await response.text();
      
      return {
        success: true,
        message: 'Sync successful',
        data: result,
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
}); 
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all strikes
export const getStrikes = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("strikes")
      .order("desc")
      .collect();
  },
});

// Add a strike
export const addStrike = mutation({
  args: {
    choreId: v.optional(v.id("chores")),
    givenBy: v.union(v.literal("Aleem"), v.literal("Daniyal")),
    givenTo: v.union(v.literal("Aleem"), v.literal("Daniyal")),
    reason: v.string(),
    attachments: v.array(
      v.object({
        id: v.string(),
        type: v.union(v.literal("image"), v.literal("video")),
        url: v.string(),
        name: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("strikes", {
      choreId: args.choreId,
      givenBy: args.givenBy,
      givenTo: args.givenTo,
      reason: args.reason,
      attachments: args.attachments,
      createdAt: new Date().toISOString(),
    });
  },
});

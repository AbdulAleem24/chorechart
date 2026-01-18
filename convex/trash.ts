import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get trash tally for current user and month
export const getTrashTally = query({
  args: {
    userId: v.id("users"),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trashTally")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("month"), args.month)
        )
      )
      .first();
  },
});

// Increment trash tally
export const incrementTrashTally = mutation({
  args: {
    userId: v.id("users"),
    month: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("trashTally")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("month"), args.month)
        )
      )
      .first();

    if (existing) {
      // Check if already incremented today
      if (existing.lastIncrementDate === args.date) {
        return existing._id;
      }
      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
        lastIncrementDate: args.date,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("trashTally", {
        userId: args.userId,
        month: args.month,
        count: 1,
        lastIncrementDate: args.date,
      });
    }
  },
});

// Decrement trash tally
export const decrementTrashTally = mutation({
  args: {
    userId: v.id("users"),
    month: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("trashTally")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("month"), args.month)
        )
      )
      .first();

    if (existing && existing.count > 0 && existing.lastIncrementDate === args.date) {
      await ctx.db.patch(existing._id, {
        count: existing.count - 1,
      });
    }
  },
});

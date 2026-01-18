import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all chores (for all users)
export const getAllChores = query({
  handler: async (ctx) => {
    return await ctx.db.query("chores").collect();
  },
});

// Get all chores for a specific user
export const getChores = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chores")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

// Toggle chore completion
export const toggleChore = mutation({
  args: {
    date: v.string(),
    choreType: v.union(
      v.literal("sweeping_mopping"),
      v.literal("kitchen_cleaning"),
      v.literal("veranda_cleaning"),
      v.literal("toilet_bathroom")
    ),
    completedBy: v.union(v.literal("Aleem"), v.literal("Daniyal")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chores")
      .filter((q) => 
        q.and(
          q.eq(q.field("date"), args.date),
          q.eq(q.field("choreType"), args.choreType)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: !existing.completed,
        completedBy: args.completedBy,
        completedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      // Get the user ID for the completedBy user
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("name"), args.completedBy))
        .first();
      
      if (!user) throw new Error("User not found");
      
      const choreId = await ctx.db.insert("chores", {
        userId: user._id,
        date: args.date,
        choreType: args.choreType,
        completed: true,
        completedBy: args.completedBy,
        completedAt: new Date().toISOString(),
        comments: [],
      });
      return choreId;
    }
  },
});

// Add comment to chore
export const addComment = mutation({
  args: {
    choreId: v.optional(v.id("chores")),
    date: v.optional(v.string()),
    choreType: v.optional(v.union(
      v.literal("sweeping_mopping"),
      v.literal("kitchen_cleaning"),
      v.literal("veranda_cleaning"),
      v.literal("toilet_bathroom")
    )),
    comment: v.object({
      id: v.string(),
      userId: v.union(v.literal("Aleem"), v.literal("Daniyal")),
      text: v.string(),
      attachments: v.array(
        v.object({
          id: v.string(),
          type: v.union(v.literal("image"), v.literal("video")),
          url: v.string(),
          name: v.string(),
        })
      ),
      createdAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    let choreId = args.choreId;

    // If no choreId but have date and choreType, find or create the chore
    if (!choreId && args.date && args.choreType) {
      const existing = await ctx.db
        .query("chores")
        .filter((q) => 
          q.and(
            q.eq(q.field("date"), args.date),
            q.eq(q.field("choreType"), args.choreType)
          )
        )
        .first();
      
      if (existing) {
        choreId = existing._id;
      } else {
        // Get user ID
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("name"), args.comment.userId))
          .first();
        
        if (!user) throw new Error("User not found");
        
        choreId = await ctx.db.insert("chores", {
          userId: user._id,
          date: args.date,
          choreType: args.choreType,
          completed: false,
          comments: [],
        });
      }
    }

    if (!choreId) throw new Error("Chore ID required");

    const chore = await ctx.db.get(choreId);
    if (!chore) throw new Error("Chore not found");

    await ctx.db.patch(choreId, {
      comments: [...chore.comments, args.comment],
    });

    return choreId;
  },
});

// Delete comment from chore
export const deleteComment = mutation({
  args: {
    choreId: v.id("chores"),
    commentId: v.string(),
  },
  handler: async (ctx, args) => {
    const chore = await ctx.db.get(args.choreId);
    if (!chore) throw new Error("Chore not found");

    const updatedComments = chore.comments.filter(c => c.id !== args.commentId);
    
    await ctx.db.patch(args.choreId, {
      comments: updatedComments,
    });

    return args.choreId;
  },
});

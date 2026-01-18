import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Login user with password
export const login = mutation({
  args: {
    name: v.union(v.literal("Aleem"), v.literal("Daniyal")),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Simple password check (in production, use proper hashing)
    // For now, passwords are: Aleem -> "#Aleem12345", Daniyal -> "daniyal123"
    const validPassword =
      (args.name === "Aleem" && args.password === "#Aleem12345") ||
      (args.name === "Daniyal" && args.password === "daniyal123");

    if (!validPassword) {
      return { success: false, message: "Invalid password" };
    }

    return { success: true, userId: user._id, name: user.name };
  },
});

// Initialize default users (run once)
export const initializeUsers = mutation({
  handler: async (ctx) => {
    const aleemExists = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), "Aleem"))
      .first();

    if (!aleemExists) {
      await ctx.db.insert("users", {
        name: "Aleem",
        passwordHash: "#Aleem12345", // In production, hash this
        tutorialShown: false,
        firstChoreCompleted: false,
        goodBoyShownDates: [],
      });
    }

    const daniyalExists = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), "Daniyal"))
      .first();

    if (!daniyalExists) {
      await ctx.db.insert("users", {
        name: "Daniyal",
        passwordHash: "daniyal123", // In production, hash this
        tutorialShown: false,
        firstChoreCompleted: false,
        goodBoyShownDates: [],
      });
    }

    return { success: true };
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by name
export const getUserByName = query({
  args: { name: v.union(v.literal("Aleem"), v.literal("Daniyal")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
  },
});

// Update tutorial shown
export const updateTutorialShown = mutation({
  args: { userId: v.id("users"), tutorialShown: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { tutorialShown: args.tutorialShown });
  },
});

// Update first chore completed
export const updateFirstChoreCompleted = mutation({
  args: { userId: v.id("users"), firstChoreCompleted: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { firstChoreCompleted: args.firstChoreCompleted });
  },
});

// Add good boy shown date
export const addGoodBoyShownDate = mutation({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        goodBoyShownDates: [...user.goodBoyShownDates, args.date],
      });
    }
  },
});

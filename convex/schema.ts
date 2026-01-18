import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.union(v.literal("Aleem"), v.literal("Daniyal")),
    passwordHash: v.string(),
    tutorialShown: v.boolean(),
    firstChoreCompleted: v.boolean(),
    goodBoyShownDates: v.array(v.string()),
  }).index("by_name", ["name"]),

  chores: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    choreType: v.union(
      v.literal("sweeping_mopping"),
      v.literal("kitchen_cleaning"),
      v.literal("veranda_cleaning"),
      v.literal("toilet_bathroom")
    ),
    completed: v.boolean(),
    completedBy: v.optional(v.union(v.literal("Aleem"), v.literal("Daniyal"))),
    completedAt: v.optional(v.string()),
    comments: v.array(
      v.object({
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
      })
    ),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_user_and_date", ["userId", "date"]),

  trashTally: defineTable({
    userId: v.id("users"),
    month: v.string(), // YYYY-MM format
    count: v.number(),
    lastIncrementDate: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_month", ["userId", "month"]),

  strikes: defineTable({
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
    createdAt: v.string(),
  })
    .index("by_given_to", ["givenTo"])
    .index("by_created_at", ["createdAt"]),
});

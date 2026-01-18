import { mutation } from "./_generated/server";

// Reset all data for development purposes
export const resetAllData = mutation({
  handler: async (ctx) => {
    // Delete all chores
    const chores = await ctx.db.query("chores").collect();
    for (const chore of chores) {
      await ctx.db.delete(chore._id);
    }

    // Delete all trash tallies
    const trashTallies = await ctx.db.query("trashTally").collect();
    for (const tally of trashTallies) {
      await ctx.db.delete(tally._id);
    }

    // Delete all strikes
    const strikes = await ctx.db.query("strikes").collect();
    for (const strike of strikes) {
      await ctx.db.delete(strike._id);
    }

    // Reset user data (keep users but reset their state)
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.patch(user._id, {
        tutorialShown: false,
        firstChoreCompleted: false,
        goodBoyShownDates: [],
      });
    }

    return { success: true };
  },
});

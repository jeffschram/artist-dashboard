import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const insertIfNew = internalMutation({
  args: {
    name: v.string(),
    url: v.optional(v.string()),
    submissionFormUrl: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.object({ wasInserted: v.boolean() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("venues")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      return { wasInserted: false };
    }

    const allVenues = await ctx.db.query("venues").collect();
    const maxOrder = allVenues.reduce(
      (max, v) => Math.max(max, v.orderNum),
      0,
    );

    await ctx.db.insert("venues", {
      orderNum: maxOrder + 1,
      name: args.name,
      url: args.url,
      submissionFormUrl: args.submissionFormUrl,
      locations: [
        {
          city: args.city,
          state: args.state,
          country: args.country,
        },
      ],
      contacts: [],
      contactIds: [],
      status: "To Contact",
      category: "For Review",
      notes: args.notes,
    });

    return { wasInserted: true };
  },
});

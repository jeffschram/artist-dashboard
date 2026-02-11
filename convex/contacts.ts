import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    venueIds: v.optional(v.array(v.id("venues"))),
    venueId: v.optional(v.id("venues")), // Legacy field - for transition period
    collaboratorId: v.optional(v.id("collaborators")),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("contacts").collect();
  },
});

export const listByVenue = query({
  args: { venueId: v.id("venues") },
  returns: v.array(v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    venueIds: v.optional(v.array(v.id("venues"))),
    venueId: v.optional(v.id("venues")), // Legacy field - for transition period
    collaboratorId: v.optional(v.id("collaborators")),
  })),
  handler: async (ctx, args) => {
    const allContacts = await ctx.db.query("contacts").collect();
    return allContacts.filter((c) => (c.venueIds || []).includes(args.venueId));
  },
});

export const listByCollaborator = query({
  args: { collaboratorId: v.id("collaborators") },
  returns: v.array(v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    venueIds: v.optional(v.array(v.id("venues"))),
    venueId: v.optional(v.id("venues")), // Legacy field - for transition period
    collaboratorId: v.optional(v.id("collaborators")),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_collaborator", (q) => q.eq("collaboratorId", args.collaboratorId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("contacts") },
  returns: v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    venueIds: v.optional(v.array(v.id("venues"))),
    venueId: v.optional(v.id("venues")), // Legacy field - for transition period
    collaboratorId: v.optional(v.id("collaborators")),
  }),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }
    return contact;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    venueIds: v.optional(v.array(v.id("venues"))),
    collaboratorId: v.optional(v.id("collaborators")),
  },
  returns: v.id("contacts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("contacts", {
      ...args,
      venueIds: args.venueIds || [],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    venueIds: v.optional(v.array(v.id("venues"))),
    collaboratorId: v.optional(v.id("collaborators")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }
    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }
    // Remove this contact from any venues that reference it
    const venues = await ctx.db.query("venues").collect();
    for (const venue of venues) {
      if ((venue.contactIds || []).includes(args.id)) {
        await ctx.db.patch(venue._id, {
          contactIds: (venue.contactIds || []).filter((id) => id !== args.id),
        });
      }
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

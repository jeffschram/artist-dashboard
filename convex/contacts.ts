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
    venueId: v.optional(v.id("venues")),
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
    venueId: v.optional(v.id("venues")),
    collaboratorId: v.optional(v.id("collaborators")),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
      .collect();
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
    venueId: v.optional(v.id("venues")),
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
    venueId: v.optional(v.id("venues")),
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
    venueId: v.optional(v.id("venues")),
    collaboratorId: v.optional(v.id("collaborators")),
  },
  returns: v.id("contacts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("contacts", args);
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
    venueId: v.optional(v.id("venues")),
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
    await ctx.db.delete(args.id);
    return null;
  },
});

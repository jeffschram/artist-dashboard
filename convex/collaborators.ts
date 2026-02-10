import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("collaborators"),
    _creationTime: v.number(),
    name: v.string(),
    url: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("collaborators").collect();
  },
});

export const get = query({
  args: { id: v.id("collaborators") },
  returns: v.object({
    _id: v.id("collaborators"),
    _creationTime: v.number(),
    name: v.string(),
    url: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const collaborator = await ctx.db.get(args.id);
    if (!collaborator) {
      throw new Error("Collaborator not found");
    }
    return collaborator;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    url: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("collaborators"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("collaborators", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("collaborators"),
    name: v.string(),
    url: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const collaborator = await ctx.db.get(args.id);
    if (!collaborator) {
      throw new Error("Collaborator not found");
    }
    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("collaborators") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const collaborator = await ctx.db.get(args.id);
    if (!collaborator) {
      throw new Error("Collaborator not found");
    }
    // Also remove any project collaborator links
    const links = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_collaborator", (q) => q.eq("collaboratorId", args.id))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }
    // Also remove any contacts linked to this collaborator
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_collaborator", (q) => q.eq("collaboratorId", args.id))
      .collect();
    for (const contact of contacts) {
      await ctx.db.patch(contact._id, { collaboratorId: undefined });
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

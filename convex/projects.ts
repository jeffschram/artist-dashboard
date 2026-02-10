import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const projectReturnType = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  name: v.string(),
  venueId: v.id("venues"),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  description: v.optional(v.string()),
  status: v.union(
    v.literal("Planning"),
    v.literal("In Progress"),
    v.literal("Completed"),
    v.literal("Cancelled"),
  ),
  notes: v.optional(v.string()),
  budget: v.optional(v.number()),
  profit: v.optional(v.number()),
});

export const list = query({
  args: {},
  returns: v.array(projectReturnType),
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

export const listByVenue = query({
  args: { venueId: v.id("venues") },
  returns: v.array(projectReturnType),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("projects") },
  returns: projectReturnType,
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    venueId: v.id("venues"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("Planning"),
      v.literal("In Progress"),
      v.literal("Completed"),
      v.literal("Cancelled"),
    ),
    notes: v.optional(v.string()),
    budget: v.optional(v.number()),
    profit: v.optional(v.number()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
    venueId: v.id("venues"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("Planning"),
      v.literal("In Progress"),
      v.literal("Completed"),
      v.literal("Cancelled"),
    ),
    notes: v.optional(v.string()),
    budget: v.optional(v.number()),
    profit: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    // Remove all project-collaborator links
    const links = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

// --- Project Collaborator links ---

export const addCollaborator = mutation({
  args: {
    projectId: v.id("projects"),
    collaboratorId: v.id("collaborators"),
  },
  returns: v.id("projectCollaborators"),
  handler: async (ctx, args) => {
    // Check for existing link to prevent duplicates
    const existing = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const alreadyLinked = existing.find(
      (l) => l.collaboratorId === args.collaboratorId
    );
    if (alreadyLinked) {
      return alreadyLinked._id;
    }
    return await ctx.db.insert("projectCollaborators", {
      projectId: args.projectId,
      collaboratorId: args.collaboratorId,
    });
  },
});

export const removeCollaborator = mutation({
  args: {
    projectId: v.id("projects"),
    collaboratorId: v.id("collaborators"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const link = links.find((l) => l.collaboratorId === args.collaboratorId);
    if (link) {
      await ctx.db.delete(link._id);
    }
    return null;
  },
});

export const getCollaborators = query({
  args: { projectId: v.id("projects") },
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
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const collaborators = [];
    for (const link of links) {
      const collaborator = await ctx.db.get(link.collaboratorId);
      if (collaborator) {
        collaborators.push(collaborator);
      }
    }
    return collaborators;
  },
});

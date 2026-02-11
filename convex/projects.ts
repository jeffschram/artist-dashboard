import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const projectReturnType = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  name: v.string(),
  venueIds: v.optional(v.array(v.id("venues"))),
  venueId: v.optional(v.id("venues")), // Legacy field - for transition period
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
    const allProjects = await ctx.db.query("projects").collect();
    return allProjects.filter((p) => (p.venueIds || []).includes(args.venueId));
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
    venueIds: v.optional(v.array(v.id("venues"))),
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
    return await ctx.db.insert("projects", {
      ...args,
      venueIds: args.venueIds || [],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
    venueIds: v.optional(v.array(v.id("venues"))),
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
    const collaboratorLinks = await ctx.db
      .query("projectCollaborators")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const link of collaboratorLinks) {
      await ctx.db.delete(link._id);
    }
    // Remove all project-contact links
    const contactLinks = await ctx.db
      .query("projectContacts")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const link of contactLinks) {
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

// --- Project Contact (People) links ---

export const listContactsByProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(v.id("contacts")),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("projectContacts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return links.map((link) => link.contactId);
  },
});

export const getContactsWithData = query({
  args: { projectId: v.id("projects") },
  returns: v.array(v.object({
    _id: v.id("contacts"),
    _creationTime: v.number(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    types: v.optional(
      v.array(
        v.union(
          v.literal("Venue Contact"),
          v.literal("Colleague"),
          v.literal("Artist"),
          v.literal("Client"),
          v.literal("Patron"),
          v.literal("Customer"),
          v.literal("Agent"),
          v.literal("Vendor"),
          v.literal("Other"),
        ),
      ),
    ),
    notes: v.optional(v.string()),
    venueIds: v.optional(v.array(v.id("venues"))),
    venueId: v.optional(v.id("venues")),
    collaboratorId: v.optional(v.id("collaborators")),
  })),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("projectContacts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const contacts = [];
    for (const link of links) {
      const contact = await ctx.db.get(link.contactId);
      if (contact) {
        contacts.push(contact);
      }
    }
    return contacts;
  },
});

export const getAllProjectContactLinks = query({
  args: {},
  returns: v.array(v.object({
    projectId: v.id("projects"),
    contactId: v.id("contacts"),
  })),
  handler: async (ctx) => {
    const links = await ctx.db.query("projectContacts").collect();
    return links.map((link) => ({
      projectId: link.projectId,
      contactId: link.contactId,
    }));
  },
});

export const listProjectsByContact = query({
  args: { contactId: v.id("contacts") },
  returns: v.array(v.id("projects")),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("projectContacts")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
    return links.map((link) => link.projectId);
  },
});

export const linkContact = mutation({
  args: {
    projectId: v.id("projects"),
    contactId: v.id("contacts"),
  },
  returns: v.id("projectContacts"),
  handler: async (ctx, args) => {
    // Check for existing link to prevent duplicates
    const existing = await ctx.db
      .query("projectContacts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const alreadyLinked = existing.find((l) => l.contactId === args.contactId);
    if (alreadyLinked) {
      return alreadyLinked._id;
    }
    return await ctx.db.insert("projectContacts", {
      projectId: args.projectId,
      contactId: args.contactId,
    });
  },
});

export const unlinkContact = mutation({
  args: {
    projectId: v.id("projects"),
    contactId: v.id("contacts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("projectContacts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const link = links.find((l) => l.contactId === args.contactId);
    if (link) {
      await ctx.db.delete(link._id);
    }
    return null;
  },
});

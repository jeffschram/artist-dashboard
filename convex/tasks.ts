import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const taskReturnType = v.object({
  _id: v.id("tasks"),
  _creationTime: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
  status: v.union(
    v.literal("To Do"),
    v.literal("In Progress"),
    v.literal("Completed"),
    v.literal("Cancelled"),
  ),
  priority: v.union(
    v.literal("Low"),
    v.literal("Medium"),
    v.literal("High"),
    v.literal("Urgent"),
  ),
  dueDate: v.optional(v.string()),
  completedDate: v.optional(v.string()),
  notes: v.optional(v.string()),
});

export const list = query({
  args: {},
  returns: v.array(taskReturnType),
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const get = query({
  args: { id: v.id("tasks") },
  returns: taskReturnType,
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    return task;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("To Do"),
      v.literal("In Progress"),
      v.literal("Completed"),
      v.literal("Cancelled"),
    ),
    priority: v.union(
      v.literal("Low"),
      v.literal("Medium"),
      v.literal("High"),
      v.literal("Urgent"),
    ),
    dueDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("To Do"),
      v.literal("In Progress"),
      v.literal("Completed"),
      v.literal("Cancelled"),
    ),
    priority: v.union(
      v.literal("Low"),
      v.literal("Medium"),
      v.literal("High"),
      v.literal("Urgent"),
    ),
    dueDate: v.optional(v.string()),
    completedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    // Remove all task-venue links
    const venueLinks = await ctx.db
      .query("taskVenues")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();
    for (const link of venueLinks) {
      await ctx.db.delete(link._id);
    }
    // Remove all task-project links
    const projectLinks = await ctx.db
      .query("taskProjects")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();
    for (const link of projectLinks) {
      await ctx.db.delete(link._id);
    }
    // Remove all task-contact links
    const contactLinks = await ctx.db
      .query("taskContacts")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();
    for (const link of contactLinks) {
      await ctx.db.delete(link._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

// --- Task-Venue links ---

export const listVenuesByTask = query({
  args: { taskId: v.id("tasks") },
  returns: v.array(v.id("venues")),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("taskVenues")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return links.map((link) => link.venueId);
  },
});

export const listTasksByVenue = query({
  args: { venueId: v.id("venues") },
  returns: v.array(v.id("tasks")),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("taskVenues")
      .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
      .collect();
    return links.map((link) => link.taskId);
  },
});

export const linkVenue = mutation({
  args: {
    taskId: v.id("tasks"),
    venueId: v.id("venues"),
  },
  returns: v.id("taskVenues"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("taskVenues")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const alreadyLinked = existing.find((l) => l.venueId === args.venueId);
    if (alreadyLinked) {
      return alreadyLinked._id;
    }
    return await ctx.db.insert("taskVenues", {
      taskId: args.taskId,
      venueId: args.venueId,
    });
  },
});

export const unlinkVenue = mutation({
  args: {
    taskId: v.id("tasks"),
    venueId: v.id("venues"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("taskVenues")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const link = links.find((l) => l.venueId === args.venueId);
    if (link) {
      await ctx.db.delete(link._id);
    }
    return null;
  },
});

// --- Task-Project links ---

export const listProjectsByTask = query({
  args: { taskId: v.id("tasks") },
  returns: v.array(v.id("projects")),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("taskProjects")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return links.map((link) => link.projectId);
  },
});

export const listTasksByProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(v.id("tasks")),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("taskProjects")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return links.map((link) => link.taskId);
  },
});

export const linkProject = mutation({
  args: {
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
  },
  returns: v.id("taskProjects"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("taskProjects")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const alreadyLinked = existing.find((l) => l.projectId === args.projectId);
    if (alreadyLinked) {
      return alreadyLinked._id;
    }
    return await ctx.db.insert("taskProjects", {
      taskId: args.taskId,
      projectId: args.projectId,
    });
  },
});

export const unlinkProject = mutation({
  args: {
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("taskProjects")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const link = links.find((l) => l.projectId === args.projectId);
    if (link) {
      await ctx.db.delete(link._id);
    }
    return null;
  },
});

// --- Task-Contact (People) links ---

export const listContactsByTask = query({
  args: { taskId: v.id("tasks") },
  returns: v.array(v.id("contacts")),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("taskContacts")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return links.map((link) => link.contactId);
  },
});

export const listTasksByContact = query({
  args: { contactId: v.id("contacts") },
  returns: v.array(v.id("tasks")),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("taskContacts")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
    return links.map((link) => link.taskId);
  },
});

export const linkContact = mutation({
  args: {
    taskId: v.id("tasks"),
    contactId: v.id("contacts"),
  },
  returns: v.id("taskContacts"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("taskContacts")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const alreadyLinked = existing.find((l) => l.contactId === args.contactId);
    if (alreadyLinked) {
      return alreadyLinked._id;
    }
    return await ctx.db.insert("taskContacts", {
      taskId: args.taskId,
      contactId: args.contactId,
    });
  },
});

export const unlinkContact = mutation({
  args: {
    taskId: v.id("tasks"),
    contactId: v.id("contacts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("taskContacts")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const link = links.find((l) => l.contactId === args.contactId);
    if (link) {
      await ctx.db.delete(link._id);
    }
    return null;
  },
});

// --- Batch queries for dashboard ---

export const getAllTaskVenueLinks = query({
  args: {},
  returns: v.array(v.object({
    taskId: v.id("tasks"),
    venueId: v.id("venues"),
  })),
  handler: async (ctx) => {
    const links = await ctx.db.query("taskVenues").collect();
    return links.map((link) => ({
      taskId: link.taskId,
      venueId: link.venueId,
    }));
  },
});

export const getAllTaskProjectLinks = query({
  args: {},
  returns: v.array(v.object({
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
  })),
  handler: async (ctx) => {
    const links = await ctx.db.query("taskProjects").collect();
    return links.map((link) => ({
      taskId: link.taskId,
      projectId: link.projectId,
    }));
  },
});

export const getAllTaskContactLinks = query({
  args: {},
  returns: v.array(v.object({
    taskId: v.id("tasks"),
    contactId: v.id("contacts"),
  })),
  handler: async (ctx) => {
    const links = await ctx.db.query("taskContacts").collect();
    return links.map((link) => ({
      taskId: link.taskId,
      contactId: link.contactId,
    }));
  },
});

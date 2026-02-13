import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const outreachReturnType = v.object({
  _id: v.id("outreach"),
  _creationTime: v.number(),
  contactId: v.optional(v.id("contacts")),
  venueId: v.optional(v.id("venues")),
  projectId: v.optional(v.id("projects")),
  method: v.union(
    v.literal("Email"),
    v.literal("Phone"),
    v.literal("In Person"),
    v.literal("Submission Form"),
    v.literal("Social Media"),
    v.literal("Other"),
  ),
  direction: v.union(
    v.literal("Outbound"),
    v.literal("Inbound"),
  ),
  date: v.string(),
  subject: v.string(),
  notes: v.optional(v.string()),
  status: v.union(
    v.literal("Sent"),
    v.literal("Awaiting Response"),
    v.literal("Responded"),
    v.literal("Follow Up Needed"),
    v.literal("No Response"),
    v.literal("Declined"),
    v.literal("Accepted"),
  ),
  followUpDate: v.optional(v.string()),
});

export const list = query({
  args: {},
  returns: v.array(outreachReturnType),
  handler: async (ctx) => {
    return await ctx.db
      .query("outreach")
      .withIndex("by_date")
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("outreach") },
  returns: outreachReturnType,
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Outreach entry not found");
    }
    return entry;
  },
});

export const create = mutation({
  args: {
    contactId: v.optional(v.id("contacts")),
    venueId: v.optional(v.id("venues")),
    projectId: v.optional(v.id("projects")),
    method: v.union(
      v.literal("Email"),
      v.literal("Phone"),
      v.literal("In Person"),
      v.literal("Submission Form"),
      v.literal("Social Media"),
      v.literal("Other"),
    ),
    direction: v.union(
      v.literal("Outbound"),
      v.literal("Inbound"),
    ),
    date: v.string(),
    subject: v.string(),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("Sent"),
      v.literal("Awaiting Response"),
      v.literal("Responded"),
      v.literal("Follow Up Needed"),
      v.literal("No Response"),
      v.literal("Declined"),
      v.literal("Accepted"),
    ),
    followUpDate: v.optional(v.string()),
  },
  returns: v.id("outreach"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("outreach", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("outreach"),
    contactId: v.optional(v.id("contacts")),
    venueId: v.optional(v.id("venues")),
    projectId: v.optional(v.id("projects")),
    method: v.union(
      v.literal("Email"),
      v.literal("Phone"),
      v.literal("In Person"),
      v.literal("Submission Form"),
      v.literal("Social Media"),
      v.literal("Other"),
    ),
    direction: v.union(
      v.literal("Outbound"),
      v.literal("Inbound"),
    ),
    date: v.string(),
    subject: v.string(),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("Sent"),
      v.literal("Awaiting Response"),
      v.literal("Responded"),
      v.literal("Follow Up Needed"),
      v.literal("No Response"),
      v.literal("Declined"),
      v.literal("Accepted"),
    ),
    followUpDate: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Outreach entry not found");
    }
    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, updateData);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("outreach") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Outreach entry not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const listByVenue = query({
  args: { venueId: v.id("venues") },
  returns: v.array(outreachReturnType),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outreach")
      .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
      .collect();
  },
});

export const listByContact = query({
  args: { contactId: v.id("contacts") },
  returns: v.array(outreachReturnType),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outreach")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

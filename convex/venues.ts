import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { seedVenues } from "./seedVenuesData";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("venues")
      .withIndex("by_order", (q) => q)
      .order("asc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("venues") },
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);
    if (!venue) {
      throw new Error("Venue not found");
    }
    return venue;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    url: v.optional(v.string()),
    submissionFormUrl: v.optional(v.string()),
    locations: v.array(v.object({
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    })),
    // Legacy inline contacts (backward compat)
    contacts: v.optional(v.array(v.object({
      name: v.optional(v.string()),
      title: v.optional(v.string()),
      email: v.optional(v.string()),
      notes: v.optional(v.string()),
    }))),
    // New relational contact IDs
    contactIds: v.optional(v.array(v.id("contacts"))),
    status: v.union(v.literal("Contacted"), v.literal("To Contact"), v.literal("Ignore"), v.literal("Previous Client")),
    category: v.union(v.literal("Ultimate Dream Goal"), v.literal("Accessible"), v.literal("Unconventional"), v.literal("For Review")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the highest order number
    const venues = await ctx.db
      .query("venues")
      .collect();
    
    const maxOrder = venues.reduce((max, venue) => Math.max(max, venue.orderNum), 0);

    return await ctx.db.insert("venues", {
      orderNum: maxOrder + 1,
      contacts: args.contacts || [],
      contactIds: args.contactIds || [],
      name: args.name,
      url: args.url,
      submissionFormUrl: args.submissionFormUrl,
      locations: args.locations,
      status: args.status,
      category: args.category,
      notes: args.notes,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("venues"),
    name: v.string(),
    url: v.optional(v.string()),
    submissionFormUrl: v.optional(v.string()),
    locations: v.array(v.object({
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    })),
    // Legacy inline contacts (backward compat)
    contacts: v.optional(v.array(v.object({
      name: v.optional(v.string()),
      title: v.optional(v.string()),
      email: v.optional(v.string()),
      notes: v.optional(v.string()),
    }))),
    // New relational contact IDs
    contactIds: v.optional(v.array(v.id("contacts"))),
    status: v.union(v.literal("Contacted"), v.literal("To Contact"), v.literal("Ignore"), v.literal("Previous Client")),
    category: v.union(v.literal("Ultimate Dream Goal"), v.literal("Accessible"), v.literal("Unconventional"), v.literal("For Review")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);
    if (!venue) {
      throw new Error("Venue not found");
    }

    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, updateData);
  },
});

export const remove = mutation({
  args: { id: v.id("venues") },
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);
    if (!venue) {
      throw new Error("Venue not found");
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Seed venues from ai-context/venues-to-add.md.
 * Skips any venue whose name already exists in the DB.
 * Run: npx convex run venues:seedVenuesFromFile
 */
export const seedVenuesFromFile = mutation({
  args: {},
  returns: v.object({
    inserted: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const existing = await ctx.db.query("venues").collect();
    const existingNames = new Set(existing.map((v) => v.name));
    const maxOrder = existing.reduce((max, venue) => Math.max(max, venue.orderNum), 0);

    let inserted = 0;
    for (let i = 0; i < seedVenues.length; i++) {
      const item = seedVenues[i];
      if (existingNames.has(item.name)) {
        continue;
      }
      await ctx.db.insert("venues", {
        orderNum: maxOrder + inserted + 1,
        name: item.name,
        url: item.url,
        submissionFormUrl: item.submissionFormUrl,
        locations: item.locations,
        contacts: item.contacts,
        contactIds: [], // Start with empty array for new venues
        status: item.status,
        category: item.category,
        notes: item.notes,
      });
      inserted++;
    }
    return { inserted, skipped: seedVenues.length - inserted };
  },
});

export const reorder = mutation({
  args: {
    venueId: v.id("venues"),
    newOrderNum: v.number(),
  },
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    const oldOrderNum = venue.orderNum;
    const newOrderNum = args.newOrderNum;

    if (oldOrderNum === newOrderNum) return;

    // Get all venues
    const venues = await ctx.db
      .query("venues")
      .collect();

    // Update order numbers
    for (const v of venues) {
      if (v._id === args.venueId) {
        await ctx.db.patch(v._id, { orderNum: newOrderNum });
      } else if (oldOrderNum < newOrderNum && v.orderNum > oldOrderNum && v.orderNum <= newOrderNum) {
        await ctx.db.patch(v._id, { orderNum: v.orderNum - 1 });
      } else if (oldOrderNum > newOrderNum && v.orderNum >= newOrderNum && v.orderNum < oldOrderNum) {
        await ctx.db.patch(v._id, { orderNum: v.orderNum + 1 });
      }
    }
  },
});

/**
 * One-time migration: copy inline venue contacts to the new contacts table.
 * Idempotent — skips venues whose contacts have already been migrated
 * (checks by name + email combo to avoid duplicates).
 * Run: npx convex run venues:migrateContactsToTable
 */
export const migrateContactsToTable = mutation({
  args: {},
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const venues = await ctx.db.query("venues").collect();
    const existingContacts = await ctx.db.query("contacts").collect();
    // Build a set of existing contacts (keyed by first venueId::name::email for deduplication)
    const existingKeys = new Set(
      existingContacts.map((c) => {
        const firstVenueId = (c.venueIds || [])[0] || "";
        return `${firstVenueId}::${c.name}::${c.email ?? ""}`;
      })
    );

    let migrated = 0;
    let skipped = 0;

    for (const venue of venues) {
      for (const inlineContact of venue.contacts) {
        if (!inlineContact.name) {
          skipped++;
          continue;
        }
        const key = `${venue._id}::${inlineContact.name}::${inlineContact.email ?? ""}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        const newContactId = await ctx.db.insert("contacts", {
          name: inlineContact.name,
          email: inlineContact.email,
          role: inlineContact.title,
          notes: inlineContact.notes,
          venueIds: [venue._id],
        });
        
        // Update venue to include this contact in contactIds
        const currentContactIds = venue.contactIds || [];
        await ctx.db.patch(venue._id, {
          contactIds: [...currentContactIds, newContactId],
        });
        
        migrated++;
      }
    }

    return { migrated, skipped };
  },
});

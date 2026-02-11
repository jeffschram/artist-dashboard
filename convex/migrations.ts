/**
 * Migration utilities to convert from inline contacts/single venueId to relational model
 */
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migrate inline venue contacts to the contacts table and populate contactIds
 * Run with: npx convex run migrations:migrateInlineContactsToRelational
 */
export const migrateInlineContactsToRelational = mutation({
  args: {},
  returns: v.object({
    venuesProcessed: v.number(),
    contactsCreated: v.number(),
  }),
  handler: async (ctx) => {
    const venues = await ctx.db.query("venues").collect();
    let contactsCreated = 0;

    for (const venue of venues) {
      const contactIds: string[] = [];

      // Process each inline contact
      for (const inlineContact of venue.contacts || []) {
        if (!inlineContact.name) continue; // Skip empty contacts

        // Create a new contact in the contacts table
        const contactId = await ctx.db.insert("contacts", {
          name: inlineContact.name,
          email: inlineContact.email,
          phone: undefined, // inline contacts don't have phone
          role: inlineContact.title, // map title → role
          notes: inlineContact.notes,
          venueIds: [venue._id],
          collaboratorId: undefined,
        });

        contactIds.push(contactId);
        contactsCreated++;
      }

      // Update the venue with contactIds
      await ctx.db.patch(venue._id, {
        contactIds: contactIds as any,
      });
    }

    return {
      venuesProcessed: venues.length,
      contactsCreated,
    };
  },
});

/**
 * Migrate projects from single venueId to venueIds array  
 * Run with: npx convex run migrations:migrateProjectsToMultiVenue
 */
export const migrateProjectsToMultiVenue = mutation({
  args: {},
  returns: v.object({
    projectsProcessed: v.number(),
  }),
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();

    for (const project of projects) {
      // If venueIds doesn't exist or is empty, populate it from legacy venueId
      const legacyVenueId = (project as any).venueId;
      if (legacyVenueId && (!project.venueIds || project.venueIds.length === 0)) {
        await ctx.db.patch(project._id, {
          venueIds: [legacyVenueId],
        });
      }
    }

    return {
      projectsProcessed: projects.length,
    };
  },
});

/**
 * Migrate contacts from single venueId to venueIds array
 * Run with: npx convex run migrations:migrateContactsToMultiVenue
 */
export const migrateContactsToMultiVenue = mutation({
  args: {},
  returns: v.object({
    contactsProcessed: v.number(),
  }),
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();

    for (const contact of contacts) {
      // If venueIds doesn't exist or is empty, populate it from legacy venueId
      const legacyVenueId = (contact as any).venueId;
      if (legacyVenueId && (!contact.venueIds || contact.venueIds.length === 0)) {
        await ctx.db.patch(contact._id, {
          venueIds: [legacyVenueId],
        });
      } else if (!contact.venueIds) {
        // Ensure venueIds exists as empty array
        await ctx.db.patch(contact._id, {
          venueIds: [],
        });
      }
    }

    return {
      contactsProcessed: contacts.length,
    };
  },
});

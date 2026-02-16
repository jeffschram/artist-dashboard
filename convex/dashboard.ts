import { query } from "./_generated/server";

export const getActionItems = query({
  args: {},
  handler: async (ctx) => {
    // Venues needing contact
    const venues = await ctx.db.query("venues").collect();
    const venuesNeedingOutreach = venues.filter(
      (v) => v.status === "To Contact",
    );

    return {
      venuesNeedingOutreach: venuesNeedingOutreach.map((v) => ({
        _id: v._id,
        name: v.name,
        category: v.category,
      })),
    };
  },
});

export const getPipelineSummary = query({
  args: {},
  handler: async (ctx) => {
    const venues = await ctx.db.query("venues").collect();
    const projects = await ctx.db.query("projects").collect();
    const contacts = await ctx.db.query("contacts").collect();

    const countBy = <T extends Record<string, any>>(
      items: T[],
      field: keyof T,
    ): Record<string, number> => {
      const counts: Record<string, number> = {};
      for (const item of items) {
        const key = String(item[field]);
        counts[key] = (counts[key] || 0) + 1;
      }
      return counts;
    };

    return {
      venues: { total: venues.length, byStatus: countBy(venues, "status") },
      projects: {
        total: projects.length,
        byStatus: countBy(projects, "status"),
      },
      contacts: { total: contacts.length },
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const limit = 15;

    // Recently added venues
    const recentVenues = await ctx.db
      .query("venues")
      .order("desc")
      .take(limit);

    // Recently added projects
    const recentProjects = await ctx.db
      .query("projects")
      .order("desc")
      .take(limit);

    // Recently added people
    const recentContacts = await ctx.db
      .query("contacts")
      .order("desc")
      .take(limit);

    return {
      recentVenues: recentVenues.map((v) => ({
        _id: v._id,
        type: "venue" as const,
        title: v.name,
        status: v.status,
        _creationTime: v._creationTime,
      })),
      recentProjects: recentProjects.map((p) => ({
        _id: p._id,
        type: "project" as const,
        title: p.name,
        status: p.status,
        _creationTime: p._creationTime,
      })),
      recentContacts: recentContacts.map((c) => ({
        _id: c._id,
        type: "contact" as const,
        title: c.name,
        email: c.email,
        _creationTime: c._creationTime,
      })),
    };
  },
});

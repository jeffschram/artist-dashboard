import { query } from "./_generated/server";
import { v } from "convex/values";

export const getActionItems = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    // 1. Overdue tasks
    const tasks = await ctx.db.query("tasks").collect();
    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < args.today &&
        t.status !== "Completed" &&
        t.status !== "Cancelled",
    );

    // 2. Follow-ups due
    const outreach = await ctx.db.query("outreach").collect();
    const followUpsDue = outreach.filter(
      (o) =>
        o.followUpDate &&
        o.followUpDate <= args.today &&
        o.status !== "Responded" &&
        o.status !== "Declined" &&
        o.status !== "Accepted",
    );

    // 3. Stale outreach: awaiting response for > 7 days
    const sevenDaysAgo = new Date(args.today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    const staleOutreach = outreach.filter(
      (o) => o.status === "Awaiting Response" && o.date < sevenDaysAgoStr,
    );

    // 4. Venues needing outreach: status "To Contact" with no outreach logged
    const venues = await ctx.db.query("venues").collect();
    const venuesWithOutreach = new Set(
      outreach.filter((o) => o.venueId).map((o) => o.venueId),
    );
    const venuesNeedingOutreach = venues.filter(
      (v) => v.status === "To Contact" && !venuesWithOutreach.has(v._id),
    );

    return {
      overdueTasks: overdueTasks.map((t) => ({
        _id: t._id,
        title: t.title,
        dueDate: t.dueDate!,
        priority: t.priority,
      })),
      followUpsDue: followUpsDue.map((o) => ({
        _id: o._id,
        subject: o.subject,
        followUpDate: o.followUpDate!,
        venueId: o.venueId,
        contactId: o.contactId,
      })),
      staleOutreach: staleOutreach.map((o) => ({
        _id: o._id,
        subject: o.subject,
        date: o.date,
        venueId: o.venueId,
        contactId: o.contactId,
      })),
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
    const tasks = await ctx.db.query("tasks").collect();
    const outreach = await ctx.db.query("outreach").collect();

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
      tasks: { total: tasks.length, byStatus: countBy(tasks, "status") },
      outreach: {
        total: outreach.length,
        byStatus: countBy(outreach, "status"),
      },
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const limit = 15;

    // Recent outreach
    const recentOutreach = await ctx.db
      .query("outreach")
      .order("desc")
      .take(limit);

    // Recently completed tasks
    const allTasks = await ctx.db.query("tasks").collect();
    const recentCompletedTasks = allTasks
      .filter((t) => t.status === "Completed")
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, limit);

    // Recently added venues
    const recentVenues = await ctx.db
      .query("venues")
      .order("desc")
      .take(limit);

    return {
      recentOutreach: recentOutreach.map((o) => ({
        _id: o._id,
        type: "outreach" as const,
        title: o.subject,
        date: o.date,
        status: o.status,
        _creationTime: o._creationTime,
      })),
      recentCompletedTasks: recentCompletedTasks.map((t) => ({
        _id: t._id,
        type: "task" as const,
        title: t.title,
        _creationTime: t._creationTime,
      })),
      recentVenues: recentVenues.map((v) => ({
        _id: v._id,
        type: "venue" as const,
        title: v.name,
        status: v.status,
        _creationTime: v._creationTime,
      })),
    };
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  venues: defineTable({
    orderNum: v.number(),
    name: v.string(),
    url: v.optional(v.string()),
    submissionFormUrl: v.optional(v.string()),
    locations: v.array(v.object({
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    })),
    // Legacy inline contacts — kept for backward compat during migration
    contacts: v.array(v.object({
      name: v.optional(v.string()),
      title: v.optional(v.string()),
      email: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
    // New relational contact references
    contactIds: v.optional(v.array(v.id("contacts"))),
    status: v.union(
      v.literal("Contacted"),
      v.literal("To Contact"),
      v.literal("Ignore"),
      v.literal("Previous Client"),
    ),
    category: v.union(
      v.literal("Ultimate Dream Goal"),
      v.literal("Accessible"),
      v.literal("Unconventional"),
    ),
    notes: v.optional(v.string()),
  })
    .index("by_order", ["orderNum"]),

  projects: defineTable({
    name: v.string(),
    venueIds: v.optional(v.array(v.id("venues"))), // Optional during migration
    venueId: v.optional(v.id("venues")), // Legacy field - will be removed after migration
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
  }),

  collaborators: defineTable({
    name: v.string(),
    url: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
  }),

  // Join table: which collaborators worked on which projects
  projectCollaborators: defineTable({
    projectId: v.id("projects"),
    collaboratorId: v.id("collaborators"),
  })
    .index("by_project", ["projectId"])
    .index("by_collaborator", ["collaboratorId"]),

  // Join table: which contacts (people) are associated with which projects
  projectContacts: defineTable({
    projectId: v.id("projects"),
    contactId: v.id("contacts"),
  })
    .index("by_project", ["projectId"])
    .index("by_contact", ["contactId"]),

  contacts: defineTable({
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
    venueIds: v.optional(v.array(v.id("venues"))), // Optional during migration
    venueId: v.optional(v.id("venues")), // Legacy field - will be removed after migration
    collaboratorId: v.optional(v.id("collaborators")),
  })
    .index("by_collaborator", ["collaboratorId"]),

  tasks: defineTable({
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
  })
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  // Join table: tasks associated with venues
  taskVenues: defineTable({
    taskId: v.id("tasks"),
    venueId: v.id("venues"),
  })
    .index("by_task", ["taskId"])
    .index("by_venue", ["venueId"]),

  // Join table: tasks associated with projects
  taskProjects: defineTable({
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
  })
    .index("by_task", ["taskId"])
    .index("by_project", ["projectId"]),

  // Join table: tasks assigned to people (contacts)
  taskContacts: defineTable({
    taskId: v.id("tasks"),
    contactId: v.id("contacts"),
  })
    .index("by_task", ["taskId"])
    .index("by_contact", ["contactId"]),

  // Outreach log — tracks correspondence with venues and people
  outreach: defineTable({
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
  })
    .index("by_venue", ["venueId"])
    .index("by_contact", ["contactId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_follow_up_date", ["followUpDate"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

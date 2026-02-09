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
    contacts: v.array(v.object({
      name: v.optional(v.string()),
      title: v.optional(v.string()),
      email: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
    status: v.union(v.literal("Contacted"), v.literal("To Contact"), v.literal("Ignore")),
    category: v.union(v.literal("Ultimate Dream Goal"), v.literal("Accessible"), v.literal("Unconventional")),
    notes: v.optional(v.string()),
  })
    .index("by_order", ["orderNum"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

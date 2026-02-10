import { query } from "./_generated/server";

// Simple auth replacement - no actual authentication needed
export const checkAuth = query({
  args: {},
  handler: async (ctx) => {
    // Always return authenticated for simplicity
    return { authenticated: true };
  },
});

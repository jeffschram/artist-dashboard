"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";

const SEARCH_QUERY_TEMPLATES = [
  `"immersive art" "open call"`,
  `"projection mapping" "artist submissions"`,
  `"new media art" "exhibition opportunity"`,
  `"digital art" "residency" "accepting applications"`,
  `"light festival" "call for artists"`,
  `"immersive experience" "artist" "commission"`,
  `"time-based media" "gallery" "submissions"`,
  `"video art" "installation" "open call"`,
  `"art and technology" "residency" OR "exhibition"`,
  `"projection art" "festival"`,
];

const PRIMARY_CITIES = [
  "NYC", "Los Angeles", "Chicago", "Houston", "Miami",
  "Washington DC", "San Francisco", "Denver", "Austin",
  "Phoenix", "Philadelphia", "Boston", "Seattle", "Portland", "Minneapolis",
];

const CLAUDE_SYSTEM_PROMPT = `You are a venue scout for Holly Danger, a video projection and immersive installation artist specializing in new media art, projection mapping, and interactive installations.

Your task is to evaluate web search results and identify legitimate venue opportunities. For each qualifying result, extract structured venue data.

## Qualification Criteria (ALL must be met)
1. Is an actual venue, institution, festival, or program -- not a news article, blog post, or directory listing
2. Hosts or commissions visual/installation/immersive art -- not purely performing arts unless they also feature installation work
3. Has a physical presence or event -- not purely online/virtual galleries
4. Appears to accept external artists -- has open calls, submission forms, residency applications, or a curatorial contact

## Bonus Indicators
- Has an active open call or upcoming deadline
- Specifically mentions new media, projection, immersive, or digital art
- Has previously shown work similar to video projection installations
- Has a submission form URL or direct curator contact

## Disqualification Criteria (FILTER OUT)
- News articles or press coverage about venues
- Social media posts or personal blogs
- Venues that only show traditional media (painting, sculpture) with no history of installation/new media
- Closed or defunct spaces
- Generic event listing aggregators (e.g., Eventbrite, Meetup)
- Art supply stores, equipment rental, or production companies

## Output Format
Return a JSON array of qualifying venues. Each venue object should have:
- "name": string (venue/institution name)
- "url": string (website URL)
- "city": string or null
- "state": string or null
- "country": string (default "US" if unclear)
- "notes": string (1-2 sentences on why it's relevant, include any deadlines found)
- "submissionFormUrl": string or null (direct link to submission/application form if found)

Return ONLY the JSON array, no other text. If no results qualify, return an empty array [].`;

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

interface BraveSearchResponse {
  web?: {
    results?: BraveSearchResult[];
  };
}

interface VenueCandidate {
  name: string;
  url: string;
  city: string | null;
  state: string | null;
  country: string;
  notes: string;
  submissionFormUrl: string | null;
}

async function braveSearch(
  query: string,
  apiKey: string,
  count: number = 10,
): Promise<BraveSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    count: String(count),
  });

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as BraveSearchResponse;
  return data.web?.results ?? [];
}

function buildSearchQueries(searchFocus: string | undefined): string[] {
  if (searchFocus && searchFocus.trim()) {
    const focus = searchFocus.trim();
    return [
      `"immersive art" ${focus}`,
      `"projection mapping" OR "new media art" ${focus}`,
      `"digital art" OR "video art" "open call" ${focus}`,
      `"art installation" "submissions" ${focus}`,
    ];
  }

  const currentYear = new Date().getFullYear();
  const queries: string[] = [];

  const citySubset = PRIMARY_CITIES.sort(() => Math.random() - 0.5).slice(0, 5);

  for (const city of citySubset) {
    const template = SEARCH_QUERY_TEMPLATES[
      Math.floor(Math.random() * SEARCH_QUERY_TEMPLATES.length)
    ];
    queries.push(`${template} ${city} ${currentYear}`);
  }

  queries.push(`"immersive art" "open call" ${currentYear}`);
  queries.push(`"projection mapping" "artist submissions" ${currentYear}`);
  queries.push(`"new media art" "residency" ${currentYear}`);

  return queries;
}

function deduplicateByDomain(results: BraveSearchResult[]): BraveSearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    try {
      const domain = new URL(r.url).hostname.replace("www.", "");
      if (seen.has(domain)) return false;
      seen.add(domain);
      return true;
    } catch {
      return false;
    }
  });
}

export const scout = action({
  args: {
    searchFocus: v.optional(v.string()),
    maxResults: v.optional(v.number()),
  },
  returns: v.object({
    inserted: v.number(),
    skipped: v.number(),
    searched: v.number(),
  }),
  handler: async (ctx, args) => {
    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!braveApiKey) {
      throw new Error("BRAVE_SEARCH_API_KEY environment variable is not set. Run: npx convex env set BRAVE_SEARCH_API_KEY <key>");
    }
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set. Run: npx convex env set ANTHROPIC_API_KEY <key>");
    }

    const queries = buildSearchQueries(args.searchFocus);
    const maxResults = args.maxResults ?? 10;

    let allResults: BraveSearchResult[] = [];
    for (const query of queries) {
      try {
        const results = await braveSearch(query, braveApiKey, 10);
        allResults = allResults.concat(results);
      } catch (error) {
        console.error(`Brave search failed for query "${query}":`, error);
      }
    }

    if (allResults.length === 0) {
      return { inserted: 0, skipped: 0, searched: 0 };
    }

    const uniqueResults = deduplicateByDomain(allResults);

    const searchResultsSummary = uniqueResults
      .map((r, i) => `${i + 1}. "${r.title}" - ${r.url}\n   ${r.description}`)
      .join("\n\n");

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here are ${uniqueResults.length} web search results to evaluate. Identify which ones are legitimate venue opportunities for an immersive/projection artist and extract their data.\n\n${searchResultsSummary}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let venues: VenueCandidate[] = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        venues = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Failed to parse Claude response:", error);
      console.error("Response was:", responseText);
      return { inserted: 0, skipped: 0, searched: uniqueResults.length };
    }

    const limitedVenues = venues.slice(0, maxResults);

    let inserted = 0;
    let skipped = 0;

    for (const venue of limitedVenues) {
      try {
        const result = await ctx.runMutation(
          internal.venueScoutHelpers.insertIfNew,
          {
            name: venue.name,
            url: venue.url || undefined,
            submissionFormUrl: venue.submissionFormUrl || undefined,
            city: venue.city || undefined,
            state: venue.state || undefined,
            country: venue.country || "US",
            notes: venue.notes
              ? `[Scout] ${venue.notes}`
              : "[Scout] Found by venue scout agent",
          },
        );
        if (result.wasInserted) {
          inserted++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Failed to insert venue "${venue.name}":`, error);
        skipped++;
      }
    }

    return { inserted, skipped, searched: uniqueResults.length };
  },
});


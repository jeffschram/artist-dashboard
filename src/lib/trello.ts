// Trello Integration Utility
// Creates cards in the Test Board using Trello REST API

const TODAY_LIST_ID = "6991ec9bdee967bc62cbbbd1"; // "Today" list in Test Board
const TRELLO_API_KEY = import.meta.env.VITE_TRELLO_API_KEY;
const TRELLO_TOKEN = import.meta.env.VITE_TRELLO_TOKEN;

/**
 * Creates a Trello card in the "Today" list of the Test Board
 * @param name - Card title
 * @param desc - Card description (supports markdown)
 * @returns Promise<{ id: string; url: string }> - Card ID and URL
 */
export async function createTrelloCard(
  name: string,
  desc: string,
): Promise<{ id: string; url: string }> {
  if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    throw new Error("Trello credentials not configured. Check .env.local file.");
  }

  try {
    const response = await fetch(
      `https://api.trello.com/1/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idList: TODAY_LIST_ID,
          name,
          desc,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Trello API error: ${response.status} ${error}`);
    }

    const card = await response.json();
    return { id: card.id, url: card.url };
  } catch (error) {
    console.error("Failed to create Trello card:", error);
    throw error;
  }
}

export { TODAY_LIST_ID };

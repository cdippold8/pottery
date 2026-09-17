import Anthropic from "@anthropic-ai/sdk";

export type ProductSuggestion = {
  name: string;
  category: "mug" | "planter" | "bowl" | "handmade" | "other";
  patternGuess: string;
  colorGuesses: string[];
  notes: string;
};

const SUGGEST_TOOL: Anthropic.Tool = {
  name: "suggest_product_details",
  description: "Suggest cataloging details for a piece of pottery based on its photo(s).",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "A short, descriptive product name based on its visual style, e.g. 'Speckled Blue Mug'.",
      },
      category: {
        type: "string",
        enum: ["mug", "planter", "bowl", "handmade", "other"],
        description: "Best-fit product category.",
      },
      patternGuess: {
        type: "string",
        description: "Best guess at the glaze/surface pattern or technique used, in a few words.",
      },
      colorGuesses: {
        type: "array",
        items: { type: "string" },
        description: "Names of the glaze colors visible on the piece, most prominent first.",
      },
      notes: {
        type: "string",
        description: "Any other useful observations for the potter cataloging this piece.",
      },
    },
    required: ["name", "category", "patternGuess", "colorGuesses", "notes"],
  },
};

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function suggestProductDetails(images: { base64: string; mediaType: string }[], context: {
  existingPatterns: string[];
  existingColors: string[];
}): Promise<ProductSuggestion> {
  if (!isAiConfigured()) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    tools: [SUGGEST_TOOL],
    tool_choice: { type: "tool", name: "suggest_product_details" },
    messages: [
      {
        role: "user",
        content: [
          ...images.map((img) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: img.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
              data: img.base64,
            },
          })),
          {
            type: "text" as const,
            text: `These are photo(s) of a handmade pottery piece for a potter's inventory catalog. Make your best guesses to help pre-fill the cataloging form.

Existing pattern names already in the catalog (reuse one of these if it clearly matches, otherwise suggest a new short pattern name): ${
              context.existingPatterns.length ? context.existingPatterns.join(", ") : "(none yet)"
            }

Existing glaze color names already in the catalog (reuse these if they match, otherwise suggest new color names): ${
              context.existingColors.length ? context.existingColors.join(", ") : "(none yet)"
            }`,
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("AI did not return a structured suggestion");
  }

  return toolUse.input as ProductSuggestion;
}

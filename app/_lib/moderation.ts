// app/lib/moderation.ts
import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";

interface ModerationCategories {
  hate: boolean;
  "hate/threatening": boolean;
  "self-harm": boolean;
  sexual: boolean;
  "sexual/minors": boolean;
  violence: boolean;
  "violence/graphic": boolean;
}

export async function moderateText(
  text: string
): Promise<{ flagged: boolean; categories?: ModerationCategories; error?: string }> {
  if (!OPENAI_API_KEY) {
    return { flagged: false, error: "No OpenAI API key set." };
  }
  try {
    const response = await axios.post(
      OPENAI_MODERATION_URL,
      { input: text },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const result = response.data.results[0];
    return { flagged: result.flagged, categories: result.categories };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Moderation API error";
    return { flagged: false, error: errorMessage };
  }
}

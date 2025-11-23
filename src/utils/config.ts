import type { Config } from "../types/index.js";
import { config } from "dotenv";

config();

if (
    !process.env.DISCORD_BOT_TOKEN || 
    !process.env.DISCORD_APP_ID ||
    !process.env.OPENROUTER_API_KEY
) {
    throw new Error("Missing required environment variables: DISCORD_BOT_TOKEN, DISCORD_APP_ID, OPENROUTER_API_KEY");
}

export const CONFIG: Config = {
    discord: {
        token: process.env.DISCORD_BOT_TOKEN,
        id: process.env.DISCORD_APP_ID
    },
    ai: {
        key: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_AI_MODEL || "mistralai/mixtral-8x7b-instruct"
    },
    db: process.env.DB_DIR || "db",
    prompts: process.env.PROMPT_DIR || "prompts"
};

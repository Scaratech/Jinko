import type { Config } from "../types/index.ts";
import { config } from "dotenv";

config();

if (
    !process.env.DISCORD_BOT_TOKEN || 
    !process.env.DISCORD_APP_ID ||
    !process.env.OPENROUTER_API_KEY
) {
    throw new Error("Missing required environment variable(s)");
}

export const CONFIG: Config = {
    discord: {
        token: String(process.env.DISCORD_BOT_TOKEN),
        id: String(process.env.DISCORD_APP_ID)
    },
    ai: {
        key: String(process.env.OPENROUTER_API_KEY),
        model: String(process.env.OPENROUTER_AI_MODEL) || "mistralai/mixtral-8x7b-instruct"
    },
    db: String(process.env.DB_DIR) || "db/",
    prompts: String(process.env.PROMPT_DIR) || "prompts/"
};

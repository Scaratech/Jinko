import { CONFIG } from "./config.js";
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
    apiKey: CONFIG.ai.key
});

let cached: string[] = [];
let lastFetch = 0;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchModels(): Promise<string[]> {
    const now = Date.now();
    if (cached.length && (now - lastFetch) < TTL_MS) return cached;

    try {
        const response = await openrouter.models.list();
        
        if (response.data && Array.isArray(response.data)) {
            cached = response.data.map(m => m.id).filter(Boolean);
            lastFetch = now;
        } else {
            throw new Error("Invalid response format");
        }
    } catch (err) {
        console.error("Error fetching models:", err);
        if (!cached.length) cached = [CONFIG.ai.model];
    }

    return cached;
}

export async function searchModels(prefix: string): Promise<string[]> {
    const models = await fetchModels();
    if (!prefix) return models.slice(0, 25);

    const lowered = prefix.toLowerCase();
    return models.filter(m => m.toLowerCase().includes(lowered)).slice(0, 25);
}

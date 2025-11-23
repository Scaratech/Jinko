import { CONFIG } from "./config.js";

interface OpenRouterModel {
    id: string;
    name?: string;
}

let cached: string[] = [];
let lastFetch = 0;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchModels(): Promise<string[]> {
    const now = Date.now();
    if (cached.length && (now - lastFetch) < TTL_MS) return cached;

    try {
        const res = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${CONFIG.ai.key}`,
                "Accept": "application/json"
            }
        });

        if (!res.ok) throw new Error(`OR models request failed: ${res.status}`);

        const json: any = await res.json();
        const list: OpenRouterModel[] = Array.isArray(json.data) ? json.data : [];

        cached = list.map(m => m.id).filter(Boolean);
        lastFetch = now;
    } catch {
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

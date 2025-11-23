import { CONFIG } from "./config.js";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface Prompt {
    id: string;
    content: string;
}

export function getPrompts(): Prompt[] {
    const dir = join(process.cwd(), CONFIG.prompts);
    let files: string[] = [];

    try {
        files = readdirSync(dir);
    } catch {
        return [];
    }

    const prompts: Prompt[] = [];

    for (const file of files) {
        if (!file.endsWith(".txt")) continue;
        const path = join(dir, file);

        try {
            const content = readFileSync(path, "utf-8");
            const id = file.slice(0, -4);

            prompts.push({ id, content });
        } catch { }
    }

    return prompts;
}

export function getPromptIds(): string[] {
    return getPrompts().map(p => p.id).sort();
}

export function getPrompt(id: string): string | null {
    const dir = join(process.cwd(), CONFIG.prompts);
    const path = join(dir, `${id}.txt`);

    try {
        return readFileSync(path, "utf-8");
    } catch {
        return null;
    }
}

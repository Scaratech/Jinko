import { CONFIG } from "./config.js";
import { DB } from "./DB.js";
import { join } from "node:path";

const root = join(process.cwd(), CONFIG.db);
const activeDB = new DB({ rootDir: root, jsonIndent: 0, autoSave: true });

let initialized = false;

async function ensureInit() {
    if (!initialized) {
        await activeDB.init();
        initialized = true;
    }
}

export async function getActiveProfile(userId: string): Promise<string | null> {
    await ensureInit();
    return activeDB.get<string>(`active:${userId}`) || null;
}

export async function setActiveProfile(userId: string, profileName: string): Promise<void> {
    await ensureInit();
    await activeDB.set(`active:${userId}`, profileName);
}

export async function clearActiveProfile(userId: string): Promise<void> {
    await ensureInit();
    await activeDB.delete(`active:${userId}`);
}

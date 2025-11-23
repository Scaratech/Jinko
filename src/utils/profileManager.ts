import type { ProfileData, ConversationData } from "../types/index.js";
import { mkdir, access, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { CONFIG } from "./config.js";

const DB_ROOT = join(process.cwd(), CONFIG.db);

async function ensureDir(dir: string): Promise<void> {
    try {
        await access(dir, constants.F_OK);
    } catch {
        await mkdir(dir, { recursive: true });
    }
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function listProfiles(): Promise<string[]> {
    await ensureDir(DB_ROOT);
    try {
        const entries = await readdir(DB_ROOT, { withFileTypes: true });
        const profiles: string[] = [];
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const index = join(DB_ROOT, entry.name, "index.json");

                if (await fileExists(index)) {
                    profiles.push(entry.name);
                }
            }
        }
        
        return profiles.sort();
    } catch {
        return [];
    }
}

export async function profileExists(name: string): Promise<boolean> {
    const profile = join(DB_ROOT, name);
    const index = join(profile, "index.json");
    return await fileExists(index);
}

export async function getProfile(name: string): Promise<ProfileData | null> {
    const index = join(DB_ROOT, name, "index.json");
    
    try {
        const raw = await readFile(index, "utf-8");
        return JSON.parse(raw) as ProfileData;
    } catch {
        return null;
    }
}

export async function createProfile(name: string, promptId: string, model: string): Promise<void> {
    const profile = join(DB_ROOT, name);
    await ensureDir(profile);
    
    const now = new Date().toISOString();
    const profileData: ProfileData = {
        name,
        promptId,
        model,
        createdAt: now,
        updatedAt: now
    };
    
    const index = join(profile, "index.json");
    await writeFile(index, JSON.stringify(profileData), "utf-8");
    
    const conversationData: ConversationData = { messages: [] };
    const conversationPath = join(profile, "conversation.json");
    await writeFile(conversationPath, JSON.stringify(conversationData), "utf-8");
}

export async function updateProfile(name: string, updates: Partial<Pick<ProfileData, "promptId" | "model">>): Promise<void> {
    const profile = await getProfile(name);
    if (!profile) throw new Error(`Profile '${name}' not found`);
    
    const updated: ProfileData = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    const index = join(DB_ROOT, name, "index.json");
    await writeFile(index, JSON.stringify(updated), "utf-8");
}

export async function renameProfile(oldName: string, newName: string): Promise<void> {
    const oldPath = join(DB_ROOT, oldName);
    const newPath = join(DB_ROOT, newName);
    
    if (await fileExists(newPath)) {
        throw new Error(`Profile '${newName}' already exists`);
    }
    
    const profile = await getProfile(oldName);
    if (!profile) throw new Error(`Profile '${oldName}' not found`);
    
    profile.name = newName;
    profile.updatedAt = new Date().toISOString();
    
    await ensureDir(newPath);
    
    const index = join(newPath, "index.json");
    await writeFile(index, JSON.stringify(profile), "utf-8");
    
    const oldConvo = join(oldPath, "conversation.json");
    const newConvo = join(newPath, "conversation.json");

    if (await fileExists(oldConvo)) {
        const convoData = await readFile(oldConvo, "utf-8");
        await writeFile(newConvo, convoData, "utf-8");
    }
    
    await rm(oldPath, { recursive: true, force: true });
}

export async function deleteProfile(name: string): Promise<void> {
    const profile = join(DB_ROOT, name);
    await rm(profile, { recursive: true, force: true });
}

export async function clearConversation(name: string): Promise<void> {
    const conversationPath = join(DB_ROOT, name, "conversation.json");
    const conversationData: ConversationData = { messages: [] };
    await writeFile(conversationPath, JSON.stringify(conversationData), "utf-8");
}

export async function getConversation(name: string): Promise<ConversationData | null> {
    const conversationPath = join(DB_ROOT, name, "conversation.json");
    
    try {
        const raw = await readFile(conversationPath, "utf-8");
        return JSON.parse(raw) as ConversationData;
    } catch {
        return null;
    }
}

export async function addMessage(name: string, role: "user" | "assistant", content: string): Promise<void> {
    const conversationPath = join(DB_ROOT, name, "conversation.json");
    const conversation = await getConversation(name);
    
    if (!conversation) {
        throw new Error(`Conversation for profile '${name}' not found`);
    }
    
    conversation.messages.push({
        role,
        content,
        timestamp: new Date().toISOString()
    });
    
    await writeFile(conversationPath, JSON.stringify(conversation), "utf-8");
}

import type { 
    DBOptions, 
    IDB, 
    DBFileIndex, 
    JSONValue 
} from "../types/index.js";
import { mkdir, access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

export class DB implements IDB {
    private readonly opts: Required<Pick<DBOptions, "rootDir" | "jsonIndent" | "autoSave">>;
    private index: DBFileIndex;
    private initialized = false;

    constructor(options: DBOptions) {
        this.opts = {
            rootDir: options.rootDir,
            jsonIndent: options.jsonIndent ?? 2,
            autoSave: options.autoSave ?? true
        };
        this.index = {
            filePath: join(this.opts.rootDir, "index.json"),
            data: {}
        };
    }

    async init(): Promise<void> {
        if (this.initialized) return;

        await this.ensureDir(this.opts.rootDir);
        await this.ensureFile();

        this.initialized = true;
    }

    get<T = JSONValue>(key: string): T | undefined {
        return this.index.data[key] as T | undefined;
    }

    async set<T = JSONValue>(key: string, value: T): Promise<void> {
        this.index.data[key] = value as JSONValue;
        if (this.opts.autoSave) await this.save();
    }

    async delete(key: string): Promise<void> {
        delete this.index.data[key];
        if (this.opts.autoSave) await this.save();
    }

    has(key: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.index.data, key);
    }

    all(): Record<string, JSONValue> {
        return { ...this.index.data };
    }

    async save(): Promise<void> {
        const serialized = JSON.stringify(this.index.data, null, this.opts.jsonIndent);
        await writeFile(this.index.filePath, serialized, "utf-8");
    }

    private async ensureDir(dir: string) {
        try {
            await access(dir, constants.F_OK);
        } catch {
            await mkdir(dir, { recursive: true });
        }
    }

    private async ensureFile() {
        try {
            await access(this.index.filePath, constants.F_OK);
            const raw = await readFile(this.index.filePath, "utf-8");
            this.index.data = raw.trim() ? JSON.parse(raw) : {};
        } catch {
            await writeFile(this.index.filePath, "{}", "utf-8");
            this.index.data = {};
        }
    }
}

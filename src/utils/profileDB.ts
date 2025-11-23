import { CONFIG } from "../utils/config.js";
import { DB } from "../utils/DB.js";
import { join } from "node:path"

const root = join(process.cwd(), CONFIG.db);
const profileDB = new DB({ rootDir: root, jsonIndent: 0, autoSave: true });

export async function ensure() {
    await profileDB.init();
    return profileDB;
}

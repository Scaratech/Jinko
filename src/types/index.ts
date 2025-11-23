import type { Command } from "./Command.js";
export * from "./DB.js";
import { Collection } from "discord.js";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, Command>;
    }
}

export * from "./Config.js";
export * from "./DB.js";
export { Command };

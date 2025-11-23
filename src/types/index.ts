import type { Command } from "./Command.ts";
import { Collection } from "discord.js";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, Command>;
    }
}

export * from "./Config.js";
export { Command };

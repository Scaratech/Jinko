import { ping, about, model, prompts, help } from "./commands/index.js";
import { CONFIG } from "./utils/config.js";
import { REST, Routes } from "discord.js";

const commands = [
    ping.data.toJSON(),
    about.data.toJSON(),
    model.data.toJSON(),
    prompts.data.toJSON(),
    help.data.toJSON()
];

const rest = new REST().setToken(CONFIG.discord.token);

async function deployer() {
    try {
        console.log(`Refreshing ${commands.length} commands`);

        const data: any = await rest.put(
            Routes.applicationCommands(CONFIG.discord.id),
            { body: commands }
        );

        console.log(`Reloaded ${data.length} commands`);
    } catch (err) {
        console.error("Error deploying commands:", err);
    }
}

deployer();

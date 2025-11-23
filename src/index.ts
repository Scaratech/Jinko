/// TYPE IMPORTS ///
import type { 
    Command 
} from "./types/index.ts";

/// COMMAND IMPORTS ///
import {
    ping
} from "./commands/index.ts";

/// DISCORD.JS IMPORTS ///
import type { Interaction } from "discord.js";
import {
    Collection,
    Events,
} from "discord.js";

/// OTHER IMPORTS ///
import { CONFIG } from "./utils/config.ts";
import { client } from "./utils/client.ts";

console.clear();

// Set commands
client.commands = new Collection<string, Command>();
client.commands.set(ping.data.name, ping);

client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}`);
});

// On command
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);

    // Command not found
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(`Error executing command ${interaction.commandName}:`, err);

        const reply = {
            content: "There was an error executing this command",
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

client.login(CONFIG.discord.token);

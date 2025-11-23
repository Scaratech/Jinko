/// TYPE IMPORTS ///
import type { Command } from "./types/index.js";

/// COMMAND IMPORTS ///
import { ping, about, model, prompts } from "./commands/index.js";

/// DISCORD.JS IMPORTS ///
import type { Interaction } from "discord.js";
import {
    Collection,
    Events,
} from "discord.js";

/// OTHER IMPORTS ///
import { CONFIG } from "./utils/config.js";
import { client } from "./utils/client.js";

console.clear();

// Set commands
client.commands = new Collection<string, Command>();
client.commands.set(ping.data.name, ping);
client.commands.set(about.data.name, about);
client.commands.set(model.data.name, model);
client.commands.set(prompts.data.name, prompts);

client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}`);
});

// On command
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    // Autocomplete interactions
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        try {
            if (command?.autocomplete) await command.autocomplete(interaction);
        } catch (err) {
            console.error(`Error during autocomplete for ${interaction.commandName}:`, err);
        }
        return;
    }

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

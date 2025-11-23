import type { Command } from "../types/index.js";
import type { ChatInputCommandInteraction, AutocompleteInteraction } from "discord.js";

import { searchModels } from "../utils/openRouter.js";
import { CONFIG } from "../utils/config.js";
import { DB } from "../utils/DB.js";

import { join } from "node:path"
import { SlashCommandBuilder, InteractionContextType } from "discord.js";

const root = join(process.cwd(), CONFIG.db);
const profileDB = new DB({ rootDir: root, jsonIndent: 0, autoSave: true });

async function ensure() {
    await profileDB.init();
    return profileDB;
}

export const model: Command = {
    data: new SlashCommandBuilder()
        .setName("model")
        .setDescription("Set default AI model")
        .addStringOption(o => o.setName("select").setDescription("Model to use").setAutocomplete(true))
        .setContexts([
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([1]),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const db = await ensure();
        const key = "model";
        const model = interaction.options.getString("select");

        if (model) {
            await db.set(key, model);
        }

        await interaction.editReply('Model set');
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const focused = interaction.options.getFocused(true);
        if (focused.name !== "select") return;

        const query = focused.value;
        const results = await searchModels(query);

        await interaction.respond(results.map(r => ({ name: r, value: r })));
    }
};

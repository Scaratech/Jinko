import type { Command } from "../types/index.js";
import type { ChatInputCommandInteraction, AutocompleteInteraction } from "discord.js";
import { ensure } from "../utils/profileDB.js";
import { searchModels } from "../utils/openRouter.js";
import { SlashCommandBuilder, InteractionContextType } from "discord.js";

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
            await interaction.editReply(`Model set to: ${model}`);
        } else {
            const current = db.get<string>(key);
            if (current) {
                await interaction.editReply(`Current model: ${current}`);
            } else {
                await interaction.editReply("No model set. Use the select option to choose one.");
            }
        }
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const focused = interaction.options.getFocused(true);
        if (focused.name !== "select") return;

        const query = focused.value;
        const results = await searchModels(query);

        await interaction.respond(results.map(r => ({ name: r, value: r })));
    }
};

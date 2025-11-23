import type { Command } from "../types/index.ts";
import {
    SlashCommandBuilder,
    InteractionContextType
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

export const ping: Command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Pong")
        .setContexts([
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([1]),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const sent = await interaction.fetchReply();
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        await interaction.editReply(
            `Latency: ${latency}ms\n` +
            `API Latency: ${apiLatency}ms`
        );
    },
};

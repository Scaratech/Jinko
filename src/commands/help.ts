import type { Command } from "../types/index.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder, InteractionContextType } from "discord.js";

export const help: Command = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Help message")
        .setContexts([
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([1]),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const body = [
            "**Welcome to Jinko!**",
            "",
            "To get started, please follow these steps:",
            "1. Use the `/model` command to select your preferred AI model",
            "2. Create a profile using the `/profile create name:\"ProfileName\"` command",
            "3. Edit your profile to set a prompt with `/profile edit name:\"ProfileName\" promptId:\"PromptID\"`",
            "4. Switch to your profile using `/profile set name:\"ProfileName\"`",
            "",
            "Once you've completed these steps, you can start chatting with the AI!"
        ].join("\n");

        await interaction.editReply(body);
    },
};

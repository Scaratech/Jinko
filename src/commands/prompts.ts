import type { Command } from "../types/index.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder, InteractionContextType } from "discord.js";
import { getPromptIds, getPrompt } from "../utils/prompts.js";

function sanitizeId(id: string): string {
	return id.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 64);
}

export const prompts: Command = {
	data: new SlashCommandBuilder()
		.setName("prompts")
		.setDescription("List or read prompts")
		.addSubcommand(sc => sc.setName("list").setDescription("List all prompts"))
		.addSubcommand(sc => sc.setName("read").setDescription("Read a prompt").addStringOption(o => o.setName("id").setDescription("Prompt ID").setRequired(true)))
		.setContexts([
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
			InteractionContextType.Guild
		])
		.setIntegrationTypes([1]),

	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const sub = interaction.options.getSubcommand();

		if (sub === "list") {
			const ids = getPromptIds();

			if (!ids.length) {
				await interaction.editReply("No prompts found.");
				return;
			}

			const body = ["All prompts:", ...ids.map(i => `- ${i}`)].join("\n");
			await interaction.editReply(body);
			return;
		}

		if (sub === "read") {
			const rawId = interaction.options.getString("id", true);
			const id = sanitizeId(rawId);

			if (!id) {
				await interaction.editReply("Invalid prompt ID.");
				return;
			}

			const content = getPrompt(id);

			if (content === null) {
				await interaction.editReply(`Prompt '${id}' not found.`);
				return;
			}

			const body = content.trim().slice(0, 1900);
			await interaction.editReply(body);
			return;
		}

		await interaction.editReply("Unknown subcommand.");
	}
};

import type { Command } from "../types/index.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { ensure } from "../utils/profileDB.js";
import { SlashCommandBuilder, InteractionContextType } from "discord.js";

export const about: Command = {
    data: new SlashCommandBuilder()
        .setName("about")
        .setDescription("Give the AI info about you or view saved profile")
        .addStringOption(o => o.setName("name").setDescription("Your name (e.g. alice)").setMinLength(1).setMaxLength(64))
        .addStringOption(o => o.setName("pronouns").setDescription("Your pronouns (e.g. she/her)").setMaxLength(32))
        .addStringOption(o => o.setName("gender").setDescription("Your gender (e.g. woman)").setMaxLength(32))
        .addIntegerOption(o => o.setName("age").setDescription("Your age (e.g. 16)").setMinValue(1).setMaxValue(120))
        .addStringOption(o => o.setName("location").setDescription("Approximate location / timezone (e.g. EST)").setMaxLength(64))
        .addStringOption(o => o.setName("sexuality").setDescription("Your sexuality (e.g. lesbian)").setMaxLength(32))
        .addStringOption(o => o.setName("interests").setDescription("Comma-separated interests (e.g. vocaloid, project sekai)").setMaxLength(256))
        .addStringOption(o => o.setName("likes").setDescription("Things you like (comma-separated) (e.g. Monster Energy, Sleep)").setMaxLength(256))
        .addStringOption(o => o.setName("dislikes").setDescription("Things you dislike (comma-separated) (e.g. spiders)").setMaxLength(256))
        .setContexts([
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([1]),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const db = await ensure();

        const user = interaction.user;
        const key = "about";
        const fields: Record<string, any> = {};

        for (const opt of [
            "name", "pronouns", "gender", "location", "sexuality", "interests", "likes", "dislikes"
        ]) {
            const v = interaction.options.getString(opt);
            if (v) fields[opt] = v.trim();
        }

        const age = interaction.options.getInteger("age");
        if (age) fields.age = age;

        let action: "saved" | "view" = "view";

        if (Object.keys(fields).length > 0) {
            const existing = db.get<Record<string, any>>(key) || {};
            const updated = { ...existing, ...fields, updatedAt: Date.now() };

            await db.set(key, updated);
            action = "saved";
        }

        const profile = db.get<Record<string, any>>(key) || {};
        const created = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
        const header = action === "saved" ? "Profile saved" : "Your profile";
        const lines: string[] = [
            `${header}`,
            `User: ${user.tag} (${user.id})`,
            `Account Created: ${created}`
        ];
        const ordered = [
            "name", "pronouns", "gender",
            "age", "location", "sexuality",
            "interests", "likes", "dislikes"
        ] as const;

        for (const key of ordered) {
            if (key in profile) {
                lines.push(`${key[0].toUpperCase() + key.slice(1)}: ${profile[key]}`);
            }
        }

        if (Object.keys(profile).length === 0) {
            lines.push("No profile data saved yet");
        }

        await interaction.editReply('Profile saved');
    }
};

export default about;

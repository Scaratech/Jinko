import type { Command } from "../types/index.js";
import type { ChatInputCommandInteraction, AutocompleteInteraction } from "discord.js";
import { 
    listProfiles, 
    profileExists, 
    getProfile, 
    createProfile, 
    updateProfile, 
    renameProfile,
    deleteProfile, 
    clearConversation 
} from "../utils/profileManager.js";
import { getPromptIds } from "../utils/prompts.js";
import { searchModels } from "../utils/openRouter.js";
import { setActiveProfile } from "../utils/activeProfiles.js";
import { SlashCommandBuilder, InteractionContextType } from "discord.js";

function sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 32);
}

const pendingConfirmations = new Map<string, { 
    action: "remove" | "clear", 
    target: string, 
    timestamp: number 
}>();

const CONFIRMATION_TIMEOUT = 60000; // 60 seconds

export const profile: Command = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Manage conversation profiles")
        .addSubcommand(sc => 
            sc.setName("list")
                .setDescription("List all profiles")
        )
        .addSubcommand(sc => 
            sc.setName("create")
                .setDescription("Create a new profile")
                .addStringOption(o => 
                    o.setName("name")
                        .setDescription("Profile name")
                        .setRequired(true)
                )
                .addStringOption(o => 
                    o.setName("prompt")
                        .setDescription("System prompt ID")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(o => 
                    o.setName("model")
                        .setDescription("AI model")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(sc => 
            sc.setName("remove")
                .setDescription("Delete a profile (requires verification)")
                .addStringOption(o => 
                    o.setName("name")
                        .setDescription("Profile name")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(sc => 
            sc.setName("edit")
                .setDescription("Edit a profile")
                .addStringOption(o => 
                    o.setName("name")
                        .setDescription("Profile name")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(o => 
                    o.setName("newname")
                        .setDescription("New profile name")
                        .setRequired(false)
                )
                .addStringOption(o => 
                    o.setName("prompt")
                        .setDescription("New system prompt ID")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption(o => 
                    o.setName("model")
                        .setDescription("New AI model")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(sc => 
            sc.setName("clear")
                .setDescription("Clear message history (requires verification)")
                .addStringOption(o => 
                    o.setName("name")
                        .setDescription("Profile name")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(sc => 
            sc.setName("set")
                .setDescription("Switch to a profile")
                .addStringOption(o => 
                    o.setName("name")
                        .setDescription("Profile name")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(sc => 
            sc.setName("confirm")
                .setDescription("Confirm a pending destructive action")
        )
        .setContexts([
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
            InteractionContextType.Guild
        ])
        .setIntegrationTypes([1]),

    async autocomplete(interaction: AutocompleteInteraction) {
        const focused = interaction.options.getFocused(true);
        
        if (focused.name === "name") {
            const profiles = await listProfiles();
            const filtered = profiles
                .filter(p => p.toLowerCase().includes(focused.value.toLowerCase()))
                .slice(0, 25);
            
            await interaction.respond(
                filtered.map(name => ({ name, value: name }))
            );

            return;
        }
        
        if (focused.name === "prompt") {
            const promptIds = getPromptIds();
            const filtered = promptIds
                .filter(id => id.toLowerCase().includes(focused.value.toLowerCase()))
                .slice(0, 25);
            
            await interaction.respond(
                filtered.map(id => ({ name: id, value: id }))
            );

            return;
        }
        
        if (focused.name === "model") {
            const models = await searchModels(focused.value);
            await interaction.respond(
                models.map(m => ({ name: m, value: m }))
            );

            return;
        }
    },

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const sub = interaction.options.getSubcommand();

        if (sub === "list") {
            const profiles = await listProfiles();
            
            if (!profiles.length) {
                await interaction.editReply("No profiles found. Create one with `/profiles create`.");
                return;
            }
            
            const list = profiles.map(name => `- ${name}`).join("\n");
            await interaction.editReply(`All profiles:\n${list}`);

            return;
        }

        if (sub === "create") {
            const rawName = interaction.options.getString("name", true);
            const name = sanitizeName(rawName);
            const promptId = interaction.options.getString("prompt", true);
            const model = interaction.options.getString("model", true);
            
            if (!name) {
                await interaction.editReply("Invalid profile name.");
                return;
            }
            
            if (await profileExists(name)) {
                await interaction.editReply(`Profile '${name}' already exists.`);
                return;
            }
            
            try {
                await createProfile(name, promptId, model);
                await interaction.editReply(`Profile '${name}' created successfully.`);
            } catch (err) {
                console.error("Error creating profile:", err);
                await interaction.editReply("Failed to create profile.");
            }

            return;
        }

        if (sub === "remove") {
            const name = interaction.options.getString("name", true);
            
            if (!(await profileExists(name))) {
                await interaction.editReply(`Profile '${name}' not found.`);
                return;
            }
            
            pendingConfirmations.set(interaction.user.id, {
                action: "remove",
                target: name,
                timestamp: Date.now()
            });
            
            await interaction.editReply(
                `Delete profile '${name}'?\n` +
                `This will permanently delete all data.\n\n` +
                `Run \`/profiles confirm\` within 60 seconds to proceed.`
            );

            return;
        }

        if (sub === "edit") {
            const name = interaction.options.getString("name", true);
            const inn = interaction.options.getString("newname");
            const promptId = interaction.options.getString("prompt");
            const model = interaction.options.getString("model");
            
            if (!(await profileExists(name))) {
                await interaction.editReply(`Profile '${name}' not found.`);
                return;
            }
            
            if (!inn && !promptId && !model) {
                await interaction.editReply("Please specify at least one field to update.");
                return;
            }
            
            try {
                let final = name;
                
                if (inn) {
                    const newName = sanitizeName(inn);

                    if (!newName) {
                        await interaction.editReply("Invalid new profile name.");
                        return;
                    }
                    
                    if (newName !== name) {
                        if (await profileExists(newName)) {
                            await interaction.editReply(`Profile '${newName}' already exists.`);
                            return;
                        }

                        await renameProfile(name, newName);
                        final = newName;
                    }
                }
                
                if (promptId || model) {
                    const updates: any = {};

                    if (promptId) updates.promptId = promptId;
                    if (model) updates.model = model;

                    await updateProfile(final, updates);
                }

                await interaction.editReply(`Profile updated successfully.`);
            } catch (err) {
                console.error("Error updating profile:", err);
                await interaction.editReply("Failed to update profile.");
            }

            return;
        }

        if (sub === "clear") {
            const name = interaction.options.getString("name", true);
            
            if (!(await profileExists(name))) {
                await interaction.editReply(`Profile '${name}' not found.`);
                return;
            }
            
            pendingConfirmations.set(interaction.user.id, {
                action: "clear",
                target: name,
                timestamp: Date.now()
            });
            
            await interaction.editReply(
                `Clear conversation history for '${name}'?\n` +
                `This cannot be undone.\n\n` +
                `Run \`/profiles confirm\` within 60 seconds to proceed.`
            );

            return;
        }

        if (sub === "set") {
            const name = interaction.options.getString("name", true);
            
            if (!(await profileExists(name))) {
                await interaction.editReply(`Profile '${name}' not found.`);
                return;
            }
            
            const profileData = await getProfile(name);

            if (!profileData) {
                await interaction.editReply("Failed to load profile data.");
                return;
            }
            
            await setActiveProfile(interaction.user.id, name);
            
            await interaction.editReply(
                `Switched to profile '${name}'.\n` +
                `Prompt: ${profileData.promptId}\n` +
                `Model: ${profileData.model}`
            );

            return;
        }

        if (sub === "confirm") {
            const pending = pendingConfirmations.get(interaction.user.id);
            
            if (!pending) {
                await interaction.editReply("No pending confirmation.");
                return;
            }
            
            if (Date.now() - pending.timestamp > CONFIRMATION_TIMEOUT) {
                pendingConfirmations.delete(interaction.user.id);
                await interaction.editReply("Confirmation expired. Please try again.");
                return;
            }
            
            try {
                if (pending.action === "remove") {
                    await deleteProfile(pending.target);
                    await interaction.editReply(`Profile '${pending.target}' deleted.`);
                } else if (pending.action === "clear") {
                    await clearConversation(pending.target);
                    await interaction.editReply(`Conversation history for '${pending.target}' cleared.`);
                }
                
                pendingConfirmations.delete(interaction.user.id);
            } catch (err) {
                console.error(`Error confirming ${pending.action}:`, err);
                await interaction.editReply("Failed to complete the action.");
            }
            return;
        }

        await interaction.editReply("Unknown subcommand.");
    }
};

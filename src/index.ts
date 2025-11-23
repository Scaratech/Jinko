/// TYPE IMPORTS ///
import type { Command } from "./types/index.js";

/// COMMAND IMPORTS ///
import { ping, about, model, prompts, profiles, help } from "./commands/index.js";

/// DISCORD.JS IMPORTS ///
import type { Interaction, Message } from "discord.js";
import {
    Collection,
    Events,
} from "discord.js";

/// OTHER IMPORTS ///
import { CONFIG } from "./utils/config.js";
import { client } from "./utils/client.js";
import { getActiveProfile } from "./utils/activeProfiles.js";
import { getProfile, getConversation, addMessage } from "./utils/profileManager.js";
import { getPrompt } from "./utils/prompts.js";
import { ensure } from "./utils/profileDB.js";
import { createChatCompletion, buildSystemPrompt, conversationToMsg } from "./utils/chat.js";

console.clear();

// Set commands
client.commands = new Collection<string, Command>();
client.commands.set(ping.data.name, ping);
client.commands.set(about.data.name, about);
client.commands.set(model.data.name, model);
client.commands.set(prompts.data.name, prompts);
client.commands.set(profiles.data.name, profiles);
client.commands.set(help.data.name, help);

client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}`);
});

// On command
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
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

// On message
client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;
    if (!message.channel.isDMBased()) return;
    
    try {
        const profile = await getActiveProfile(message.author.id);
        
        if (!profile) {
            await message.reply("No active profile set. Use `/profiles set` to select a profile first.");
            return;
        }
        
        const data = await getProfile(profile);
        
        if (!data) {
            await message.reply("Failed to load profile data. Please set a valid profile.");
            return;
        }
        
        const content = getPrompt(data.promptId);
        
        if (!content) {
            await message.reply(`Prompt '${data.promptId}' not found. Please update your profile.`);
            return;
        }
        
        const db = await ensure();
        const aboutInfo = db.get<Record<string, any>>("about") || {};
        const systemPrompt = buildSystemPrompt(content, aboutInfo);
        const conversation = await getConversation(profile);
        
        if (!conversation) {
            await message.reply("Failed to load conversation history.");
            return;
        }
        
        await addMessage(profile, "user", message.content);
        
        const chatMessages = conversationToMsg(systemPrompt, [
            ...conversation.messages,
            { role: "user", content: message.content, timestamp: new Date().toISOString() }
        ]);
        
        if ("sendTyping" in message.channel) {
            await message.channel.sendTyping();
        }
        
        const aiResponse = await createChatCompletion(data.model, chatMessages);
        await addMessage(profile, "assistant", aiResponse);
        
        if (aiResponse.length <= 2000) {
            await message.reply(aiResponse);
        } else {
            const chunks = aiResponse.match(/[\s\S]{1,2000}/g) || [aiResponse];
            await message.reply(chunks[0]);
            
            for (let i = 1; i < chunks.length; i++) {
                if ("send" in message.channel) {
                    await message.channel.send(chunks[i]);
                }
            }
        }
        
    } catch (err) {
        console.error("Error handling message:", err);
        await message.reply("An error occurred while processing your message. Please try again.");
    }
});

client.login(CONFIG.discord.token);

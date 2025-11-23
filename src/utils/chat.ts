import { CONFIG } from "./config.js";
import type { ConversationMessage } from "../types/index.js";
import { OpenRouter } from "@openrouter/sdk";

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

const openrouter = new OpenRouter({
    apiKey: CONFIG.ai.key
});

export async function createChatCompletion(
    model: string,
    messages: ChatMessage[]
): Promise<string> {
    try {
        const completion = await openrouter.chat.send({
            model,
            messages,
            maxTokens: 1000,
            temperature: 0.8
        });

        if (!completion.choices || completion.choices.length === 0) {
            throw new Error("No response from AI model");
        }

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("Empty response from AI model");
        }

        if (typeof content === "string") {
            return content;
        }

        const textContent = content.find((item: any) => item.type === "text");

        if (textContent && "text" in textContent) {
            return textContent.text;
        }

        throw new Error("No text content in response");
    } catch (err) {
        console.error("Error calling OpenRouter:", err);
        throw err;
    }
}

export function buildSystemPrompt(content: string, about: Record<string, any>): string {
    let systemPrompt = content;
    
    if (Object.keys(about).length > 0) {
        systemPrompt += "\n\n### User Information\n";
        
        const fields = [
            "name", "pronouns", "gender", "age", 
            "location", "sexuality", "interests", 
            "likes", "dislikes"
        ];
        
        for (const field of fields) {
            if (about[field]) {
                systemPrompt += `${field.charAt(0).toUpperCase() + field.slice(1)}: ${about[field]}\n`;
            }
        }
        
        if (about.age) {
            systemPrompt += `\nNote: You are the same age as the user (${about.age}).\n`;
        }
    }
    
    return systemPrompt;
}

export function conversationToMsg(
    systemPrompt: string,
    conversation: ConversationMessage[]
): ChatMessage[] {
    const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt }
    ];
    
    for (const msg of conversation) {
        if (msg.role === "user" || msg.role === "assistant") {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        }
    }
    
    return messages;
}

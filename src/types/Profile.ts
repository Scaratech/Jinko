export interface ProfileData {
    name: string;
    promptId: string;
    model: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
}

export interface ConversationData {
    messages: ConversationMessage[];
}

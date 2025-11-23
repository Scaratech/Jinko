export interface Config {
    discord: {
        token: string;
        id: string;
    };
    ai: {
        key: string;
        model: string;
    };
    db: string;
    prompts: string;
}

export interface Command {
    data: {
        name: string;
        description: string;
        toJSON(): any;
    };
    execute: (interaction: any) => Promise<void>;
};

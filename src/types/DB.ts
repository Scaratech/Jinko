export interface DBOptions {
    rootDir: string;
    jsonIndent?: number;
    autoSave?: boolean;
}

export type Primitive = string | number | boolean | null;
export type JSONValue = Primitive | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export interface JSONArray extends Array<JSONValue> {}

export interface IDB {
    init(): Promise<void>;
    get<T = JSONValue>(key: string): T | undefined;
    set<T = JSONValue>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    has(key: string): boolean;
    all(): Record<string, JSONValue>;
    save(): Promise<void>;
}

export interface DBFileIndex {
    filePath: string;
    data: Record<string, JSONValue>;
}

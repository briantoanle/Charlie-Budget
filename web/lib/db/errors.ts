export class DbError extends Error {
    constructor(message: string, public cause?: unknown) {
        super(message);
        this.name = "DbError";
    }
}

export function assertOk<T>(data: T | null, error: unknown, context: string): T {
    if (error) throw new DbError(context, error);
    if (!data) throw new DbError(`${context}: no data returned`);
    return data;
}
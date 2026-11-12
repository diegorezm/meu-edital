import { type AnyD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export * from "./schema";
export { schema };

/** Cliente Drizzle sobre o binding D1 do Worker. */
export const createDb = (d1: AnyD1Database) => drizzle(d1, { schema });
export type Db = ReturnType<typeof createDb>;

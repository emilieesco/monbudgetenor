import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("DATABASE_URL not set, using in-memory storage");
}

export const client = DATABASE_URL
  ? postgres(DATABASE_URL, { 
      ssl: "require",
      max: 1,
    })
  : null;

export const db = DATABASE_URL ? drizzle(client!, { schema }) : null;

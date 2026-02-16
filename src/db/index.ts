import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from "dotenv";
dotenv.config();
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL || "postgres://placeholder:5432/db");
export const db = drizzle(client, { schema });

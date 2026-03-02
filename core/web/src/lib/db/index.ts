import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import Database from "better-sqlite3";
import postgres from "postgres";
import * as sqliteSchema from "./schema";
import * as pgSchema from "./schema-pg";

export type DbDriver = "sqlite" | "postgresql";

function getDriver(): DbDriver {
  const driver = process.env.DB_DRIVER ?? "sqlite";
  if (driver !== "sqlite" && driver !== "postgresql") {
    throw new Error(
      `Invalid DB_DRIVER: "${driver}". Must be "sqlite" or "postgresql".`
    );
  }
  return driver;
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
        "Set it in .env (e.g. DATABASE_URL=file:./dev.db for SQLite)."
    );
  }
  return url;
}

/**
 * Check whether the database is configured (DATABASE_URL is set).
 * Used to guard against build-time evaluation when modules are imported
 * but the DB is not yet available.
 */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

function createSqliteDb() {
  const url = getDatabaseUrl();
  const path = url.replace(/^file:/, "");
  const client = new Database(path);
  client.pragma("journal_mode = WAL");
  client.pragma("busy_timeout = 5000");
  return drizzleSqlite(client, { schema: sqliteSchema });
}

function createPostgresDb() {
  const url = getDatabaseUrl();
  const client = postgres(url);
  return drizzlePostgres(client, { schema: pgSchema });
}

export type SqliteDatabase = ReturnType<typeof createSqliteDb>;
export type PostgresDatabase = ReturnType<typeof createPostgresDb>;
export type AppDatabase = SqliteDatabase | PostgresDatabase;

let _db: AppDatabase | null = null;
let _driver: DbDriver | null = null;

export function getDb(): AppDatabase {
  if (!_db) {
    _driver = getDriver();
    _db = _driver === "sqlite" ? createSqliteDb() : createPostgresDb();
  }
  return _db;
}

export function getDbDriver(): DbDriver {
  if (!_driver) {
    _driver = getDriver();
  }
  return _driver;
}

// Re-export the SQLite schema as canonical table references for API routes.
// When using the SQL-like query builder (db.select().from(table)),
// table references from either dialect work correctly.
export { sqliteSchema as schema, pgSchema };

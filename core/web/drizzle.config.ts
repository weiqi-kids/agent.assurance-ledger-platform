import { defineConfig } from "drizzle-kit";

const driver = process.env.DB_DRIVER ?? "sqlite";

export default defineConfig(
  driver === "postgresql"
    ? {
        schema: "./src/lib/db/schema-pg.ts",
        out: "./drizzle/pg",
        dialect: "postgresql",
        dbCredentials: {
          url: process.env.DATABASE_URL!,
        },
      }
    : {
        schema: "./src/lib/db/schema.ts",
        out: "./drizzle/sqlite",
        dialect: "sqlite",
        dbCredentials: {
          url: process.env.DATABASE_URL ?? "file:./dev.db",
        },
      }
);

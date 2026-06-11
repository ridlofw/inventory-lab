// prisma.config.ts
import path from "node:path";
import { defineConfig } from "prisma/config";

// Load .env.local for Supabase connection
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Use DIRECT_URL (session-mode pooler, port 5432) for migrations/push
    // The pooler URL (port 6543) doesn't support DDL operations
    url: process.env["DIRECT_URL"],
  },
});

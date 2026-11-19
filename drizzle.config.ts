import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js membaca .env.local; drizzle-kit dan skrip perlu diberi tahu.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});

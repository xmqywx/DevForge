import { defineConfig } from "drizzle-kit";
import { homedir } from "os";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_PATH?.replace("~", homedir())
      ?? `${homedir()}/.devforge/devforge.db`,
  },
});

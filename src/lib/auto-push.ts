// Auto-push local changes to server after Dashboard write operations
// Runs in background, non-blocking

import { execSync } from "child_process";
import { resolve } from "path";

let pushing = false;

export function autoPush() {
  if (pushing) return;
  pushing = true;

  // Run in next tick to not block the API response
  setTimeout(() => {
    try {
      const dir = resolve(process.cwd());
      execSync(`cd ${dir} && node_modules/.bin/tsx scripts/sync.ts push`, {
        timeout: 15000,
        stdio: "ignore",
      });
    } catch {
      // silent — push failure shouldn't break the app
    } finally {
      pushing = false;
    }
  }, 100);
}

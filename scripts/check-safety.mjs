import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const blockedNames = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".env.test",
]);

const blockedPatterns = [
  /GEMINI_API_KEY\s*=\s*AIza[0-9A-Za-z_-]{20,}/i,
  /sb_secret_[0-9A-Za-z_-]{12,}/,
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
];

const allowedFiles = new Set([
  ".env.example",
]);

const tracked = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const issues = [];

for (const file of tracked) {
  const name = file.split("/").pop() ?? file;
  if (blockedNames.has(name)) {
    issues.push(`Tracked env file is forbidden: ${file}`);
    continue;
  }

  if (allowedFiles.has(name)) {
    continue;
  }

  const fullPath = join(root, file);
  if (!existsSync(fullPath)) {
    continue;
  }

  let content = "";
  try {
    content = readFileSync(fullPath, "utf8");
  } catch {
    continue;
  }

  for (const pattern of blockedPatterns) {
    if (pattern.test(content)) {
      issues.push(`Potential secret pattern matched in ${file}: ${pattern}`);
      break;
    }
  }
}

if (issues.length > 0) {
  console.error("Safety check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Safety check passed.");

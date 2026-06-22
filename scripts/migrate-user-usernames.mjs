import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = join(__dirname, "..", file);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      const inlineComment = value.indexOf(" #");
      if (inlineComment !== -1) {
        value = value.slice(0, inlineComment).trim();
      }
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function readUsersJson() {
  const path = join(DATA_DIR, "users.json");
  const raw = readFileSync(path, "utf8");
  const withoutComments = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  return JSON.parse(withoutComments);
}

function migrationEmail(user) {
  return user.email || `${user.username || user.id}@badartyres.local`;
}

async function schemaHasUsernameColumn(url, key) {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const schema = await response.json();
  return "username" in (schema.definitions?.users?.properties ?? {});
}

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const hasUsername = await schemaHasUsernameColumn(url, key);
  if (!hasUsername) {
    console.error(
      "The users table is missing the username column.\n" +
        "Run this SQL in the Supabase SQL Editor first:\n" +
        "  supabase/migrations/add_user_auth_columns.sql\n",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const legacyUsers = readUsersJson();
  console.log("Backfilling usernames on public.users...\n");

  let updated = 0;
  let skipped = 0;

  for (const legacyUser of legacyUsers) {
    const email = migrationEmail(legacyUser);
    const username = legacyUser.username?.trim().toLowerCase();
    const phone = legacyUser.phone ?? null;

    if (!username) {
      console.log(`[skip] ${legacyUser.name}: no username in JSON`);
      skipped += 1;
      continue;
    }

    const { data: matches, error: lookupError } = await supabase
      .from("users")
      .select("id, email, username")
      .eq("email", email);

    if (lookupError) {
      console.error(`[error] ${legacyUser.name}: ${lookupError.message}`);
      throw lookupError;
    }

    const row = matches?.[0];
    if (!row) {
      console.log(`[skip] ${legacyUser.name}: no Supabase profile for ${email}`);
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ username, phone })
      .eq("id", row.id);

    if (updateError) {
      console.error(`[error] ${legacyUser.name}: ${updateError.message}`);
      throw updateError;
    }

    console.log(`[ok] ${legacyUser.name} → username "${username}"`);
    updated += 1;
  }

  console.log(`\nDone. Updated ${updated} user(s), skipped ${skipped}.`);
}

main().catch((error) => {
  console.error("\nUsername backfill failed:", error.message ?? error);
  process.exit(1);
});

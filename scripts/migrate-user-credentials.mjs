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

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const legacyUsers = readUsersJson();
  const { data: existingAuth, error: listError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (listError) {
    console.error("Failed to list auth users:", listError.message);
    process.exit(1);
  }

  const authEmails = new Set(
    (existingAuth?.users ?? []).map((user) => user.email?.toLowerCase()),
  );

  console.log("Migrating login users to Supabase Auth...\n");

  let created = 0;
  let skipped = 0;

  for (const legacyUser of legacyUsers) {
    const email = migrationEmail(legacyUser);
    const username = legacyUser.username?.trim();
    const password = legacyUser.password;

    if (!username || !password) {
      console.log(`[skip] ${legacyUser.name}: missing username or password`);
      skipped += 1;
      continue;
    }

    if (authEmails.has(email.toLowerCase())) {
      console.log(`[skip] ${legacyUser.name}: auth user already exists (${email})`);
      skipped += 1;
      continue;
    }

    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        name: legacyUser.name,
        role: legacyUser.role,
        phone: legacyUser.phone ?? "",
      },
    });

    if (error) {
      console.error(`[error] ${legacyUser.name}: ${error.message}`);
      throw error;
    }

    console.log(`[ok] ${legacyUser.name} (@${username} → ${email})`);
    created += 1;
  }

  console.log(`\nDone. Created ${created} auth user(s), skipped ${skipped}.`);
}

main().catch((error) => {
  console.error("\nAuth migration failed:", error.message ?? error);
  process.exit(1);
});

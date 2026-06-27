export const dynamic = 'force-dynamic';

import { getSettings, getUsers } from "@/lib/repositories";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const [settings, users] = await Promise.all([getSettings(), getUsers()]);

  return <SettingsClient initialSettings={settings} initialUsers={users} />;
}

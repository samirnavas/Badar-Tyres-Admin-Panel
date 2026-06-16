export const dynamic = 'force-dynamic';

import { getSettings, getUsers, getManufacturers } from "@/lib/repositories";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const [settings, users, manufacturers] = await Promise.all([
    getSettings(),
    getUsers(),
    getManufacturers()
  ]);

  return <SettingsClient initialSettings={settings} initialUsers={users} initialManufacturers={manufacturers} />;
}

import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Safely reads JSON from a file, creating it with an empty structure if it doesn't exist.
 */
export async function readData<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // If the file doesn't exist, we assume it's an array for all files except settings
      const isSettings = filename === "settings.json";
      const defaultData = isSettings ? {} : [];
      await writeData(filename, defaultData);
      return defaultData as T;
    }
    throw error;
  }
}

/**
 * Writes data to a JSON file.
 */
export async function writeData(filename: string, data: any): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

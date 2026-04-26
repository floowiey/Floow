
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database.json');

export async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      users: [],
      tasks: [],
      notes: [],
      diaryEntries: [],
      settings: {}
    };
  }
}

export async function writeDb(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

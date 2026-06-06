import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "data", "ip-logs.json");

interface IpLogEntry {
  username: string;
  ip: string;
  timestamp: string;
  action: string;
}

async function ensureDir() {
  await mkdir(path.dirname(LOG_FILE), { recursive: true });
}

export async function logIp(username: string, ip: string, action: string) {
  await ensureDir();

  let logs: IpLogEntry[] = [];
  try {
    const data = await readFile(LOG_FILE, "utf-8");
    logs = JSON.parse(data);
  } catch {
    logs = [];
  }

  logs.push({
    username,
    ip: ip.replace("::ffff:", ""),
    timestamp: new Date().toISOString(),
    action,
  });

  await writeFile(LOG_FILE, JSON.stringify(logs, null, 2));
}

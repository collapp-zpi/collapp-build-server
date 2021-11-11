import axios from "axios";
import fs from "fs-extra";

export function safeFileRemove(path: string): Boolean {
  if (fs.existsSync(path)) {
    fs.rmSync(path);
  } else return false;
}

export function safeDirectoryRemove(path: string): Boolean {
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, { recursive: true });
  } else return false;
}

export function safeDirectoryCreate(path: string): Boolean {
  if (fs.existsSync(path)) return false;
  else {
    fs.mkdirSync(path);
    return true;
  }
}

export function safeMove(path1: string, path2: string): Boolean {
  if (fs.existsSync(path1)) {
    fs.moveSync(path1, path2);
    return true;
  } else return false;
}

export async function downloadToFile(
  url: string,
  path: string
): Promise<Boolean> {
  const file = fs.createWriteStream(path);
  const zipResponse = await axios.get(url, {
    responseType: "stream",
  });
  if (zipResponse.data.length < 0) return Promise.resolve(false);
  else {
    zipResponse.data.pipe(file);
    return new Promise<Boolean>((resolve, reject) => {
      file.on("finish", () => resolve(true));
      file.on("error", () => resolve(false));
    });
  }
}

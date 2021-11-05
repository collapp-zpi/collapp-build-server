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

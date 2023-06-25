import {
  safeDirectoryRemove,
  safeFileRemove,
  safeMove,
} from "../utils/fileUtils";
import path from "path";
import ora from "ora";

const tempPath = path.resolve(__dirname, "temp");
const plugin = path.resolve(__dirname, "..", "build", "plugin");

export function cleanup() {
  const cleanSpinner = ora("Clean up");
  safeFileRemove(path.resolve(tempPath, "plugin.zip"));
  safeFileRemove(path.resolve(tempPath, "tailwind.config.js"));
  safeFileRemove(path.resolve(tempPath, "hash.json"));
  safeFileRemove(path.resolve(tempPath, "collapp-config.json"));
  safeFileRemove(path.resolve(tempPath, "server.js"));
  safeMove(tempPath, plugin);
  cleanSpinner.succeed();
}

export function cleanupAfter() {
  const cleanSpinner = ora("Clean up");
  safeDirectoryRemove(path.resolve(__dirname, "../", "build", "plugin"));
  safeDirectoryRemove(path.resolve(__dirname, "../", "build", "node_modules"));
  safeDirectoryRemove(tempPath);
  safeDirectoryRemove(path.resolve(__dirname, "../", "../", "dist"));
  safeFileRemove(path.resolve(__dirname, "../", "build", "package.json"));
  safeFileRemove(path.resolve(__dirname, "../", "build", "package-lock.json"));
  cleanSpinner.succeed();
}

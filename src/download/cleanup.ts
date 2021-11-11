import {
  safeDirectoryRemove,
  safeFileRemove,
  safeMove,
} from "../utils/fileUtils";
import path from "path";
import ora from "ora";

const tempPath = path.join(__dirname, "temp");
const plugin = path.join(__dirname, "..", "build", "plugin");

export function cleanup() {
  const cleanSpinner = ora("Clean up");
  safeFileRemove(path.join(tempPath, "plugin.zip"));
  safeFileRemove(path.join(tempPath, "tailwind.config.js"));
  safeFileRemove(path.join(tempPath, "hash.json"));
  safeFileRemove(path.join(tempPath, "collapp-config.json"));
  safeFileRemove(path.join(tempPath, "server.js"));
  safeMove(tempPath, plugin);
  cleanSpinner.succeed();
}

export function cleanupAfter() {
  const cleanSpinner = ora("Clean up");
  safeDirectoryRemove(path.join(__dirname, "../", "build", "plugin"));
  safeDirectoryRemove(tempPath);
  safeDirectoryRemove(path.join(__dirname, "../", "../", "dist"));
  cleanSpinner.succeed();
}

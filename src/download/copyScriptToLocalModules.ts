import { PluginRequest } from "../types/Plugin";
import path from "path";
import fs from "fs";
import { safeDirectoryCreate } from "../utils/fileUtils";
import ora from "ora";

export default function copyToModules(plugin: PluginRequest) {
  const copySpinner = ora("Copy script to local modules").start();

  safeDirectoryCreate(
    path.join(__dirname, "../", "modules", "scripts", plugin.name)
  );

  fs.copyFileSync(
    path.join(__dirname, "../", "build", "plugin", "logic", "server.js"),
    path.join(__dirname, "../", "modules", "scripts", plugin.name, "server.js")
  );

  copySpinner.succeed();
}

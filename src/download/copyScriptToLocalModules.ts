import { PluginRequest } from "../types/Plugin";
import path from "path";
import fs from "fs";
import { safeDirectoryCreate, safeDirectoryRemove } from "../utils/fileUtils";
import ora from "ora";

export default function copyToModules(plugin: PluginRequest) {
  try {
    const copySpinner = ora("Copy script to local modules").start();

    safeDirectoryRemove(
      path.join(__dirname, "../", "modules", "scripts", plugin.requestId)
    );
    safeDirectoryCreate(
      path.join(__dirname, "../", "modules", "scripts", plugin.requestId)
    );

    fs.copyFileSync(
      path.join(__dirname, "../", "build", "plugin", "logic", "server.js"),
      path.join(
        __dirname,
        "../",
        "modules",
        "scripts",
        plugin.requestId,
        "server.js"
      )
    );

    copySpinner.succeed();
  } catch (e) {
    console.log(e);
  }
}

import fs from "fs-extra";
import path from "path";
import { PluginRequest } from "../build/build";
import { hashElement } from "folder-hash";
import {
  safeDirectoryCreate,
  safeDirectoryRemove,
  safeFileRemove,
  safeMove,
} from "../utils/fileUtils";
import { ResponseSingleton } from "../utils/response";
const extract = require("extract-zip");
const https = require("https");
const ora = require("ora");

export async function downloadAndUnzip(request: PluginRequest, onFinish) {
  const response = ResponseSingleton.getInstance();
  const tempPath = path.join(__dirname, "temp");
  const plugin = path.join(__dirname, "..", "build", "plugin");

  safeDirectoryRemove(tempPath);
  safeDirectoryCreate(tempPath);
  safeDirectoryRemove(plugin);

  const dowloadSpinner = ora("Download zipped code").start();
  const file = fs.createWriteStream(tempPath + "/plugin.zip");
  https
    .get(request.zip.url, (response) => {
      response.pipe(file);
      file.on("finish", async () => {
        dowloadSpinner.succeed("Zipped code downloaded");
        const hashSpinner = ora("Validate hash").start();
        await extract(tempPath + "/plugin.zip", { dir: tempPath });
        const options = {
          folders: { exclude: ["node_modules", "test_coverage"] },
          files: {
            exclude: ["hash.json", "plugin.zip"],
          },
          encoding: "hex",
        };

        const hash = await hashElement(
          path.resolve(__dirname, "temp"),
          options
        );

        const hashRead = fs.readFileSync(path.resolve(tempPath, "hash.json"));
        const hashObject = JSON.parse(hashRead);

        if (hash.hash == hashObject.hash) {
          hashSpinner.succeed("Hash matched");
          const cleanSpinner = ora("Clean up");
          safeFileRemove(path.resolve(tempPath, "plugin.zip"));
          safeFileRemove(path.join(tempPath, "package.json"));
          safeFileRemove(path.join(tempPath, "tailwind.config.js"));
          safeFileRemove(path.join(tempPath, "hash.json"));
          safeFileRemove(path.join(tempPath, "collapp-config.json"));
          safeFileRemove(path.join(tempPath, "server.js"));
          file.close();
          safeMove(tempPath, plugin);
          cleanSpinner.succeed("Cleaned up");
          return onFinish(true, null);
        }
        hashSpinner.fail("Hash did not match");
        fs.unlink(tempPath, () => {});
        safeDirectoryRemove(tempPath);
        file.close();
        response.buildSuccess(false);
        response.addBuildError("Hash do not match");
        return onFinish(false, "Hash do not match");
      });
    })
    .on("error", (err) => {
      fs.unlink(tempPath, () => {});
      safeDirectoryRemove(tempPath);
      response.buildSuccess(false);
      response.addBuildError("Source code could not be downloaded");
      dowloadSpinner.fail("Could not download zipped code");
      onFinish(false, "Source code could not be downloaded");
    });
}

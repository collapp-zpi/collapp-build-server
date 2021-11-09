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
import * as Sentry from "@sentry/node";
import { installPackages } from "../build/installLocalPackages";

const extract = require("extract-zip");
const https = require("https");
const ora = require("ora");

const response = ResponseSingleton.getInstance();
const tempPath = path.join(__dirname, "temp");
const plugin = path.join(__dirname, "..", "build", "plugin");

export async function downloadAndUnzip(request: PluginRequest, onFinish) {
  safeDirectoryRemove(tempPath);
  safeDirectoryCreate(tempPath);
  safeDirectoryRemove(plugin);

  const dowloadSpinner = ora("Download zipped code").start();

  const file = fs.createWriteStream(tempPath + "/plugin.zip");
  try {
    https
      .get(request.zip.url, (response) => {
        if (!response) {
          dowloadSpinner.fail("Download zipped code");
          throw new Error("Provided file resolved in empty content");
        }
        try {
          response.pipe(file);
          file.on("finish", async () => {
            dowloadSpinner.succeed("Download zipped code");
            const hashSpinner = ora("Validate hash").start();
            try {
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

              const hashRead = fs.readFileSync(
                path.resolve(tempPath, "hash.json")
              );
              const hashObject = JSON.parse(hashRead);

              if (hash.hash == hashObject.hash) {
                hashSpinner.succeed("Validate hash");

                // Install packages
                installPackages(path.join(tempPath, "package.json"))
                  .then(() => {
                    const cleanSpinner = ora("Clean up");
                    safeFileRemove(path.resolve(tempPath, "plugin.zip"));
                    safeFileRemove(path.join(tempPath, "package.json"));
                    safeFileRemove(path.join(tempPath, "tailwind.config.js"));
                    safeFileRemove(path.join(tempPath, "hash.json"));
                    safeFileRemove(path.join(tempPath, "collapp-config.json"));
                    safeFileRemove(path.join(tempPath, "server.js"));
                    file.close();
                    safeMove(tempPath, plugin);
                    cleanSpinner.succeed("Clean up");
                    return onFinish(true, null);
                  })
                  .catch((e) => {
                    console.log(e);
                    Sentry.captureException(e);
                    return onFinish(false, e);
                  });
              }
              hashSpinner.fail("Validate hash");
              fs.unlink(tempPath, () => {});
              safeDirectoryRemove(tempPath);
              file.close();
              response.buildSuccess(false);
              response.addBuildError("Hash do not match");
              return onFinish(false, "Hash do not match");
            } catch (e) {
              Sentry.captureException(e);
              hashSpinner.fail("Validate hash");
              onFinish(false, "Validate hash");
            }
          });
        } catch (e) {
          Sentry.captureException(e);
          dowloadSpinner.fail("Download zipped code");
          onFinish(false, "No such file");
        }
      })
      .on("error", (err) => {
        fs.unlink(tempPath, () => {});
        safeDirectoryRemove(tempPath);
        response.buildSuccess(false);
        response.addBuildError("Source code could not be downloaded");
        dowloadSpinner.fail("Could not download zipped code");
        Sentry.captureMessage(err);
        onFinish(false, "Source code could not be downloaded");
      });
  } catch (e) {
    Sentry.captureException(e);
    dowloadSpinner.fail("Download zipped code");
    onFinish(false, "Could not download zip code");
  }
}

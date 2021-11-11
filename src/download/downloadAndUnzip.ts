import fs from "fs-extra";
import path from "path";
import { PluginRequest } from "../types/Plugin";
import { hashElement } from "folder-hash";
import { DownloadResponse } from "../types/Responses";
import {
  safeDirectoryCreate,
  safeDirectoryRemove,
  downloadToFile,
} from "../utils/fileUtils";
import * as Sentry from "@sentry/node";
import extract from "extract-zip";
import ora from "ora";

const tempPath = path.join(__dirname, "temp");
const plugin = path.join(__dirname, "..", "build", "plugin");

export default async function downloadAndUnzip(
  request: PluginRequest
): Promise<DownloadResponse> {
  let response: DownloadResponse = {
    success: false,
    errors: [],
  };

  safeDirectoryRemove(tempPath);
  safeDirectoryCreate(tempPath);
  safeDirectoryRemove(plugin);

  const downloadSpinner = ora("Download zipped code").start();

  const downloadResponse = await downloadToFile(
    request.zip.url,
    path.join(tempPath, "plugin.zip")
  );
  if (downloadResponse) {
    downloadSpinner.succeed();
    const isValid = await validateHash();
    if (isValid) {
      response = {
        success: true,
        errors: [],
      };
    } else {
      response = {
        success: false,
        errors: [...response.errors, "Hash did not match"],
      };
    }
    return Promise.resolve(response);
  } else {
    downloadSpinner.fail();
    fs.unlink(tempPath, () => {});
    safeDirectoryRemove(tempPath);
    Sentry.captureMessage(
      JSON.stringify({
        err: "Could not download such a file, try again",
        request: request,
      })
    );
    response = {
      success: false,
      errors: [...response.errors, "File could not be downloaded"],
    };
    return Promise.resolve(response);
  }
}

async function validateHash(): Promise<Boolean> {
  const hashSpinner = ora("Validate hash").start();
  const options = {
    folders: { exclude: ["node_modules", "test_coverage"] },
    files: {
      exclude: ["hash.json", "plugin.zip"],
    },
    encoding: "hex",
  };
  try {
    await extract(tempPath + "/plugin.zip", { dir: tempPath });

    const hash = await hashElement(path.resolve(__dirname, "temp"), options);
    const hashRead = fs.readFileSync(path.resolve(tempPath, "hash.json"));
    const hashObject = JSON.parse(hashRead);

    if (hash.hash == hashObject.hash) {
      hashSpinner.succeed();
      return Promise.resolve(true);
    }
    hashSpinner.fail();
    fs.unlink(tempPath, () => {});
    safeDirectoryRemove(tempPath);
    return Promise.resolve(false);
  } catch (e) {
    hashSpinner.fail();
    Sentry.captureException(e);
    return Promise.resolve(false);
  }
}

import { runBuild } from "../../webpack";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import downloadAndUnzip from "../download/downloadAndUnzip";
import * as Sentry from "@sentry/node";
import { PluginRequest } from "../types/Plugin";
import { BuildResponse } from "../types/Responses";
import { cleanup, cleanupAfter } from "../download/cleanup";
import copyToModules from "../download/copyScriptToLocalModules";
import uploadPlugin from "../download/uploadPlugin";
import installPackages from "../download/installLocalPackages";

const pluginPath = path.join(__dirname, "plugin");

export async function processPlugin(
  request: PluginRequest
): Promise<BuildResponse> {
  let response: BuildResponse = {
    success: false,
    build: {
      success: false,
      time: 0,
      errors: [],
    },
    upload: {
      success: true,
      files: [],
    },
  };

  console.log(chalk.blue.bold("\nBuild started"));

  const downloadResponse = await downloadAndUnzip(request);

  if (!downloadResponse.success) {
    response = { ...response, success: false };
    cleanupAfter();
    return Promise.resolve(response);
  }

  cleanup();
  if (!fs.existsSync(pluginPath)) {
    response = { ...response, success: false };
    Sentry.captureMessage("Even after download, there is not plugins folder");
    cleanupAfter();
    return Promise.resolve(response);
  }

  const installResult = await installPackages(
    path.join(__dirname, "../build", "plugin", "package.json")
  );
  if (!installResult) {
    console.log("Not installed");
    response = { ...response, success: false };
    Sentry.captureMessage("Could not install packages");
    cleanupAfter();
    return Promise.resolve(response);
  }

  const buildRes = await runBuild(request);
  if (!buildRes.success) {
    response = {
      ...response,
      success: false,
      build: {
        success: false,
        errors: buildRes.stats.errors,
        time: buildRes.stats.time,
      },
    };
    cleanupAfter();
    return Promise.resolve(response);
  }
  response = {
    ...response,
    build: {
      success: true,
      time: buildRes.stats.time,
      errors: buildRes.stats.errors,
    },
  };

  copyToModules(request);
  const uploadResult = await uploadPlugin(request);
  if (!uploadResult.success) {
    response = { ...response, success: false, upload: uploadResult };
    Sentry.captureMessage("Could not upload files to AWS");
    cleanupAfter();
    return Promise.resolve(response);
  }
  cleanupAfter();

  response = {
    ...response,
    success: true,
  };
  return Promise.resolve(response);
}

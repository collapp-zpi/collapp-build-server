import { ResponseSingleton } from "./../utils/response";
import { Response } from "../utils/response";
import { runBuild } from "../../webpack";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import AWS from "aws-sdk";
import { downloadAndUnzip } from "../modules/saveModule";
import { safeDirectoryCreate, safeDirectoryRemove } from "../utils/fileUtils";
import * as Sentry from "@sentry/node";

const ora = require("ora");

const client = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

export interface PluginRequest {
  requestId: string;
  name: string;
  developer: {
    name: string;
    email: string;
  };
  zip: {
    url: string;
  };
}

export async function processPlugin(
  request: PluginRequest,
  cb: (res: Response) => void
) {
  const response = ResponseSingleton.getInstance();
  response.reset();

  console.log(chalk.blue("\nBuild started"));
  console.log(`${chalk.gray.italic(new Date())}\n`);
  downloadAndUnzip(request, async (res, e) => {
    if (e != null) {
      response.success(false);
      response.addBuildError(e);
      Sentry.captureMessage(
        `A download of ${request.zip.url} could not be performed`
      );
      return cb(response.response());
    }
    if (!pluginExists()) {
      console.log(chalk.red("No plugin was found, what is happening"));
      response.success(false);
      response.addBuildError("Plugin was not provided");
      Sentry.captureMessage(`Plugin was not provided`);
      return cb(response.response());
    }
    if (res) {
      runBuild(request, (succ, stats) => {
        response.buildSuccess(succ);
        response.setBuildTime(stats.time);
        stats.errors.forEach((e) => {
          response.addBuildError(JSON.stringify(e));
        });
        if (succ) {
          copyToModules(request);
          uploadPlugin(request);
          safeDirectoryRemove(path.join(__dirname, "../../", "dist"));
          response.success(true);
          console.log(chalk.green.bold("\nBuild done\n\n"));
          return cb(response.response());
        } else {
          console.log(chalk.red("Some errors during the build"));
          Sentry.captureMessage(`Build unsuccessful`);
          return cb(response.response());
        }
      });
    } else {
      console.log(chalk.red("Something wrong with the unzip"));
      Sentry.captureMessage(`Could not unzip a file`);
      return cb(response.response());
    }
  });
}

const pluginExists = () => {
  return fs.existsSync(path.join(__dirname, "plugin"));
};

const copyToModules = (plugin: PluginRequest) => {
  const copySpinner = ora("Copy script to module").start();
  safeDirectoryCreate(
    path.resolve(__dirname, "../", "modules", "scripts", plugin.name)
  );

  fs.copyFileSync(
    path.resolve(__dirname, "plugin", "logic", "server.js"),
    path.resolve(
      __dirname,
      "../",
      "modules",
      "scripts",
      plugin.name,
      "server.js"
    )
  );

  safeDirectoryRemove(path.join(__dirname, "plugin"));
  copySpinner.succeed("Finished to copy script module");
};

const uploadPlugin = async (plugin: PluginRequest) => {
  const response = ResponseSingleton.getInstance();
  const uploadSpinner = ora("Upload files to server").start();
  const distPath = path.resolve(__dirname, "../../", "dist");
  const files = fs.readdirSync(distPath);
  files.forEach((f) => response.addUploadFile(f));
  files.forEach(async (f) => {
    const params = {
      Body: fs.readFileSync(path.resolve(__dirname, "../../", "dist", f)),
      Bucket: process.env.AWS_BUCKET,
      Key: `plugins/${plugin.name}/${f}`,
    };
    await client
      .upload(params, (err, data) => {
        if (err) {
          response.uploadSuccess(false);
          uploadSpinner.fail("Failed to upload files");
          Sentry.captureMessage(`Coud not upload a file to AWS`);
        }
      })
      .promise();
  });
  response.uploadSuccess(true);
  uploadSpinner.succeed("Done uploading files to a server");
};

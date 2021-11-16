import chalk from "chalk";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import https from "https";
import Listr from "listr";
import { safeDirectoryCreate, safeDirectoryRemove } from "../utils/fileUtils";
import * as Sentry from "@sentry/node";
import ora from "ora";

const root = "scripts/";
const rootS3 = "https://cloudfront.collapp.live/plugins/";

const client = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY_COLLAPP,
});

// -----------------------------------------------------------------------------------------------------

const setDifference = (A: string[], B: string[]): string[] => {
  return A.filter((x) => !B.includes(x));
};

function isEmpty(p: string) {
  return fs.readdirSync(p).length === 0;
}

// -----------------------------------------------------------------------------------------------------

const downloadFileToLocalDirectory = async (plugin: string) => {
  const p = path.join(__dirname, root, plugin);

  // If local version exists, delete it
  safeDirectoryRemove(p);

  // Create new local version of plugin
  safeDirectoryCreate(p);

  const file = fs.createWriteStream(p + "/server.js");
  try {
    https
      .get(rootS3 + plugin + "/server.js", (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
        });
      })
      .on("error", (err) => {
        fs.unlink(p, () => {});
        safeDirectoryRemove(p);
        console.log(chalk.red(err));
      });
  } catch (e) {
    Sentry.captureException(e);
  }
};

const deleteUnwanted = async (plugin: string) => {
  safeDirectoryRemove(path.resolve(__dirname, root, plugin));
};

export async function syncPlugins() {
  const spinner = ora("Loading remote modules\n").start();

  safeDirectoryCreate(path.resolve(__dirname, root));

  const params = {
    Bucket: process.env.AWS_BUCKET,
    Prefix: "plugins",
  };

  try {
    const { Contents } = await client.listObjectsV2(params).promise();
    const remotePlugins = [
      ...new Set(
        Contents.map((element) => element.Key.split("/")[1]).filter(
          (f) => f.length > 0
        )
      ),
    ];

    let localPlugins = fs.readdirSync(path.resolve(__dirname, "./scripts/"));

    const toDelete = setDifference(localPlugins, remotePlugins);

    if (toDelete.length > 0) {
      const tasksDelete = new Listr(
        toDelete.map((d) => ({
          title: chalk.red.bold("Removed") + ` local version of '${d}' plugin`,
          task: () => deleteUnwanted(d),
        }))
      );
      await tasksDelete.run();
    }

    localPlugins = localPlugins.filter((local) => !toDelete.includes(local));

    const emptyPlugins = localPlugins.filter((f) =>
      isEmpty(path.resolve(__dirname, "./scripts/", f))
    );

    const toDownload = [
      ...setDifference(remotePlugins, localPlugins),
      ...emptyPlugins,
    ];

    if (toDownload.length == 0 && toDelete.length == 0) {
      spinner.succeed("All is already up to date");
    } else {
      const tasksDownload = new Listr(
        toDownload.map((d) => ({
          title: chalk.green.bold("Download ->") + ` '${d}' plugin`,
          task: () => downloadFileToLocalDirectory(d),
        }))
      );
      await tasksDownload.run();
      spinner.succeed("Now it's all up to date");
    }
  } catch (e) {
    Sentry.captureException(e);
  }
}

import chalk from "chalk";
import fs from "fs";
import path from "path";
import https from "https";
import Listr from "listr";
import { safeDirectoryCreate, safeDirectoryRemove } from "../utils/fileUtils";
import * as Sentry from "@sentry/node";
import ora from "ora";
import { getRemotePlugins } from "../modules/pluginData";

const root = "scripts";

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

  const file = fs.createWriteStream(path.join(p, "server.js"));
  try {
    https
      .get(`${process.env.NEXT_PUBLIC_STORAGE_ROOT}/${plugin}/server.js`, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
        });
      })
      .on("error", (err) => {
        fs.unlink(p, () => {
        });
        safeDirectoryRemove(p);
        console.log(chalk.red(err));
      });
  } catch (e) {
    Sentry.captureException(e);
  }
};

const deleteUnwanted = async (plugin: string) => {
  safeDirectoryRemove(path.join(__dirname, root, plugin));
};

export async function syncPlugins() {
  const spinner = ora("Loading remote modules\n").start();
  safeDirectoryCreate(path.join(__dirname, root));

  try {
    const remotePlugins = await getRemotePlugins()

    let localPlugins = fs.readdirSync(path.join(__dirname, "scripts"));

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
      isEmpty(path.join(__dirname, "scripts", f))
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
    spinner.fail("Loading remote modules failed")
  }
}

import fs from "fs-extra";
import chalk from "chalk";
import path from "path";
import { excluded } from "./excludedDependencies";
import * as Sentry from "@sentry/node";
import npm from "npm-programmatic";
import ora from "ora";
import { safeDirectoryCreate, safeDirectoryRemove } from "../utils/fileUtils";

async function install(name: string, version): Promise<Boolean> {
  const p = `${name}${version}`.replace("^", "@");
  return new Promise<Boolean>((resolve, reject) => {
    npm
      .install(p, {
        cwd: path.join(__dirname, "../", "build", "node_modules"),
        save: true,
      })
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        reject(false);
      });
  });
}

export default async function installPackages(
  packageJsonPath: string
): Promise<Boolean> {
  const spinner = ora(
    "Download packages from " + chalk.green("package.json")
  ).start();

  safeDirectoryRemove(path.join(__dirname, "../", "build", "node_modules"));
  safeDirectoryCreate(path.join(__dirname, "../", "build", "node_modules"));

  try {
    const file = fs.readFileSync(packageJsonPath);
    const contents = JSON.parse(file);
    const dep = Object.entries(contents.dependencies).map((d) => ({
      name: d[0],
      version: d[1],
      path: `${d[0]}${d[1]}`.replace("^", "@"),
    }));
    const depDev = Object.entries(contents.devDependencies).map((d) => ({
      name: d[0],
      version: d[1],
      path: `${d[0]}${d[1]}`.replace("^", "@"),
    }));
    const packages = [...new Set([...dep, ...depDev])].filter(
      (f) => !excluded.includes(f.name)
    );
    return new Promise<Boolean>((resolve, reject) => {
      Promise.all(packages.map((p) => install(p.name, p.version)))
        .then(() => {
          spinner.succeed();
          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          spinner.fail();
          resolve(false);
        });
    });
  } catch (e) {
    spinner.fail();
    Sentry.captureException(e);
    return Promise.resolve(false);
  }
}

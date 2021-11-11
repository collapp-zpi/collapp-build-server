import fs from "fs-extra";
import chalk from "chalk";
import Listr from "listr";
import path from "path";
import { excluded } from "./excludedDependencies";
import npm from "npm-programmatic";
import ora from "ora";

export async function installPackages(packageJsonPath: string) {
  const localModules = path.join(__dirname);
  console.log(localModules);
  //   const spinner = ora(
  //     "Download packages from " + chalk.green("package.json")
  //   ).start();
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

  return npm.install(
    packages.map((p) => p.path),
    {
      cwd: path.join(__dirname, "node_modules"),
      save: true,
    }
  );
}

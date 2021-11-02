import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { PluginRequest } from "../build/build";
import { hashElement } from "folder-hash";
const extract = require("extract-zip");
const https = require("https");

export async function downloadAndUnzip(request: PluginRequest, onFinish) {
  const tempPath = path.join(__dirname, "temp");
  const plugin = path.join(__dirname, "..", "build", "plugin");

  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath);
  } else {
    fs.rmdirSync(tempPath, { recursive: true });
    fs.mkdirSync(tempPath);
  }

  if (fs.existsSync(plugin)) {
    fs.rmdirSync(plugin, { recursive: true });
    // fs.mkdirSync(plugin);
  }

  const file = fs.createWriteStream(tempPath + "/plugin.zip");
  https
    .get(request.zip.url, (response) => {
      response.pipe(file);
      file.on("finish", async () => {
        await extract(tempPath + "/plugin.zip", { dir: tempPath });
        // Calculate hash
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
          console.log(chalk.blue("Hash match"));
          fs.rmSync(path.resolve(tempPath, "plugin.zip"));
          fs.rmSync(path.join(tempPath, "package.json"));
          fs.rmSync(path.join(tempPath, "tailwind.config.js"));
          fs.rmSync(path.join(tempPath, "hash.json"));
          fs.rmSync(path.join(tempPath, "collapp-config.json"));
          if (fs.existsSync(path.join(tempPath, "server.js"))) {
            fs.rmSync(path.join(tempPath, "server.js"));
          }
          file.close();
          fs.moveSync(tempPath, plugin);
          return onFinish(true, null);
        }
        console.log(chalk.blue("Hash do not match"));
        console.log(chalk.gray(`Got: ${hash.hash}`));
        console.log(chalk.gray(`Original: ${hashObject.hash}`));
        fs.unlink(tempPath, () => {});
        fs.rmdirSync(tempPath, { recursive: true });
        file.close();
        return onFinish(false, "Hash do not match");
      });
    })
    .on("error", (err) => {
      fs.unlink(tempPath, () => {});
      fs.rmdirSync(tempPath, { recursive: true });
      console.log(err);
      onFinish(false, "could not unpack code");
    });
}

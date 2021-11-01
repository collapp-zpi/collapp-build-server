import { runBuild } from "../../webpack";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import AWS from "aws-sdk";
import { downloadAndUnzip } from "../modules/saveModule";

const client = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

export interface BuildResults {
  success: Boolean;
  build: {
    success: Boolean;
    time?: number;
    errors?: object[];
  };
  upload: {
    name: string;
    success: Boolean;
    files: string[];
  };
}

export interface PluginRequest {
  requestId: string;
  ping: {
    url: string;
  };
  name: string;
  developer: {
    name: string;
    email: string;
  };
  zip: {
    url: string;
  };
}

let results: BuildResults = {
  success: false,
  build: {
    success: false,
    time: 0,
    errors: [],
  },
  upload: {
    name: "",
    success: false,
    files: [],
  },
};

export async function processPlugin(
  request: PluginRequest,
  cb: (res: BuildResults) => void
) {
  results = {
    success: false,
    build: {
      success: false,
      time: 0,
      errors: [],
    },
    upload: {
      name: "",
      success: false,
      files: [],
    },
  };
  downloadAndUnzip(request, async (res, e) => {
    if (e != null) {
      results.success = false;
      results.build.errors.push({ err: e });
      return cb(results);
    }
    if (!pluginExists()) {
      console.log(chalk.red("No plugin was found, what is happening"));
      results.success = false;
      results.build.errors.push({ err: "Plugin not found" });
      return cb(results);
    }
    if (res) {
      runBuild(request, (succ, stats) => {
        results.build.success = succ;
        results.build.time = stats.time;
        results.build.errors = stats.errors;
        if (succ) {
          copyToModules(request);
          uploadPlugin(request);
          fs.rmdirSync(path.join(__dirname, "../../", "dist"), {
            recursive: true,
          });
          results.success = true;
          cb(results);
          console.log("\n\n");
        } else {
          console.log(chalk.red("Some errors during the build"));
          cb(results);
        }
      });
    } else {
      console.log(chalk.red("Something wrong with the unzip"));
      cb(results);
    }
  });
}

const pluginExists = () => {
  return fs.existsSync(path.join(__dirname, "plugin"));
};

const copyToModules = (plugin: PluginRequest) => {
  const pluginPath = path.join(__dirname, "plugin");

  if (
    !fs.existsSync(
      path.resolve(__dirname, "../", "modules", "scripts", plugin.name)
    )
  ) {
    fs.mkdirSync(
      path.resolve(__dirname, "../", "modules", "scripts", plugin.name)
    );
  }

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

  if (fs.existsSync(pluginPath)) {
    fs.rmdirSync(path.join(__dirname, "plugin"), { recursive: true });
  }
};

const uploadPlugin = (plugin: PluginRequest) => {
  console.log(chalk.blue("Uploading plugin to AWS"));
  const distPath = path.resolve(__dirname, "../../", "dist");
  const files = fs.readdirSync(distPath);
  results.upload.name = plugin.name;
  results.upload.files = files;
  files.forEach((f) => {
    const params = {
      Body: fs.readFileSync(path.resolve(__dirname, "../../", "dist", f)),
      Bucket: process.env.AWS_BUCKET,
      Key: `plugins/${plugin.name}/${f}`,
    };
    client.upload(params, (err, data) => {
      if (err) {
        results.upload.success = false;
      }
    });
  });
  results.upload.success = true;
};

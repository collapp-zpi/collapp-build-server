import chalk from "chalk";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import https from "https";
import Listr from "listr";

const root = "scripts/";
const rootS3 = "https://cloudfront.collapp.live/plugins/";

const client = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
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
  if (fs.existsSync(p)) {
    fs.rmdirSync(p, { recursive: true });
  }

  // Create new local version of plugin
  fs.mkdirSync(p);
  const file = fs.createWriteStream(p + "/server.js");
  https
    .get(rootS3 + plugin + "/server.js", (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
      });
    })
    .on("error", (err) => {
      fs.unlink(p, () => {});
      fs.rmdirSync(p, { recursive: true });
      console.log(chalk.red(err));
    });
};

const deleteUnwanted = async (plugin: string) => {
  fs.rmdirSync(path.resolve(__dirname, root, plugin), { recursive: true });
};

export async function syncPlugins() {
  console.log("Let me check if we are up to date...");

  if (!fs.existsSync(path.resolve(__dirname, root))) {
    fs.mkdirSync(path.resolve(__dirname, root));
  }

  const params = {
    Bucket: process.env.AWS_BUCKET,
    Prefix: "plugins",
  };

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
  const tasksDelete = new Listr(
    toDelete.map((d) => ({
      title: chalk.red.bold("Removed") + ` local version of '${d}' plugin`,
      task: () => deleteUnwanted(d),
    }))
  );
  await tasksDelete.run();

  localPlugins = localPlugins.filter((local) => !toDelete.includes(local));

  const emptyPlugins = localPlugins.filter((f) =>
    isEmpty(path.resolve(__dirname, "./scripts/", f))
  );

  const toDownload = [
    ...setDifference(remotePlugins, localPlugins),
    ...emptyPlugins,
  ];

  const tasksDownload = new Listr(
    toDownload.map((d) => ({
      title: chalk.green.bold("Downloaded") + ` '${d}' plugin`,
      task: () => downloadFileToLocalDirectory(d),
    }))
  );
  await tasksDownload.run();

  if (toDownload.length == 0 && toDelete.length == 0)
    console.log(chalk.blue.bold("Uff, all seems to be up to date"));
}

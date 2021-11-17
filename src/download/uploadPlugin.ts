import { PluginRequest } from "../types/Plugin";
import { UploadResponse } from "../types/Responses";
import path from "path";
import fs from "fs";
import AWS from "aws-sdk";
import * as Sentry from "@sentry/node";
import ora from "ora";

const client = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY_COLLAPP,
});

export default function uploadPlugin(
  plugin: PluginRequest
): Promise<UploadResponse> {
  let response: UploadResponse = {
    success: false,
    files: [],
  };

  const uploadSpinner = ora("Upload files to a server").start();
  const distPath = path.resolve(__dirname, "../../dist");
  const files = fs.readdirSync(distPath);
  files.forEach(async (f) => {
    response.files.push(f);
    const params = {
      Body: fs.readFileSync(path.resolve(__dirname, "../../dist", f)),
      Bucket: process.env.AWS_BUCKET,
      Key: `plugins/${plugin.name}/${f}`,
    };
    await client
      .upload(params, (err, data) => {
        if (err) {
          uploadSpinner.fail();
          Sentry.captureMessage(`Coud not upload a file to AWS`);
          return Promise.resolve(response);
        }
      })
      .promise();
  });
  uploadSpinner.succeed();
  response.success = true;
  return Promise.resolve(response);
}

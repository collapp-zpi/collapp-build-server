import { PluginRequest } from "../types/Plugin";
import { UploadResponse } from "../types/Responses";
import path from "path";
import fs from "fs";
import * as Sentry from "@sentry/node";
import ora from "ora";
import axios from "axios";

export default async function uploadPlugin(
  plugin: PluginRequest
): Promise<UploadResponse> {
  let response: UploadResponse = {
    success: false,
    files: [],
  };

  const uploadSpinner = ora("Upload files to a server").start();
  const distPath = path.resolve(__dirname, "../../dist");
  const files = fs.readdirSync(distPath);

  try {
    await Promise.all(files.map(async (f) => {
      response.files.push(f);
      return axios(process.env.NEXT_PUBLIC_STORAGE_ROOT + `/plugins/${plugin.requestId}/${f}`, {
        method: 'PUT',
        headers: {
          'Content-type': '*/*',
          Authorization: `Bearer ${process.env.STORAGE_SECRET}`
        },
        data: fs.readFileSync(path.resolve(distPath, f)),
      })
    }))
  } catch (e) {
    uploadSpinner.fail();
    Sentry.captureMessage(`Could not upload a file to AWS`);
    return Promise.resolve(response);
  }

  uploadSpinner.succeed();
  response.success = true;
  return Promise.resolve(response);
}

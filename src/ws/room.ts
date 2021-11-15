import * as Sentry from "@sentry/node";
import { getPluginName, getPluginData, updatePluginData } from "./updateDB";
import path from "path";

const scriptPath = path.join(__dirname, "../" + "modules", "scripts");

export default class Room {
  async init(io, socket, room, spaceId, pluginId) {
    try {
      socket.join(room);
      const pluginName = await getPluginName(pluginId);
      const module = require(path.resolve(
        scriptPath,
        pluginName,
        "server.js"
      )).default;
      const functions = Object.keys(module);

      functions.forEach((f) => {
        socket.on(f, async (data) => {
          const dataParsed = JSON.parse(data);
          const dbState = await getPluginData(spaceId, pluginId);
          const newData = loadFunction(pluginName, f)(dbState, dataParsed);
          io.to(room).emit("update", newData);
          await updatePluginData(spaceId, pluginId, newData);
        });
      });
      console.log("Waiting...");
    } catch (e) {
      Sentry.captureException(e);
    }
  }
}

function loadFunction(name: string, fun: string) {
  const p = path.resolve(scriptPath, name, "server.js");
  const module = require(p).default;
  try {
    return module[fun];
  } catch (e) {
    Sentry.captureException(e);
  }
}

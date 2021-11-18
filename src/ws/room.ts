import * as Sentry from "@sentry/node";
import { getPluginData, updatePluginData } from "./updateDB";
import path from "path";

const scriptPath = path.join(__dirname, "../" + "modules", "scripts");

export default class Room {
  async init(io, socket, room, spaceId, pluginId) {
    try {
      // Join room for a specific SpacePlugin
      socket.join(room);
      socket.emit("room", room);
      console.log("Connected " + room);

      // Load methods from local module store
      const module = loadModule(pluginId);
      const functions = Object.keys(module);
      socket.to(room).emit("functions", functions);

      // Get current state and emit on init
      const dbState = await getPluginData(spaceId, pluginId);
      socket.emit("update", dbState);

      // Allow to force pull data
      socket.on("pull", () => {
        io.to(room).emit("update", dbState);
      });

      // Each method from server.js
      functions.forEach((method) => {
        socket.on(method, async (data) => {
          // Get recent data, process, broadcast and update DB

          const dataParsed = JSON.parse(data);
          const dbState = await getPluginData(spaceId, pluginId);
          const fun = loadFunction(pluginId, method);
          const newData = (await fun(dbState, dataParsed)) || dbState;
          io.to(room).emit("update", newData);
          await updatePluginData(spaceId, pluginId, newData);
        });
      });
    } catch (e) {
      Sentry.captureException(e);
    }
  }
}

function loadModule(pluginId: string) {
  return require(path.resolve(scriptPath, pluginId, "server.js")).default;
}

function loadFunction(name: string, fun: string) {
  const module = loadModule(name);
  try {
    return module[fun];
  } catch (e) {
    Sentry.captureException(e);
    return null;
  }
}

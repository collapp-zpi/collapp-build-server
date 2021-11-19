import * as Sentry from "@sentry/node";
import { getPluginData, updatePluginData } from "./updateDB";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

const scriptPath = path.join(__dirname, "../" + "modules", "scripts");

export default class Room {
  async init(io, socket, room, spaceId, pluginId) {
    try {
      // Join room for a specific SpacePlugin
      socket.join(room);
      socket.emit("room", room);
      console.log("Connected " + room);

      // Get current state and emit on init
      const dbState = await getPluginData(spaceId, pluginId);
      console.log(`Current state: ${JSON.stringify(dbState)}`);
      socket.emit("update", dbState);

      // Load methods from local module store
      const module = loadModule(pluginId);
      if (module != null && module !== {}) {
        console.log("Module: " + module);
        const functions = Object.keys(module);

        socket.emit("functions", functions);
        console.log(`Functions: ${functions}`);

        // Each method from server.js
        functions.forEach((method) => {
          socket.on(method, async (data) => {
            // Get recent data, process, broadcast and update DB

            console.log(chalk.green(method) + " " + JSON.stringify(data));
            const dbState = await getPluginData(spaceId, pluginId);
            const fun = loadFunction(pluginId, method);
            const newData = (await fun(dbState, data)) || dbState;
            await updatePluginData(spaceId, pluginId, newData);
            io.to(room).emit("update", newData);
          });
        });
      } else {
        console.log(chalk.red("No module was found"));
        socket.emit("errors", "No module was found");
      }
      socket.on("pull", () => {
        socket.emit("update", dbState);
      });

      socket.on("update", (data) => {
        console.log(`Update: ${data}`);
      });
    } catch (e) {
      Sentry.captureException(e);
    }
  }
}

function loadModule(pluginId: string) {
  console.log("Module path: " + path.join(scriptPath, pluginId, "server.js"));
  if (fs.existsSync(path.join(scriptPath, pluginId, "server.js"))) {
    console.log("Exists");
    const mod = require(path.join(scriptPath, pluginId, "server.js"));
    console.log("Module: " + mod);
    return mod.default;
  } else {
    console.log(chalk.red("Module not found"));
    return null;
  }
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

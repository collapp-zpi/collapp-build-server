import chalk from "chalk";
import server from "./server";
import { syncPlugins } from "./modules/loadFromRemote";
import * as Sentry from "@sentry/node";
import { spacePluginExists } from "./ws/updateDB";
import { Server } from "socket.io";
import Room from "./ws/room";
const io = new Server();

io.on("connection", async (socket) => {
  const id = socket.handshake.query.id as string;
  if (id == undefined) {
    socket.send("Id was not provided");
    return;
  }
  const [spaceId, pluginId] = id.split("_");
  const exists = await spacePluginExists(spaceId, pluginId);
  if (!exists) {
    socket.send("Provided ids do not exist");
    return;
  }
  new Room().init(io, socket, id, spaceId, pluginId);
});

io.listen(3006);

try {
  server.listen(process.env.PORT, async () => {
    console.log(
      chalk.green(
        `Server is listening on port: ${chalk.greenBright.bold(
          process.env.PORT
        )} for incoming HTTP requests \n`
      )
    );

    // await syncPlugins();
  });
} catch (e) {
  Sentry.captureException(e);
}

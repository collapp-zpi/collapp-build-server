import chalk from "chalk";
import server from "./server";
import { syncPlugins } from "./modules/loadFromRemote";
import { WebSocketServer } from "ws";
import { match } from "node-match-path";
import { rooms, RoomSocket } from "./ws/roomSocket";
import * as Sentry from "@sentry/node";

try {
  server.listen(process.env.PORT, async () => {
    console.log(
      chalk.green(
        `Server is listening on port: ${chalk.greenBright.bold(
          process.env.PORT
        )} for incoming HTTP requests \n`
      )
    );

    await syncPlugins();
  });

  const wss = new WebSocketServer({ port: 8080 });

  wss.on("connection", (ws, req) => {
    const { matches, params } = match("/board/:id", req.url);

    if (!matches || !params?.id) {
      ws.close();
      return;
    }

    new RoomSocket().init(ws, params.id);
    ws.send(`You have connected to a room '${params.id}'`);
  });
} catch (e) {
  Sentry.captureException(e);
}

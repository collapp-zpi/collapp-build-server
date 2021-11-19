import chalk from "chalk";
import server from "./server";
import { syncPlugins } from "./modules/loadFromRemote";
import { spacePluginExists } from "./ws/updateDB";
import { Server } from "socket.io";
import Room from "./ws/room";
import fs from "fs-extra";
import path from "path";

const s = server.listen(process.env.PORT, async () => {
  console.log(
    chalk.green(
      `Server is listening on port: ${chalk.greenBright.bold(
        process.env.PORT
      )} for incoming HTTP requests \n`
    )
  );

  await syncPlugins();
});

const io = new Server(s, {
  cors: {
    origin: [
      "https://collapp-build-server.herokuapp.com",
      "https://collapp-build-server.herokuapp.com/socket.io/",
      "http://localhost:3002",
      "http://localhost:3000",
      "https://collapp.live",
      "https://www.collapp.live",
      "*",
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  const id = socket.handshake.query.id as string;
  if (id == undefined) {
    socket.emit("errors", "Id was not provided");
    return;
  }
  const [spaceId, pluginId] = id.split("_");
  const exists = await spacePluginExists(spaceId, pluginId);
  if (!exists) {
    socket.emit("errors", "Provided ids do not exist");
    return;
  }

  const scripts = path.join(__dirname, "modules", "scripts");
  console.log("Scripts: " + scripts);
  if (fs.existsSync(scripts)) {
    console.log("Scripts exists");
    fs.readdir(scripts, (err, files) => {
      console.log("Files: " + files);
    });
  } else {
    console.log(chalk.red("No script folder"));
  }

  new Room().init(io, socket, id, spaceId, pluginId);
});

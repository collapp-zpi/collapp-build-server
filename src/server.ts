import express, { Request, Response } from "express";
import { buildRouter } from "./buildRouter";
import { pluginRouter } from "./pluginRouter";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import configHandleErrors from "./config/handleError";

const server = express();

server.use(helmet());
server.use(cors());
server.use(bodyParser.json());

server.get("/", async (req: Request, res: Response) => {
  res.status(200).send("Server is awake");
});

server.use(buildRouter);
server.use(pluginRouter);

configHandleErrors(server);

export default server;

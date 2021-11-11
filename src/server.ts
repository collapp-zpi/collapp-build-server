import express, { Request, Response } from "express";
import { buildRouter } from "./routes/buildRouter";
import { pluginRouter } from "./routes/pluginRouter";
import cors from "cors";
import helmet from "helmet";
import configHandleErrors from "./config/handleError";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

const server = express();

Sentry.init({
  dsn: process.env.DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({
      router: buildRouter,
    }),
  ],
});
server.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);
server.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

server.use(helmet());
server.use(cors());
server.use(express.json());

server.get("/", async (req: Request, res: Response) => {
  res.status(200).send("Server is awake");
});

server.use(buildRouter);
server.use(pluginRouter);

configHandleErrors(server);

export default server;

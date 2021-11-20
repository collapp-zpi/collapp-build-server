import { ResponseSingleton } from "./../utils/response";
import { Router, Response, Request } from "express";
import { processPlugin } from "../build/build";
import queue from "express-queue";
import { SuccessEmail, ErrorEmail } from "@collapp/email-sdk";
import axios from "axios";
import { successBuild, failBuild } from "../utils/updateDB";
import * as Sentry from "@sentry/node";
export const buildRouter = Router();

buildRouter.use(queue({ activeLimit: 1, queuedLimit: -1 }));

buildRouter.get("/build", async (req: Request, res: Response) => {
  res.status(200).send("Hello");
});

buildRouter.post("/build", async (req: Request, res: Response) => {
  // Wake up that sleepy baby
  await axios.get("https://collapp-email-microservice.herokuapp.com/");

  try {
    const ret = await processPlugin(req.body);
    if (ret.success) {
      const mail = new SuccessEmail(process.env.RABBIT_URL);
      await mail.send({
        to: req.body.developer.email,
        subject: `Good news, '${req.body.name}' plugin was successfully build :)`,
        secret: process.env.SECRET,
        context: {
          name: req.body.developer.name,
          plugin: req.body.name,
          url: req.body.zip.url,
        },
      });
      mail.disconnect();
      await successBuild(req.body);
      res.status(200).send(ret);
    } else {
      const mail = new ErrorEmail(process.env.RABBIT_URL);
      await mail.send({
        to: req.body.developer.email,
        subject: `Sorry, '${req.body.name}' plugin build failed :(`,
        secret: process.env.SECRET,
        context: {
          errors: ret.build.errors.join(","),
          name: req.body.developer.name,
          plugin: req.body.name,
          url: req.body.zip.url,
        },
      });
      mail.disconnect();
      await failBuild(req.body);
      res.status(401).send(ret);
    }
  } catch (e) {
    res.status(500).send(ResponseSingleton.getInstance().response());
    Sentry.captureException(e);
  }
});

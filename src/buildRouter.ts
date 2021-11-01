import { Router, Response, Request } from "express";
import { BuildResults, processPlugin } from "./build/build";
import queue from "express-queue";
import { ErrorEmail, SuccessEmail } from "@collapp/email-sdk";

export const buildRouter = Router();

buildRouter.use(queue({ activeLimit: 1, queuedLimit: -1 }));

buildRouter.get("/build", async (req: Request, res: Response) => {
  res.status(200).send("Hello");
});

buildRouter.post("/build", async (req: Request, res: Response) => {
  processPlugin(req.body, async (results: BuildResults) => {
    if (results.success) {
      const mail = new SuccessEmail(process.env.RABBIT_URL);
      await mail.send({
        to: req.body.developer.email,
        subject: `Good news, '${req.body.name}' plugin was successfully build :)`,
        secret: process.env.SECRET,
        context: {},
      });
      mail.disconnect();
      res.status(200).send(results);
    } else {
      const mail = new ErrorEmail(process.env.RABBIT_URL);
      await mail.send({
        to: req.body.developer.email,
        subject: `Sorry, '${req.body.name}' plugin build failed :(`,
        secret: process.env.SECRET,
        context: {
          errors: results.build.errors.join(","),
        },
      });
      mail.disconnect();
      res.status(401).send(results);
    }
  });
});

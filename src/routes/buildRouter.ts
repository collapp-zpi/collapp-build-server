import { ResponseSingleton } from "../utils/response";
import { Router, Response, Request } from "express";
import { processPlugin } from "../build/build";
import queue from "express-queue";
import { successBuild, failBuild } from "../utils/updateDB";
import * as Sentry from "@sentry/node";
import { Resend } from "resend";
import { BuildSuccessTemplate } from "../emailTemplates/build-success";
import { BuildFailTemplate } from "../emailTemplates/build-fail";

export const buildRouter = Router();

buildRouter.use(queue({ activeLimit: 1, queuedLimit: -1 }));

buildRouter.get("/build", async (req: Request, res: Response) => {
  res.status(200).send("Hello");
});


const resend = new Resend(process.env.EMAIL_KEY)

buildRouter.post("/build", async (req: Request, res: Response) => {
  try {
    const ret = await processPlugin(req.body);
    if (ret.success) {
      if (req.body.developer.email) {
        const email = req.body.developer.email
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject: 'Your Collapp plugin has been published! 🤩',
          react: BuildSuccessTemplate({
            name: req.body.developer.name,
            pluginName: req.body.name,
            redirect: `https://developer.collapp.live/plugins/${req.body.requestId}`,
          }),
        })
      }
      await successBuild(req.body);
      res.status(200).send(ret);
    } else {
      if (req.body.developer.email) {
        const email = req.body.developer.email
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject: 'Your Collapp plugin build failed 😕',
          react: BuildFailTemplate({
            name: req.body.developer.name,
            pluginName: req.body.name,
            errors: ret.build.errors.join(","),
            redirect: `https://developer.collapp.live/plugins/${req.body.requestId}`,
          }),
        })
      }
      await failBuild(req.body);
      res.status(401).send(ret);
    }
  } catch (e) {
    res.status(500).send(ResponseSingleton.getInstance().response());
    Sentry.captureException(e);
  }
});

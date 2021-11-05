import { Router, Response, Request } from "express";
import { availablePlugins, deletePlugin } from "../modules/pluginData";
import { prisma } from "../config/prismaClient";

export const pluginRouter = Router();

pluginRouter.get("/plugins", async (req: Request, res: Response) => {
  const plugins = await availablePlugins();
  res.status(200).send(plugins);
});

pluginRouter.delete("/plugin/:name", async (req: Request, res: Response) => {
  await deletePlugin({ name: req.params.name }, (success) => {
    if (success) res.status(200).send({ success: true });
    else res.status(410).send({ success: false });
  });
});

pluginRouter.get("/drafts", async (req: Request, res: Response) => {
  const results = await prisma.publishedPlugin.findMany({
    where: {},
    include: { source: true },
  });
  console.log(results);
  res.status(200).send(results);
});

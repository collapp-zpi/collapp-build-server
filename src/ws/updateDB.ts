import { prisma } from "../config/prismaClient";

export async function spaceExists(id: string): Promise<Boolean> {
  const space = await prisma.space.findUnique({
    where: {
      id: id,
    },
  });
  return !space;
}

export async function pluginExists(id: string): Promise<Boolean> {
  const plugin = await prisma.publishedPlugin.findUnique({
    where: {
      id: id,
    },
  });
  return !plugin;
}

export async function spacePluginExists(
  space: string,
  plugin: string
): Promise<Boolean> {
  const exists = await prisma.spacePlugin.findMany({
    where: {
      spaceId: space,
      pluginId: plugin,
    },
  });
  return exists.length > 0;
}

export async function getPluginData(spaceId: string, pluginId: string) {
  const plugin = await prisma.spacePlugin.findFirst({
    where: {
      spaceId: spaceId,
      pluginId: pluginId,
    },
  });
  return plugin.data;
}

export async function updatePluginData(
  spaceId: string,
  pluginId: string,
  newData: object
) {
  return await prisma.spacePlugin.updateMany({
    where: {
      spaceId: spaceId,
      pluginId: pluginId,
    },
    data: {
      data: newData,
    },
  });
}

export async function getPluginName(id: string) {
  const plugin = await prisma.publishedPlugin.findUnique({
    where: {
      id: id,
    },
  });
  return plugin.name;
}

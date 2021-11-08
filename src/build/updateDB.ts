import { PluginRequest } from "./build";
import { prisma } from "../config/prismaClient";

export async function successBuild(plugin: PluginRequest) {
  const updateDraft = await prisma.draftPlugin.update({
    where: {
      id: plugin.requestId,
    },
    data: {
      isBuilding: false,
      isPending: false,
    },
  });
  const draft = await prisma.draftPlugin.findUnique({
    where: { id: plugin.requestId },
    include: { source: true },
  });
  const updatePublished = await prisma.publishedPlugin.upsert({
    where: {
      id: plugin.requestId,
    },
    create: {
      id: plugin.requestId,
      name: draft.name,
      description: draft.description,
      icon: draft.icon,
      authorId: draft.authorId,
      draftId: draft.id,
      minHeight: draft.minHeight,
      minWidth: draft.minWidth,
      maxHeight: draft.maxHeight,
      maxWidth: draft.maxWidth,
      source: {
        connect: { id: draft.source.id },
      },
    },
    update: {
      name: draft.name,
      description: draft.description,
      icon: draft.icon,
      authorId: draft.authorId,
      draftId: draft.id,
      minHeight: draft.minHeight,
      minWidth: draft.minWidth,
      maxHeight: draft.maxHeight,
      maxWidth: draft.maxWidth,
      source: {
        connect: { id: draft.source.id },
      },
    },
  });
  return {
    updateDraft,
    updatePublished,
  };
}

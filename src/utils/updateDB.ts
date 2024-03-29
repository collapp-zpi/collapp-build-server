import { PluginRequest } from "../types/Plugin";
import { prisma } from "../config/prismaClient";
import * as Sentry from "@sentry/node";

export async function successBuild(plugin: PluginRequest) {
  try {
    const updateDraft = await prisma.draftPlugin.update({
      where: {
        id: plugin.requestId,
      },
      data: {
        isBuilding: false,
        isPending: false,
        logs: {
          create: [{ content: "Build success" }],
        },
      },
    });
    const draft = await prisma.draftPlugin.findUnique({
      where: { id: plugin.requestId },
      include: {
        source: true,
        published: {
          select: {
            id: true,
          },
        },
      },
    });
    if (draft?.published) {
      await prisma.file.delete({
        where: { publishedId: plugin.requestId },
      });
    }
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
  } catch (e) {
    Sentry.captureException(e);
  }
}

export async function failBuild(plugin: PluginRequest) {
  try {
    const updateDraft = await prisma.draftPlugin.update({
      where: {
        id: plugin.requestId,
      },
      data: {
        isBuilding: false,
        isPending: false,
        logs: {
          create: [{ content: "Build error" }],
        },
      },
    });
    return {
      updateDraft,
    };
  } catch (e) {
    Sentry.captureException(e);
  }
}

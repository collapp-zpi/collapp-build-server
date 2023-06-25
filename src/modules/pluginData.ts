import axios from "axios";
import { parseStringPromise } from "xml2js";
import { URLSearchParams } from "url";

export async function getRemotePlugins(): Promise<string[]> {
  const query = new URLSearchParams({ 'prefix': 'plugins' }).toString();
  const request = await axios.get(process.env.NEXT_PUBLIC_STORAGE_ROOT + `?${query}`, {
    headers: {
      Authorization: `Bearer ${process.env.STORAGE_SECRET}`,
    },
  })
  const parsed = await parseStringPromise(request.data)
  const list = parsed?.ListBucketResult?.Contents ?? []
  const keys = list.map(({ Key }) => Key[0].split('/')) as [string, string, string][]

  return [
    ...new Set(
      keys.filter(([folder, plugin]) => folder === "plugins" && !!plugin)
    )
  ].map(([, , plugin]) => plugin)
}

export async function availablePlugins(): Promise<object[]> {
  const plugins = await getRemotePlugins()

  return plugins.map((p) => ({
    name: p,
    entry: `${process.env.NEXT_PUBLIC_STORAGE_ROOT}/plugins/${p}/entry.js`,
  }));
}

export async function deletePlugin(pluginId: string) {
  try {
    console.log("plugin: " + pluginId);

    const getQuery = new URLSearchParams({ 'prefix': `plugins/${pluginId}` }).toString();
    const getRequest = await axios.get(process.env.NEXT_PUBLIC_STORAGE_ROOT + `?${getQuery}`, {
      headers: {
        Authorization: `Bearer ${process.env.STORAGE_SECRET}`,
      },
    })
    const parsed = await parseStringPromise(getRequest.data)
    const keys = parsed.ListBucketResult.Contents.map(({ Key }) => Key)
    console.log(keys)
    if (!keys) return false

    const deleteQuery = new URLSearchParams({ 'delete': 'true' }).toString();
    await axios.post(process.env.NEXT_PUBLIC_STORAGE_ROOT + `?${deleteQuery}`, {
      headers: {
        Authorization: `Bearer ${process.env.STORAGE_SECRET}`,
      },
      data: keys
    })

    return true
  } catch (e) {
    return false
  }
}

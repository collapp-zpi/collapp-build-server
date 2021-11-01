import AWS from "aws-sdk";

const client = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

export async function availablePlugins(): Promise<object[]> {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Prefix: "plugins",
  };

  const { Contents } = await client.listObjectsV2(params).promise();
  const plugins = [
    ...new Set(
      Contents.map((element) => element.Key.split("/")[1]).filter(
        (f) => f.length > 0
      )
    ),
  ];

  return plugins.map((p) => ({
    name: p,
    entry: {
      cached: `https://cloudfront.collapp.live/plugins/${p}/entry.js`,
      direct: `http://aws.collapp.live/plugins/${p}/entry.js`,
    },
  }));
}

export async function deletePlugin(plugin: { name: string }, cb) {
  console.log("plugin: " + plugin.name);
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Prefix: "plugins/" + plugin.name,
  };

  client.listObjects(params, function (err, data) {
    if (err) return cb(false);

    if (data.Contents.length == 0) return cb(false);
    console.log(data.Contents);
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET,
      Delete: { Objects: [] },
    };

    data.Contents.forEach(function (content) {
      deleteParams.Delete.Objects.push({ Key: content.Key });
    });
    console.log("delete params: ", JSON.stringify(deleteParams));
    client.deleteObjects(deleteParams, function (err, data) {
      if (err) return cb(false);
      else return cb(true);
    });
  });
}

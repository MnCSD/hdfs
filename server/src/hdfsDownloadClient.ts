import http from "http";
import https from "https";
import { PassThrough } from "stream";
import { URLSearchParams, URL } from "url";
import dotenv from "dotenv";

dotenv.config();

interface HdfsDownloadOptions {
  hdfsPath: string;
  host?: string;
  port?: number;
  user?: string;
}

export function createReadStreamFromHDFS({
  hdfsPath,
  host = process.env.HDFS_HOST || "localhost",
  port = Number(process.env.HDFS_PORT) || 9870,
  user = process.env.HDFS_USER || "hdfs",
}: HdfsDownloadOptions): PassThrough {
  const passThrough = new PassThrough();

  const queryParams = new URLSearchParams({
    op: "OPEN",
    "user.name": user,
  });

  const openUrl = `http://${host}:${port}/webhdfs/v1${hdfsPath}?${queryParams.toString()}`;
  console.log("Requesting download from:", openUrl);

  fetch(openUrl, { method: "GET", redirect: "manual" })
    .then((res) => {
      if (res.status !== 307) {
        throw new Error(`Failed to initiate download. Status: ${res.status}`);
      }

      const originalRedirectUrl = res.headers.get("location");
      if (!originalRedirectUrl)
        throw new Error("Missing redirect location from WebHDFS");

      const parsed = new URL(originalRedirectUrl);
      parsed.hostname = host;
      const fixedRedirectUrl = parsed.toString();

      console.log("Redirecting download to:", fixedRedirectUrl);

      const lib = fixedRedirectUrl.startsWith("https") ? https : http;
      lib
        .get(fixedRedirectUrl, (res2) => {
          if (res2.statusCode !== 200) {
            passThrough.emit(
              "error",
              new Error(`Download failed. Status: ${res2.statusCode}`)
            );
            return;
          }

          res2.pipe(passThrough);
        })
        .on("error", (err) => {
          passThrough.emit("error", err);
        });
    })
    .catch((err) => process.nextTick(() => passThrough.emit("error", err)));

  return passThrough;
}

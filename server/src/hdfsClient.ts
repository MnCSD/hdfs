import http from "http";
import https from "https";
import { PassThrough } from "stream";
import { URLSearchParams, URL } from "url";
import dotenv from "dotenv";

dotenv.config();

interface HdfsUploadOptions {
  hdfsPath: string;
  host?: string;
  port?: number;
  user?: string;
  overwrite?: boolean;
}

export function createWriteStreamToHDFS({
  hdfsPath,
  host = process.env.HDFS_HOST || "localhost",
  port = Number(process.env.HDFS_PORT) || 9870,
  user = process.env.HDFS_USER || "hdfs",
  overwrite = true,
}: HdfsUploadOptions): PassThrough {
  const passThrough = new PassThrough();

  const queryParams = new URLSearchParams({
    op: "CREATE",
    "user.name": user,
    overwrite: overwrite.toString(),
  });

  const createUrl = `http://${host}:${port}/webhdfs/v1${hdfsPath}?${queryParams.toString()}`;
  console.log("Uploading to:", createUrl);

  fetch(createUrl, { method: "PUT", redirect: "manual" })
    .then((res) => {
      if (res.status !== 307) {
        throw new Error(`Failed to initiate upload. Status: ${res.status}`);
      }

      const originalRedirectUrl = res.headers.get("location");
      if (!originalRedirectUrl)
        throw new Error("Missing redirect location from WebHDFS");

      const parsed = new URL(originalRedirectUrl);
      parsed.hostname = host; // Replace internal hostname with real IP
      const fixedRedirectUrl = parsed.toString();

      console.log("Redirecting upload to:", fixedRedirectUrl);

      const lib = fixedRedirectUrl.startsWith("https") ? https : http;
      const req = lib.request(fixedRedirectUrl, { method: "PUT" }, (res2) => {
        if (res2.statusCode !== 201) {
          passThrough.emit(
            "error",
            new Error(`Upload failed. Status: ${res2.statusCode}`)
          );
        } else {
          passThrough.emit("success");
        }
      });

      req.on("error", (err) => passThrough.emit("error", err));
      passThrough.pipe(req);
    })
    .catch((err) => process.nextTick(() => passThrough.emit("error", err)));

  return passThrough;
}

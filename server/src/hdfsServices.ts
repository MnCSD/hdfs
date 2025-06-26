import fs from "fs";
import { createWriteStreamToHDFS } from "./hdfsClient.js";
import { createReadStreamFromHDFS } from "./hdfsDownloadClient.js";

export function uploadToHDFS(
  localFile: string,
  hdfsTarget: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const localFileStream = fs.createReadStream(localFile);
    const hdfsWriteStream = createWriteStreamToHDFS({ hdfsPath: hdfsTarget });

    localFileStream.pipe(hdfsWriteStream);

    hdfsWriteStream.on("error", (err: Error) => reject(err));
    hdfsWriteStream.on("success", () => resolve());
  });
}

export function downloadFromHDFS(
  hdfsSource: string,
  localTarget: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const hdfsReadStream = createReadStreamFromHDFS({ hdfsPath: hdfsSource });
    const localFileStream = fs.createWriteStream(localTarget);

    hdfsReadStream.pipe(localFileStream);

    hdfsReadStream.on("error", (err: Error) => reject(err));
    localFileStream.on("finish", () => resolve());
  });
}

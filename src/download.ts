import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createReadStreamFromHDFS } from "./hdfsDownloadClient.js";

dotenv.config();

const hdfsSourcePath = "/test/sample.txt";
const localTargetPath = path.resolve("data/downloaded-test.txt");

const hdfsReadStream = createReadStreamFromHDFS({ hdfsPath: hdfsSourcePath });
const localFileStream = fs.createWriteStream(localTargetPath);

hdfsReadStream.pipe(localFileStream);

hdfsReadStream.on("error", (err) => {
  console.error("❌ Error downloading from HDFS:", err.message);
});

localFileStream.on("success", () => {
  console.log("✅ File downloaded from HDFS!");
});

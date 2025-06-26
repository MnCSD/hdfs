import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createWriteStreamToHDFS } from "./hdfsClient.js";

dotenv.config();

const localFile = path.resolve("data/sample.txt");
const hdfsTarget = "/test/sample_1.txt";

const localFileStream = fs.createReadStream(localFile);
const hdfsWriteStream = createWriteStreamToHDFS({
  hdfsPath: hdfsTarget,
});

localFileStream.pipe(hdfsWriteStream);

hdfsWriteStream.on("error", (err) => {
  console.error("❌ Error uploading to HDFS:", err.message);
});

hdfsWriteStream.on("success", () => {
  console.log("✅ File uploaded to HDFS!");
});

import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToHDFS, downloadFromHDFS } from "./hdfsServices.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const upload = multer({ dest: "data/" });

app.use(express.json());

// Upload route
app.post("/api/upload-to-hdfs", upload.single("file"), async (req, res) => {
  const file = req.file;
  const hdfsTarget = req.body.hdfsPath;
  if (!file || !hdfsTarget) {
    res.status(400).json({ message: "File and hdfsPath are required" });
    return;
  }
  try {
    await uploadToHDFS(file.path, hdfsTarget);
    fs.unlink(file.path, () => {});
    res.json({ message: "✅ File uploaded to HDFS!", hdfsPath: hdfsTarget });
  } catch (err: any) {
    fs.unlink(file.path, () => {});
    res.status(500).json({ message: "❌ Error uploading to HDFS", error: err });
  }
});

// Download route (streams file to client)
//@ts-ignore (fix overload error!!)
app.get("/api/download-from-hdfs", async (req, res) => {
  const hdfsSourcePath = req.query.hdfsPath as string;
  if (!hdfsSourcePath) {
    return res.status(400).json({ message: "hdfsPath is required" });
  }

  try {
    // Create a temp file to store the download
    const tempFile = path.resolve(
      "data",
      `download-${Date.now()}-${path.basename(hdfsSourcePath)}`
    );
    await downloadFromHDFS(hdfsSourcePath, tempFile);

    res.download(tempFile, path.basename(hdfsSourcePath), (err) => {
      fs.unlink(tempFile, () => {});
      if (err) {
        res
          .status(500)
          .json({ message: "❌ Error sending file", error: err.message });
      }
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "❌ Error downloading from HDFS", error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

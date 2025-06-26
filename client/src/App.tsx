import React, { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success, error
  const [message, setMessage] = useState("");
  const [hdfsPath, setHdfsPath] = useState("/test/uploaded-file.txt");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const file = files && files[0];
    setSelectedFile(file || null);
    setUploadStatus("idle");
    setMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first");
      return;
    }

    setUploadStatus("uploading");
    setMessage("Uploading to HDFS...");

    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("hdfsPath", hdfsPath);

      // Call your backend API endpoint (you'll need to create this)
      const response = await fetch("/api/upload-to-hdfs", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUploadStatus("success");
        setMessage(`File successfully uploaded to HDFS at ${hdfsPath}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }
    } catch (error) {
      setUploadStatus("error");
      if (error instanceof Error) {
        setMessage(`Upload failed: ${error.message}`);
      } else {
        setMessage("Upload failed: An unknown error occurred");
      }
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setMessage("");
    setHdfsPath("/test/uploaded-file.txt");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              HDFS File Uploader
            </h1>
            <p className="text-gray-600">
              Upload files directly to your Hadoop Distributed File System
            </p>
          </div>

          <div className="space-y-6">
            {/* HDFS Path Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HDFS Destination Path
              </label>
              <input
                type="text"
                value={hdfsPath}
                onChange={(e) => setHdfsPath(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="/test/your-file.txt"
              />
            </div>

            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
              </div>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploadStatus === "uploading"}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 
                text-white font-medium py-3 px-4 rounded-lg transition-colors
                flex items-center justify-center space-x-2"
            >
              {uploadStatus === "uploading" ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload to HDFS</span>
                </>
              )}
            </button>

            {/* Status Message */}
            {message && (
              <div
                className={`rounded-lg p-4 flex items-center space-x-3 ${
                  uploadStatus === "success"
                    ? "bg-green-50 text-green-800"
                    : uploadStatus === "error"
                    ? "bg-red-50 text-red-800"
                    : "bg-blue-50 text-blue-800"
                }`}
              >
                {uploadStatus === "success" && (
                  <CheckCircle className="w-5 h-5" />
                )}
                {uploadStatus === "error" && (
                  <AlertCircle className="w-5 h-5" />
                )}
                {uploadStatus === "uploading" && (
                  <Loader className="w-5 h-5 animate-spin" />
                )}
                <span>{message}</span>
              </div>
            )}

            {/* Reset Button */}
            {uploadStatus === "success" && (
              <button
                onClick={resetUpload}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 
                  font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Upload Another File
              </button>
            )}
          </div>

          {/* Connection Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Connection Details
            </h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Host: localhost:9870</p>
              <p>User: hdfs</p>
              <p>WebHDFS API enabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

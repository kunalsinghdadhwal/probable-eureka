"use client";

import React, { useState, useRef } from "react";
import {
  useActiveWallet,
  useActiveAccount,
  ConnectButton,
} from "thirdweb/react";
import { client } from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  File,
  Shield,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";

interface UploadedFile {
  hash: string;
  name: string;
  size: string;
  url: string;
  decryptUrl: string;
  uploadedAt: Date;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // thirdweb wallet
  const wallet = useActiveWallet();
  const account = useActiveAccount();

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  // Copy hash to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Hash copied to clipboard!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  const signAuthMessage = async () => {
    if (!account) return null;
    try {
      const { data } = await fetch("/api/lighthouse/getAuthMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account.address }),
      }).then(res => res.json());

      const signature = await account.signMessage({ message: data.message });
      return { signature, signerAddress: account.address };
    } catch (err) {
      console.error("Signing error:", err);
      return null;
    }
  };

  // Upload file with signature auth
  const uploadEncryptedFile = async () => {
    if (!file) {
      setError("No file selected.");
      return;
    }
    if (!wallet || !account) {
      setError("Wallet not connected.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      const auth = await signAuthMessage();
      if (!auth) throw new Error("Failed to sign message.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", auth.signature);
      formData.append("address", auth.signerAddress);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };

      const uploadResult: any = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } else {
            reject(new Error(JSON.parse(xhr.responseText).error || "Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });

      // Add to uploaded files list with proper structure
      const newUploadedFile: UploadedFile = {
        hash: uploadResult.hash,
        name: uploadResult.name || file.name,
        size: formatFileSize(file.size),
        url: uploadResult.url,
        decryptUrl: uploadResult.decryptUrl,
        uploadedAt: new Date(),
      };

      setUploadedFiles(prev => [newUploadedFile, ...prev]);
      setSuccess("File uploaded successfully!");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      console.log("Uploaded file info:", uploadResult);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // File size formatting helper
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8 flex justify-end">
      </div>

      <div className="mb-4">
        <h1 className="text-3xl font-bold">Upload AI Dataset</h1>
        <p className="mt-2 text-muted-foreground">
          Securely upload and encrypt your AI datasets using Lighthouse and Filecoin
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Encrypted File
          </CardTitle>
          <CardDescription>
            Your files will be encrypted and stored on IPFS via Lighthouse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              Select Dataset File
            </label>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                file:rounded-full file:border-0 file:text-sm file:font-semibold 
                file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              accept=".json,.csv,.txt,.zip,.tar.gz,.pkl,.h5,.pt,.pth"
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <File className="h-4 w-4" />
                <span>{file.name}</span>
                <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
              </div>
            )}
          </div>

          <Button
            onClick={uploadEncryptedFile}
            disabled={!file || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Upload Encrypted File
              </>
            )}
          </Button>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Uploaded Files
            </CardTitle>
            <CardDescription>Your encrypted datasets stored on IPFS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((f, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{f.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {f.size} • {f.uploadedAt.toLocaleString()}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Hash: {f.hash?.substring(0, 12) || 'N/A'}...
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(f.hash || '')}
                          className="h-6 px-2"
                          disabled={!f.hash}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => f.url && window.open(f.url, "_blank")}
                      disabled={!f.url}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => f.decryptUrl && window.open(f.decryptUrl, "_blank")}
                      disabled={!f.decryptUrl}
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      Decrypt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

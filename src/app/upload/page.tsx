"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Loader2,
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

  // Copy hash to clipboard with better feedback
  const copyToClipboard = async (text: string) => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Hash copied to clipboard!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setSuccess("Hash copied to clipboard!");
        setTimeout(() => setSuccess(null), 3000);
      } catch (fallbackErr) {
        setError("Failed to copy to clipboard. Please copy manually.");
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  // Focus management for errors
  const errorRef = useRef<HTMLDivElement>(null);
  const firstErrorFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    if (error && !file && firstErrorFieldRef.current) {
      firstErrorFieldRef.current.focus();
    }
  }, [error, file]);

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
    <main className="mx-auto max-w-4xl px-6 py-16 pt-24">
      {/* Skip to content link for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                   bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div className="mb-8 flex justify-end">
      </div>

      <div id="main-content" className="mb-8">
        <h1 className="text-3xl font-bold scroll-margin-top-24">Upload AI Dataset</h1>
        <p className="mt-2 text-muted-foreground">
          Securely upload and encrypt your AI datasets using Lighthouse and Filecoin. 
          Connect your wallet first to begin the upload process.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" aria-hidden="true" />
            Upload Encrypted File
          </CardTitle>
          <CardDescription>
            Your files will be encrypted and stored on IPFS via Lighthouse. 
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label 
              htmlFor="file-upload" 
              className="text-sm font-medium block"
            >
              Select Dataset File *
            </label>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-foreground 
                file:mr-4 file:py-3 file:px-6 file:min-h-[44px]
                file:rounded-md file:border file:border-input 
                file:text-sm file:font-medium file:cursor-pointer
                file:bg-background file:text-foreground 
                hover:file:bg-accent hover:file:text-accent-foreground
                focus-visible:outline-none focus-visible:ring-2 
                focus-visible:ring-ring focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50"
              accept=".json,.csv,.txt,.zip,.tar.gz,.pkl,.h5,.pt,.pth"
              disabled={uploading}
              aria-describedby={file ? "file-selected" : "file-help"}
              required
            />
            <div id="file-help" className="text-xs text-muted-foreground">
              Maximum file size: 100MB. Supported formats: JSON, CSV, TXT, ZIP, TAR.GZ, PKL, H5, PT, PTH
            </div>
            {file && (
              <div id="file-selected" className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-accent/50 rounded-md">
                <File className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">{file.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {formatFileSize(file.size)}
                </Badge>
              </div>
            )}
          </div>

          {!wallet || !account ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to upload files. Your wallet is used to sign and encrypt your data.
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              onClick={uploadEncryptedFile}
              disabled={!file || uploading}
              className="w-full min-h-[44px] touch-manipulation"
              size="lg"
              type="button"
              aria-describedby="upload-status"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Uploading… {uploadProgress}%
                  <span className="sr-only">Upload in progress, {uploadProgress} percent complete</span>
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
                  Upload Encrypted File
                </>
              )}
            </Button>
          )}

          {uploading && (
            <div className="space-y-2" id="upload-status">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span aria-live="polite">{uploadProgress}%</span>
              </div>
              <Progress 
                value={uploadProgress} 
                className="w-full" 
                aria-label={`Upload progress: ${uploadProgress}%`}
              />
            </div>
          )}

          {error && (
            <Alert 
              variant="destructive" 
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert 
              className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              role="status"
              aria-live="polite"
            >
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" aria-hidden="true" />
              Uploaded Files
              <Badge variant="secondary" className="ml-auto">
                {uploadedFiles.length}
              </Badge>
            </CardTitle>
            <CardDescription>Your encrypted datasets stored on IPFS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" role="list" aria-label="Uploaded files">
              {uploadedFiles.map((f, index) => (
                <div
                  key={`${f.hash}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between 
                           rounded-lg border p-4 gap-4"
                  role="listitem"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                      <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" title={f.name}>
                        {f.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {f.size} • <time dateTime={f.uploadedAt.toISOString()}>
                          {f.uploadedAt.toLocaleString()}
                        </time>
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono">
                          {f.hash?.substring(0, 12) || 'N/A'}…
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(f.hash || '')}
                          className="h-8 px-2 min-h-[32px] touch-manipulation"
                          disabled={!f.hash}
                          aria-label={`Copy hash for ${f.name}`}
                        >
                          <Copy className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">Copy hash</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => f.url && window.open(f.url, "_blank", "noopener,noreferrer")}
                      disabled={!f.url}
                      className="min-h-[32px] touch-manipulation"
                      aria-label={`View ${f.name} on IPFS`}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
                      View
                    </Button>
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => f.decryptUrl && window.open(f.decryptUrl, "_blank", "noopener,noreferrer")}
                      disabled={!f.decryptUrl}
                      className="min-h-[32px] touch-manipulation"
                      aria-label={`Decrypt and view ${f.name}`}
                    >
                      <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
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

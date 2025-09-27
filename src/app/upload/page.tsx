"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, File, Shield, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react";
import lighthouse from "@lighthouse-web3/sdk";

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

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

  // Get API key from environment variables
  const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;

  // Function to sign the authentication message using Wallet
  const signAuthMessage = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length === 0) {
          throw new Error("No accounts returned from Wallet.");
        }
        const signerAddress = accounts[0];
        const { message } = (await lighthouse.getAuthMessage(signerAddress)).data;
        const signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, signerAddress],
        });
        return { signature, signerAddress };
      } catch (error) {
        console.error("Error signing message with Wallet", error);
        return null;
      }
    } else {
      console.log("Please install MetaMask!");
      return null;
    }
  };


  // Function to upload the encrypted file
  const uploadEncryptedFile = async () => {
    if (!file) {
      setError("No file selected.");
      return;
    }

    if (!apiKey) {
      setError("Lighthouse API key not configured. Please set NEXT_PUBLIC_LIGHTHOUSE_API_KEY in your environment variables.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      // This signature is used for authentication with encryption nodes
      const encryptionAuth = await signAuthMessage();
      if (!encryptionAuth) {
        throw new Error("Failed to sign the message. Please connect your wallet.");
      }

      const { signature, signerAddress } = encryptionAuth;

      // Upload file with encryption
      const output = await lighthouse.uploadEncrypted(
        file,
        apiKey,
        signerAddress,
        signature
      );

      console.log("Encrypted File Status:", output);

      if (output && output.data && output.data[0]) {
        const uploadedFile: UploadedFile = {
          hash: output.data[0].Hash,
          name: output.data[0].Name,
          size: output.data[0].Size,
          url: `https://gateway.lighthouse.storage/ipfs/${output.data[0].Hash}`,
          decryptUrl: `https://decrypt.mesh3.network/evm/${output.data[0].Hash}`,
          uploadedAt: new Date(),
        };

        setUploadedFiles(prev => [uploadedFile, ...prev]);
        setSuccess(`File uploaded successfully! Hash: ${output.data[0].Hash}`);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error: any) {
      console.error("Error uploading encrypted file:", error);
      setError(error.message || "Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  // Function to copy hash to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Hash copied to clipboard!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  // Function to format file size
  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8">
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
          {/* File Input */}
          <div className="space-y-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              Select Dataset File
            </label>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              accept=".json,.csv,.txt,.zip,.tar.gz,.pkl,.h5,.pt,.pth"
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <File className="h-4 w-4" />
                <span>{file.name}</span>
                <Badge variant="secondary">{formatFileSize(file.size.toString())}</Badge>
              </div>
            )}
          </div>

          {/* Upload Button */}
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

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Alerts */}
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

      {/* Uploaded Files Section */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Uploaded Files
            </CardTitle>
            <CardDescription>
              Your encrypted datasets stored on IPFS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.uploadedAt.toLocaleString()}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Hash: {file.hash.substring(0, 12)}...
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(file.hash)}
                          className="h-6 px-2"
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
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.decryptUrl, "_blank")}
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

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Select your AI dataset file (supports JSON, CSV, ZIP, PyTorch models, etc.)</p>
          <p>2. Connect your wallet to sign the authentication message</p>
          <p>3. Your file will be encrypted using Kavach encryption SDK</p>
          <p>4. The encrypted file is uploaded to IPFS via Lighthouse</p>
          <p>5. You receive a unique hash that can be used in your smart contracts</p>
        </CardContent>
      </Card>
    </main>
  );
}

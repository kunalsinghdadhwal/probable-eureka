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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  File,
  Shield,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Lock,
  Key,
  Eye,
  Settings,
  Loader2,
} from "lucide-react";

interface UploadedFile {
  hash: string;
  name: string;
  size: string;
  url: string;
  decryptUrl: string;
  uploadedAt: Date;
  hasZkConditions?: boolean;
}

interface ZkCondition {
  id: number;
  method: string;
  returnValueTest: {
    comparator: string;
    value: string;
  };
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [zkConditionsOpen, setZkConditionsOpen] = useState(false);
  const [selectedFileForConditions, setSelectedFileForConditions] =
    useState<UploadedFile | null>(null);
  const [zkConditions, setZkConditions] = useState<ZkCondition[]>([
    {
      id: 1,
      method: "City",
      returnValueTest: { comparator: "==", value: "New York" },
    },
  ]);
  const [applyingConditions, setApplyingConditions] = useState(false);
  const [zkProofDialog, setZkProofDialog] = useState(false);
  const [selectedFileForAccess, setSelectedFileForAccess] =
    useState<UploadedFile | null>(null);
  const [zkProof, setZkProof] = useState("");
  const [verifyingProof, setVerifyingProof] = useState(false);
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

  // Focus management for errors with better UX
  const errorRef = useRef<HTMLDivElement>(null);
  const firstErrorFieldRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    if (success && uploadButtonRef.current) {
      uploadButtonRef.current.focus();
    }
  }, [success]);

  // Keyboard navigation enhancement
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to close dialogs
      if (event.key === "Escape") {
        if (zkConditionsOpen) {
          setZkConditionsOpen(false);
          event.preventDefault();
        } else if (zkProofDialog) {
          setZkProofDialog(false);
          setZkProof("");
          event.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [zkConditionsOpen, zkProofDialog]);

  const signAuthMessage = async () => {
    if (!account) return null;
    try {
      const { data } = await fetch("/api/lighthouse/getAuthMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account.address }),
      }).then((res) => res.json());

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
        if (e.lengthComputable)
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };

      const uploadResult: any = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } else {
            reject(
              new Error(JSON.parse(xhr.responseText).error || "Upload failed")
            );
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
        hasZkConditions: false,
      };

      setUploadedFiles((prev) => [newUploadedFile, ...prev]);
      setSuccess("File uploaded successfully!");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Apply zkTLS conditions to a file
  const applyZkConditions = async () => {
    if (!selectedFileForConditions || !account) return;

    setApplyingConditions(true);
    setError(null);

    try {
      const auth = await signAuthMessage();
      if (!auth) throw new Error("Failed to sign message.");

      const response = await fetch("/api/lighthouse/applyZkConditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cid: selectedFileForConditions.hash,
          address: auth.signerAddress,
          signature: auth.signature,
          conditions: zkConditions,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the file to mark it as having zkTLS conditions
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.hash === selectedFileForConditions.hash
              ? { ...f, hasZkConditions: true }
              : f
          )
        );
        setSuccess("zkTLS conditions applied successfully!");
        setZkConditionsOpen(false);
      } else {
        throw new Error(result.error || "Failed to apply conditions");
      }
    } catch (err: any) {
      console.error("Apply conditions error:", err);
      setError(err.message);
    } finally {
      setApplyingConditions(false);
    }
  };

  // Verify zkTLS proof and decrypt file
  const verifyAndDecrypt = async () => {
    if (!selectedFileForAccess || !account || !zkProof.trim()) return;

    setVerifyingProof(true);
    setError(null);

    try {
      const auth = await signAuthMessage();
      if (!auth) throw new Error("Failed to sign message.");

      let parsedProof;
      try {
        parsedProof = JSON.parse(zkProof);
      } catch {
        throw new Error("Invalid JSON format for proof");
      }

      const response = await fetch("/api/lighthouse/verifyZkAndDecrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cid: selectedFileForAccess.hash,
          address: auth.signerAddress,
          signature: auth.signature,
          proof: parsedProof,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Create a download link for the decrypted file
        const decryptedData = atob(result.decryptedData);
        const blob = new Blob([
          new Uint8Array(decryptedData.split("").map((c) => c.charCodeAt(0))),
        ]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = selectedFileForAccess.name;
        a.click();
        URL.revokeObjectURL(url);

        setSuccess("File decrypted and downloaded successfully!");
        setZkProofDialog(false);
        setZkProof("");
      } else {
        throw new Error(result.error || "Failed to verify proof");
      }
    } catch (err: any) {
      console.error("Verify proof error:", err);
      setError(err.message);
    } finally {
      setVerifyingProof(false);
    }
  };

  // Add new condition
  const addCondition = () => {
    const newId = Math.max(...zkConditions.map((c) => c.id), 0) + 1;
    setZkConditions([
      ...zkConditions,
      {
        id: newId,
        method: "",
        returnValueTest: { comparator: "==", value: "" },
      },
    ]);
  };

  // Update condition
  const updateCondition = (id: number, field: string, value: string) => {
    setZkConditions((prev) =>
      prev.map((condition) => {
        if (condition.id === id) {
          if (field === "method") {
            return { ...condition, method: value };
          } else if (field === "comparator") {
            return {
              ...condition,
              returnValueTest: {
                ...condition.returnValueTest,
                comparator: value,
              },
            };
          } else if (field === "value") {
            return {
              ...condition,
              returnValueTest: { ...condition.returnValueTest, value },
            };
          }
        }
        return condition;
      })
    );
  };

  // Remove condition
  const removeCondition = (id: number) => {
    if (zkConditions.length > 1) {
      setZkConditions((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // File size formatting helper with non-breaking spaces
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0\u00A0Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + "\u00A0" + sizes[i]
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 pt-24">
      {/* Skip to content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                   bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent scroll-mt-24">
          AI Dataset Storage with zkTLS
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Securely upload and control access to your AI datasets using zkTLS
          proofs.
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span>End-to-end encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" />
            <span>zkTLS access control</span>
          </div>
          <div className="flex items-center gap-2">
            <File className="h-4 w-4 text-purple-600" />
            <span>IPFS decentralized storage</span>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-8 bg-black/90 backdrop-blur-md rounded-2xl border border-gray-800/50 shadow-xl shadow-black/30">
        <div className="text-center p-8 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-800/80 to-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-700/50">
            <Upload className="h-8 w-8 text-gray-200 drop-shadow-sm" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100 drop-shadow-md">
            Upload Dataset
          </h2>
          <p className="text-base text-gray-300 mt-2">
            Encrypt and store files on IPFS with zkTLS access control.
          </p>
        </div>
        <div className="px-8 pb-8 space-y-6">
          <div className="space-y-6">
            <div className="text-center">
              <label
                htmlFor="file-upload"
                className="block text-lg font-semibold mb-2 text-gray-100 drop-shadow-sm"
              >
                Select Dataset File
              </label>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <input
                ref={fileInputRef}
                id="file-upload"
                name="dataset-file"
                type="file"
                onChange={handleFileChange}
                className="sr-only"
                style={{
                  WebkitTapHighlightColor: "rgba(59, 130, 246, 0.1)",
                  touchAction: "manipulation",
                }}
                accept=".json,.csv,.txt,.zip,.tar.gz,.pkl,.h5,.pt,.pth"
                disabled={uploading}
                aria-describedby={file ? "file-selected" : "file-help"}
                autoComplete="off"
              />

              <button
                type="button"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 min-h-[48px] touch-manipulation shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700/50"
                style={{
                  WebkitTapHighlightColor: "rgba(59, 130, 246, 0.1)",
                  touchAction: "manipulation",
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-5 w-5" aria-hidden="true" />
                Choose File
              </button>

              <div id="file-help" className="sr-only">
                Upload your dataset file. Supported formats: JSON, CSV, TXT,
                ZIP, PKL, H5, PT, PTH.
              </div>
            </div>

            {file && (
              <div
                id="file-selected"
                className="flex items-center justify-center gap-3 p-4 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg"
                role="status"
                aria-live="polite"
              >
                <File
                  className="h-5 w-5 text-gray-300 drop-shadow-sm"
                  aria-hidden="true"
                />
                <span className="font-medium text-gray-100 drop-shadow-sm">
                  {file.name}
                </span>
                <div className="bg-green-600/80 backdrop-blur-sm text-green-100 px-2 py-1 rounded text-sm font-medium">
                  {formatFileSize(file.size)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!wallet || !account ? (
              <div
                className="bg-amber-600/20 backdrop-blur-sm border border-amber-500/50 rounded-lg p-4"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle
                    className="h-5 w-5 text-amber-300 drop-shadow-sm"
                    aria-hidden="true"
                  />
                  <span className="text-gray-200">
                    Connect your wallet to upload files.
                  </span>
                </div>
              </div>
            ) : (
              <button
                ref={uploadButtonRef}
                onClick={uploadEncryptedFile}
                disabled={!file || uploading}
                className="w-full min-h-[48px] text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 touch-manipulation shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-gray-700/50"
                style={{
                  WebkitTapHighlightColor: "rgba(59, 130, 246, 0.1)",
                  touchAction: "manipulation",
                }}
                type="button"
                aria-describedby={uploading ? "upload-status" : undefined}
              >
                {uploading ? (
                  <>
                    <Loader2
                      className="mr-3 h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    Upload & Encrypt Dataset ({uploadProgress}%)
                    <span className="sr-only">
                      Upload in progress, {uploadProgress} percent complete
                    </span>
                  </>
                ) : (
                  <>
                    <Shield className="mr-3 h-5 w-5" aria-hidden="true" />
                    Upload & Encrypt Dataset
                  </>
                )}
              </button>
            )}

            {uploading && (
              <div
                className="space-y-3 p-4 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg"
                id="upload-status"
                role="status"
                aria-live="polite"
              >
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-200">Upload Progress</span>
                  <span
                    className="text-gray-100 tabular-nums"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {uploadProgress}%
                  </span>
                </div>
                <Progress
                  value={uploadProgress}
                  className="w-full h-2"
                  aria-label={`Upload progress: ${uploadProgress}%`}
                />
                <p className="text-xs text-gray-300 text-center">
                  Encrypting and uploading to IPFS
                </p>
              </div>
            )}
          </div>

          {error && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="polite"
              className="bg-red-900/40 backdrop-blur-sm border border-red-700/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle
                  className="h-5 w-5 text-red-400 drop-shadow-sm"
                  aria-hidden="true"
                />
                <span className="text-gray-200">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div
              className="bg-green-900/40 backdrop-blur-sm border border-green-700/50 rounded-xl p-4"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <CheckCircle
                  className="h-5 w-5 text-green-400 drop-shadow-sm"
                  aria-hidden="true"
                />
                <span className="text-gray-200">{success}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-black/90 backdrop-blur-md rounded-2xl border border-gray-800/50 shadow-xl shadow-black/30">
          <div className="bg-gradient-to-r from-gray-900/90 to-gray-900/60 backdrop-blur-sm rounded-t-2xl p-6 border-b border-gray-800/50">
            <div className="flex items-center gap-3 text-xl mb-2">
              <div className="p-2 bg-gradient-to-br from-gray-800/80 to-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50">
                <File className="h-6 w-6 text-gray-200 drop-shadow-sm" />
              </div>
              <h2 className="font-bold text-gray-100 drop-shadow-md">
                Your Datasets
              </h2>
              <div className="ml-auto bg-gray-800/80 backdrop-blur-sm text-gray-100 px-2 py-1 rounded-lg text-sm font-medium shadow-md border border-gray-700/50">
                {uploadedFiles.length}
              </div>
            </div>
            <p className="text-base text-gray-300">
              Manage encrypted datasets and configure access conditions.
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-4" role="list" aria-label="Uploaded files">
              {uploadedFiles.map((f, index) => (
                <article
                  key={`${f.hash}-${index}`}
                  className="group relative rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 shadow-lg focus-within:ring-2 focus-within:ring-gray-600/50 focus-within:ring-offset-2 focus-within:ring-offset-gray-900"
                  role="listitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-xl backdrop-blur-sm shadow-lg border ${
                          f.hasZkConditions
                            ? "bg-green-800/40 border-green-600/50"
                            : "bg-blue-800/40 border-blue-600/50"
                        }`}
                        aria-hidden="true"
                      >
                        {f.hasZkConditions ? (
                          <Lock className="h-6 w-6 text-green-300 drop-shadow-sm" />
                        ) : (
                          <Shield className="h-6 w-6 text-blue-300 drop-shadow-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-100 drop-shadow-md truncate">
                            {f.name}
                          </h3>
                          {f.hasZkConditions ? (
                            <div className="bg-green-800/40 backdrop-blur-sm text-green-200 border border-green-600/50 px-2 py-1 rounded-md text-sm font-medium shrink-0 shadow-md">
                              <Lock
                                className="h-3 w-3 mr-1 inline"
                                aria-hidden="true"
                              />
                              zkTLS Protected
                            </div>
                          ) : (
                            <div className="bg-blue-800/40 backdrop-blur-sm text-blue-200 border border-blue-600/50 px-2 py-1 rounded-md text-sm font-medium shrink-0 shadow-md">
                              <Shield
                                className="h-3 w-3 mr-1 inline"
                                aria-hidden="true"
                              />
                              Encrypted
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mb-3">
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>
                            {f.size}
                          </span>{" "}
                          •{" "}
                          <time dateTime={f.uploadedAt.toISOString()}>
                            {f.uploadedAt.toLocaleString()}
                          </time>
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="bg-gray-800/60 backdrop-blur-sm text-gray-200 border border-gray-700/50 px-2 py-1 rounded text-xs font-mono break-all shadow-md">
                            CID: {f.hash?.substring(0, 16) || "N/A"}…
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(f.hash || "")}
                            className="h-8 px-3 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 min-h-[44px] touch-manipulation"
                            style={{
                              WebkitTapHighlightColor:
                                "rgba(156, 163, 175, 0.1)",
                              touchAction: "manipulation",
                            }}
                            disabled={!f.hash}
                            aria-label={`Copy hash for ${f.name}`}
                          >
                            <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Button
                        variant={f.hasZkConditions ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedFileForConditions(f);
                          setZkConditionsOpen(true);
                        }}
                        disabled={!account}
                        className={`${
                          f.hasZkConditions
                            ? "bg-green-700 hover:bg-green-800 text-green-100 border border-green-600/50"
                            : "border-blue-600/50 text-blue-300 hover:bg-blue-900/30 hover:border-blue-500/50"
                        } min-h-[44px] touch-manipulation px-4`}
                        style={{
                          WebkitTapHighlightColor: f.hasZkConditions
                            ? "rgba(34, 197, 94, 0.1)"
                            : "rgba(59, 130, 246, 0.1)",
                          touchAction: "manipulation",
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                        {f.hasZkConditions ? "Manage Access" : "Set Access"}
                      </Button>
                      {f.hasZkConditions && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFileForAccess(f);
                            setZkProofDialog(true);
                          }}
                          disabled={!account}
                          className="border-purple-600/50 text-purple-300 hover:bg-purple-900/30 hover:border-purple-500/50 min-h-[44px] touch-manipulation px-4"
                          style={{
                            WebkitTapHighlightColor: "rgba(168, 85, 247, 0.1)",
                            touchAction: "manipulation",
                          }}
                        >
                          <Key className="mr-2 h-4 w-4" aria-hidden="true" />
                          Access File
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          f.url &&
                          window.open(f.url, "_blank", "noopener,noreferrer")
                        }
                        disabled={!f.url}
                        className="text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 min-h-[44px] touch-manipulation px-3"
                        style={{
                          WebkitTapHighlightColor: "rgba(156, 163, 175, 0.1)",
                          touchAction: "manipulation",
                        }}
                        aria-label={`View ${f.name} on IPFS`}
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* zkTLS Conditions Dialog */}
      <Dialog open={zkConditionsOpen} onOpenChange={setZkConditionsOpen}>
        <DialogContent
          className="max-w-4xl max-h-[80vh] overflow-y-auto"
          style={{
            overscrollBehavior: "contain",
          }}
          aria-describedby="zk-conditions-description"
        >
          <DialogHeader className="text-center">
            <div
              className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4"
              aria-hidden="true"
            >
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
            <DialogTitle className="text-2xl">
              Configure Access Conditions
            </DialogTitle>
            <DialogDescription
              id="zk-conditions-description"
              className="text-base"
            >
              Define zero-knowledge proof conditions for file access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Users provide zero-knowledge proofs via Reclaim Protocol
                </li>
                <li>• Only users meeting conditions can decrypt files</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Access Conditions</h3>
                <Badge
                  variant="outline"
                  className="text-purple-600 border-purple-200"
                >
                  {zkConditions.length} condition
                  {zkConditions.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {zkConditions.map((condition, index) => (
                <div
                  key={condition.id}
                  className="border-2 border-gray-200 rounded-xl p-6 bg-white"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Condition #{index + 1}
                    </h4>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                      disabled={zkConditions.length === 1}
                      className="h-8 px-3"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`method-${condition.id}`}
                        className="text-sm font-medium"
                      >
                        Attribute
                      </Label>
                      <Input
                        id={`method-${condition.id}`}
                        name={`method-${condition.id}`}
                        placeholder="e.g., City, Age, Country, EmailDomain…"
                        value={condition.method}
                        onChange={(e) =>
                          updateCondition(
                            condition.id,
                            "method",
                            e.target.value
                          )
                        }
                        className="h-10 min-h-[44px]"
                        autoComplete="off"
                        style={{ fontSize: "16px" }}
                      />
                      <p className="text-xs text-gray-500">
                        The data attribute to verify
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`comparator-${condition.id}`}
                        className="text-sm font-medium"
                      >
                        Operator
                      </Label>
                      <select
                        id={`comparator-${condition.id}`}
                        name={`comparator-${condition.id}`}
                        className="w-full h-10 min-h-[44px] px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent touch-manipulation"
                        style={{
                          fontSize: "16px",
                          WebkitTapHighlightColor: "rgba(168, 85, 247, 0.1)",
                          touchAction: "manipulation",
                        }}
                        value={condition.returnValueTest.comparator}
                        onChange={(e) =>
                          updateCondition(
                            condition.id,
                            "comparator",
                            e.target.value
                          )
                        }
                      >
                        <option value="==">Equals (=)</option>
                        <option value="!=">Not Equals (≠)</option>
                        <option value=">">Greater Than (&gt;)</option>
                        <option value="<">Less Than (&lt;)</option>
                        <option value=">=">Greater or Equal (≥)</option>
                        <option value="<=">Less or Equal (≤)</option>
                      </select>
                      <p className="text-xs text-gray-500">
                        Comparison operator
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`value-${condition.id}`}
                        className="text-sm font-medium"
                      >
                        Expected Value
                      </Label>
                      <Input
                        id={`value-${condition.id}`}
                        name={`value-${condition.id}`}
                        placeholder="e.g., New York, 18, United States…"
                        value={condition.returnValueTest.value}
                        onChange={(e) =>
                          updateCondition(condition.id, "value", e.target.value)
                        }
                        className="h-10 min-h-[44px]"
                        autoComplete="off"
                        style={{ fontSize: "16px" }}
                      />
                      <p className="text-xs text-gray-500">
                        The value to match against
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addCondition}
                className="w-full h-12 min-h-[44px] border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 touch-manipulation"
                style={{
                  WebkitTapHighlightColor: "rgba(168, 85, 247, 0.1)",
                  touchAction: "manipulation",
                }}
              >
                <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
                Add Condition
              </Button>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={applyZkConditions}
                disabled={applyingConditions || !selectedFileForConditions}
                className="flex-1 min-h-[44px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold touch-manipulation"
                style={{
                  WebkitTapHighlightColor: "rgba(168, 85, 247, 0.1)",
                  touchAction: "manipulation",
                }}
              >
                {applyingConditions ? (
                  <>
                    <Loader2
                      className="mr-3 h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    Apply Conditions
                    <span className="sr-only">
                      Applying conditions, please wait
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="mr-3 h-5 w-5" aria-hidden="true" />
                    Apply Conditions
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setZkConditionsOpen(false)}
                className="min-h-[44px] px-6 touch-manipulation"
                style={{
                  WebkitTapHighlightColor: "rgba(156, 163, 175, 0.1)",
                  touchAction: "manipulation",
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* zkTLS Proof Verification Dialog */}
      <Dialog open={zkProofDialog} onOpenChange={setZkProofDialog}>
        <DialogContent
          className="max-w-3xl max-h-[80vh] overflow-y-auto"
          style={{
            overscrollBehavior: "contain",
          }}
          aria-describedby="zk-proof-description"
        >
          <DialogHeader className="text-center">
            <div
              className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
              aria-hidden="true"
            >
              <Key className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Access with Proof</DialogTitle>
            <DialogDescription id="zk-proof-description" className="text-base">
              Provide your zero-knowledge proof to decrypt this file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">
                How to Get Your Proof
              </h4>
              <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                <li>
                  Visit{" "}
                  <a
                    href="https://reclaimprotocol.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Reclaim Protocol
                  </a>
                </li>
                <li>Generate a zero-knowledge proof</li>
                <li>Copy and paste the JSON proof below</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="zkProof" className="text-base font-semibold">
                  zkTLS Proof (JSON)
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  Paste your proof JSON from Reclaim Protocol
                </p>
                <Textarea
                  id="zkProof"
                  name="zkProof"
                  placeholder='{
  "claimData": {
    "provider": "google-login",
    "parameters": {...}
  },
  "signature": "0x...",
  "sessionId": "...",
  "timestamp": 1234567890
}'
                  value={zkProof}
                  onChange={(e) => setZkProof(e.target.value)}
                  rows={12}
                  className="font-mono text-sm border-2 focus:border-green-500 focus:ring-green-500 min-h-[300px]"
                  style={{ fontSize: "16px" }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  JSON should contain claimData, signature, and sessionId
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={verifyAndDecrypt}
                  disabled={
                    verifyingProof || !zkProof.trim() || !selectedFileForAccess
                  }
                  className="flex-1 min-h-[44px] bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold touch-manipulation"
                  style={{
                    WebkitTapHighlightColor: "rgba(34, 197, 94, 0.1)",
                    touchAction: "manipulation",
                  }}
                >
                  {verifyingProof ? (
                    <>
                      <Loader2
                        className="mr-3 h-5 w-5 animate-spin"
                        aria-hidden="true"
                      />
                      Verify & Decrypt
                      <span className="sr-only">
                        Verifying proof and decrypting file, please wait
                      </span>
                    </>
                  ) : (
                    <>
                      <Key className="mr-3 h-5 w-5" aria-hidden="true" />
                      Verify & Decrypt
                    </>
                  )}
                
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setZkProofDialog(false);
                    setZkProof("");
                  }}
                  className="min-h-[44px] px-6 touch-manipulation"
                  style={{
                    WebkitTapHighlightColor: "rgba(156, 163, 175, 0.1)",
                    touchAction: "manipulation",
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

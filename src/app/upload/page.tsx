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
  const [selectedFileForConditions, setSelectedFileForConditions] = useState<UploadedFile | null>(null);
  const [zkConditions, setZkConditions] = useState<ZkCondition[]>([
    { id: 1, method: "City", returnValueTest: { comparator: "==", value: "New York" } }
  ]);
  const [applyingConditions, setApplyingConditions] = useState(false);
  const [zkProofDialog, setZkProofDialog] = useState(false);
  const [selectedFileForAccess, setSelectedFileForAccess] = useState<UploadedFile | null>(null);
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
        hasZkConditions: false,
      };

      setUploadedFiles(prev => [newUploadedFile, ...prev]);
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
        setUploadedFiles(prev => 
          prev.map(f => 
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
        const blob = new Blob([new Uint8Array(decryptedData.split('').map(c => c.charCodeAt(0)))]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
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
    const newId = Math.max(...zkConditions.map(c => c.id), 0) + 1;
    setZkConditions([
      ...zkConditions,
      { id: newId, method: "", returnValueTest: { comparator: "==", value: "" } }
    ]);
  };

  // Update condition
  const updateCondition = (id: number, field: string, value: string) => {
    setZkConditions(prev =>
      prev.map(condition => {
        if (condition.id === id) {
          if (field === 'method') {
            return { ...condition, method: value };
          } else if (field === 'comparator') {
            return { ...condition, returnValueTest: { ...condition.returnValueTest, comparator: value } };
          } else if (field === 'value') {
            return { ...condition, returnValueTest: { ...condition.returnValueTest, value } };
          }
        }
        return condition;
      })
    );
  };

  // Remove condition
  const removeCondition = (id: number) => {
    if (zkConditions.length > 1) {
      setZkConditions(prev => prev.filter(c => c.id !== id));
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent scroll-margin-top-24">
          AI Dataset Storage with zkTLS
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Securely upload, encrypt, and control access to your AI datasets using Lighthouse and zkTLS zero-knowledge proofs
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

      {/* Wallet Connection Section */}
      {!account && (
        <Card className="mb-8 border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-amber-900 mb-2">Connect Your Wallet</h3>
            <p className="text-amber-800 mb-4">
              You need to connect your wallet to upload encrypted files and manage zkTLS access conditions.
            </p>
            <ConnectButton client={client} />
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <Card className="mb-8 border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Upload Encrypted Dataset</CardTitle>
          <CardDescription className="text-base">
            Your files will be encrypted client-side and stored on IPFS via Lighthouse. 
            Add zkTLS conditions for granular access control.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <label htmlFor="file-upload" className="block text-lg font-medium mb-2">
                Select AI Dataset File
              </label>
              <p className="text-sm text-muted-foreground mb-4">
                Supported formats: JSON, CSV, TXT, ZIP, TAR.GZ, PKL, H5, PT, PTH
              </p>
            </div>
            <div className="relative">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-foreground 
                  file:mr-4 file:py-3 file:px-6 file:min-h-[44px]
                  file:rounded-lg file:border-0 file:text-sm file:font-semibold 
                  file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white 
                  hover:file:from-blue-700 hover:file:to-purple-700 file:cursor-pointer
                  cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 text-center
                  hover:border-blue-400 transition-colors
                  focus-visible:outline-none focus-visible:ring-2 
                  focus-visible:ring-ring focus-visible:ring-offset-2
                  disabled:cursor-not-allowed disabled:opacity-50"
                accept=".json,.csv,.txt,.zip,.tar.gz,.pkl,.h5,.pt,.pth"
                disabled={uploading}
                aria-describedby={file ? "file-selected" : "file-help"}
                required
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">Click to select file or drag & drop</p>
                </div>
              </div>
            </div>
            {file && (
              <div id="file-selected" className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <File className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">{file.name}</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {formatFileSize(file.size)}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-4">
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
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-h-[44px] touch-manipulation"
                size="lg"
                type="button"
                aria-describedby="upload-status"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" aria-hidden="true" />
                    Encrypting & Uploading... {uploadProgress}%
                    <span className="sr-only">Upload in progress, {uploadProgress} percent complete</span>
                  </>
                ) : (
                  <>
                    <Shield className="mr-3 h-5 w-5" aria-hidden="true" />
                    Upload & Encrypt Dataset
                  </>
                )}
              </Button>
            )}

            {uploading && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200" id="upload-status">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-blue-800">Encryption & Upload Progress</span>
                  <span className="text-blue-600" aria-live="polite">{uploadProgress}%</span>
                </div>
                <Progress 
                  value={uploadProgress} 
                  className="w-full h-2" 
                  aria-label={`Upload progress: ${uploadProgress}%`}
                />
                <p className="text-xs text-blue-600 text-center">
                  Your file is being encrypted and uploaded to IPFS via Lighthouse
                </p>
              </div>
            )}
          </div>

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
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <File className="h-6 w-6 text-blue-600" />
              </div>
              Your Encrypted Datasets
              <Badge variant="secondary" className="ml-auto">
                {uploadedFiles.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-base">
              Manage your encrypted datasets and configure zkTLS access conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4" role="list" aria-label="Uploaded files">
              {uploadedFiles.map((f, index) => (
                <div
                  key={`${f.hash}-${index}`}
                  className="group relative rounded-xl border-2 p-6 hover:shadow-lg transition-all duration-200 bg-white"
                  role="listitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${f.hasZkConditions ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {f.hasZkConditions ? (
                          <Lock className="h-6 w-6 text-green-600" />
                        ) : (
                          <Shield className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{f.name}</h3>
                          {f.hasZkConditions ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <Lock className="h-3 w-3 mr-1" />
                              zkTLS Protected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Encrypted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {f.size} • <time dateTime={f.uploadedAt.toISOString()}>
                            {f.uploadedAt.toLocaleString()}
                          </time>
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            CID: {f.hash?.substring(0, 16) || 'N/A'}...
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(f.hash || '')}
                            className="h-6 px-2 text-gray-500 hover:text-gray-700 min-h-[32px] touch-manipulation"
                            disabled={!f.hash}
                            aria-label={`Copy hash for ${f.name}`}
                          >
                            <Copy className="h-3 w-3" />
                            <span className="sr-only">Copy hash</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={f.hasZkConditions ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedFileForConditions(f);
                          setZkConditionsOpen(true);
                        }}
                        disabled={!account}
                        className={`${f.hasZkConditions 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                        } min-h-[32px] touch-manipulation`}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {f.hasZkConditions ? "Manage Access" : "Set zkTLS Access"}
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
                          className="border-purple-300 text-purple-600 hover:bg-purple-50 min-h-[32px] touch-manipulation"
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Access File
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => f.url && window.open(f.url, "_blank", "noopener,noreferrer")}
                        disabled={!f.url}
                        className="text-gray-500 hover:text-gray-700 min-h-[32px] touch-manipulation"
                        aria-label={`View ${f.name} on IPFS`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* zkTLS Conditions Dialog */}
      <Dialog open={zkConditionsOpen} onOpenChange={setZkConditionsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
            <DialogTitle className="text-2xl">Configure zkTLS Access Conditions</DialogTitle>
            <DialogDescription className="text-base">
              Define zero-knowledge proof conditions that users must satisfy to access this encrypted file.
              <br />
              <span className="text-sm text-muted-foreground">
                Users will need to provide proofs from Reclaim Protocol to meet these conditions.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How zkTLS Works</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Users generate zero-knowledge proofs using Reclaim Protocol</li>
                <li>• Proofs verify specific attributes without revealing personal data</li>
                <li>• Only users meeting your conditions can decrypt and access the file</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Access Conditions</h3>
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  {zkConditions.length} condition{zkConditions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {zkConditions.map((condition, index) => (
                <div key={condition.id} className="border-2 border-gray-200 rounded-xl p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Condition #{index + 1}</h4>
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
                      <Label className="text-sm font-medium">Attribute</Label>
                      <Input
                        placeholder="e.g., City, Age, Country, EmailDomain"
                        value={condition.method}
                        onChange={(e) => updateCondition(condition.id, 'method', e.target.value)}
                        className="h-10"
                      />
                      <p className="text-xs text-gray-500">The data attribute to verify</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Operator</Label>
                      <select
                        className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={condition.returnValueTest.comparator}
                        onChange={(e) => updateCondition(condition.id, 'comparator', e.target.value)}
                      >
                        <option value="==">Equals (=)</option>
                        <option value="!=">Not Equals (≠)</option>
                        <option value=">">Greater Than (&gt;)</option>
                        <option value="<">Less Than (&lt;)</option>
                        <option value=">=">Greater or Equal (≥)</option>
                        <option value="<=">Less or Equal (≤)</option>
                      </select>
                      <p className="text-xs text-gray-500">Comparison operator</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Expected Value</Label>
                      <Input
                        placeholder="e.g., New York, 18, United States"
                        value={condition.returnValueTest.value}
                        onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                        className="h-10"
                      />
                      <p className="text-xs text-gray-500">The value to match against</p>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addCondition}
                className="w-full h-12 border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
              >
                <Lock className="mr-2 h-4 w-4" />
                Add Another Condition
              </Button>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={applyZkConditions}
                disabled={applyingConditions || !selectedFileForConditions}
                className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              >
                {applyingConditions ? (
                  <>
                    <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Applying zkTLS Conditions...
                  </>
                ) : (
                  <>
                    <Lock className="mr-3 h-5 w-5" />
                    Apply zkTLS Conditions
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setZkConditionsOpen(false)}
                className="h-12 px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* zkTLS Proof Verification Dialog */}
      <Dialog open={zkProofDialog} onOpenChange={setZkProofDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Access File with zkTLS Proof</DialogTitle>
            <DialogDescription className="text-base">
              Provide your zero-knowledge proof from Reclaim Protocol to decrypt and access this file.
              <br />
              <span className="text-sm text-muted-foreground">
                Your proof will be verified against the access conditions set by the file owner.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">How to Get Your Proof</h4>
              <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                <li>Visit <a href="https://reclaimprotocol.org" target="_blank" rel="noopener noreferrer" className="underline">Reclaim Protocol</a> to generate your proof</li>
                <li>Connect your wallet and select the required data sources</li>
                <li>Generate a zero-knowledge proof for the required attributes</li>
                <li>Copy the JSON proof and paste it below</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="zkProof" className="text-base font-semibold">
                  zkTLS Proof (JSON Format)
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  Paste your complete proof JSON from Reclaim Protocol
                </p>
                <Textarea
                  id="zkProof"
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
                  className="font-mono text-sm border-2 focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The proof should contain claimData, signature, and sessionId fields
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={verifyAndDecrypt}
                  disabled={verifyingProof || !zkProof.trim() || !selectedFileForAccess}
                  className="flex-1 h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
                >
                  {verifyingProof ? (
                    <>
                      <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying Proof & Decrypting...
                    </>
                  ) : (
                    <>
                      <Key className="mr-3 h-5 w-5" />
                      Verify Proof & Decrypt File
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setZkProofDialog(false);
                    setZkProof("");
                  }}
                  className="h-12 px-6"
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
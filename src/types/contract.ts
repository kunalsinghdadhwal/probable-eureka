export interface VerificationData {
    lighthouseHash: string;
    datasetSize: number;
    trainingEpochs: number;
    accuracy: number;
    timestamp: number;
    dataHash: string;
}

export interface NodeSignature {
    nodeAddress: string;
    signature: string;
}

export interface CreatorVerificationStatus {
    isVerified: boolean;
    verificationTime: number;
    isExpired: boolean;
    canCreateNFT: boolean;
}
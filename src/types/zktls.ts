export interface ZkTLSProof {
    identifier: string;
    claimData: {
        provider: string;
        parameters: string;
        owner: string;
        timestampS: number;
        context: string;
        contextAddress: string;
        contextMessage: string;
        epoch: number;
    };
    signatures: Array<{
        signature: string;
        identifier: string;
    }>;
    witnesses: Array<{
        id: string;
        url: string;
    }>;
}

export interface AgentVerificationData {
    lighthouseHash: string;
    datasetSize: number;
    trainingEpochs: number;
    accuracy: number;
    modelType: string;
    creator: string;
    timestamp: number;
}

export interface VerificationResult {
    isVerified: boolean;
    agentData?: AgentVerificationData;
    error?: string;
    decryptionKey?: string;
}
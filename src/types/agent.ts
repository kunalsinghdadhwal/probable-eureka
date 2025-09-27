export interface AgentParams {
    name: string;
    description: string;
    lighthouseHash: string;
    agentType: string;
    datasetSize: number;
    trainingEpochs: number;
    accuracy: number;
    maxSupply: number;
    mintPrice: string;
    allowPublicMint: boolean;
}

export interface AgentCreationResult {
    transactionHash: string;
    tokenId: string;
    creatorAddress: string;
    agentName: string;
    blockNumber: number;
    gasUsed: string;
}
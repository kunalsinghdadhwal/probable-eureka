import { toEther, toWei } from 'thirdweb';
import { AgentParams, AgentData } from './aiAgentNFT';

/**
 * Format wei to ETH with specified decimals
 */
export const formatEther = (wei: bigint | string, decimals: number = 4): string => {
    const ethValue = toEther(BigInt(wei.toString()));
    return parseFloat(ethValue).toFixed(decimals);
};

/**
 * Parse ETH to wei
 */
export const parseEther = (eth: string): bigint => {
    return toWei(eth);
};

/**
 * Format accuracy percentage (from contract's basis points)
 */
export const formatAccuracy = (accuracy: bigint): string => {
    // Contract stores accuracy as basis points (e.g., 8500 = 85%)
    const percentage = Number(accuracy) / 100;
    return `${percentage}%`;
};

/**
 * Parse accuracy percentage to basis points for contract
 */
export const parseAccuracy = (percentage: number): bigint => {
    // Convert percentage to basis points (e.g., 85% = 8500)
    return BigInt(Math.round(percentage * 100));
};

/**
 * Format large numbers with commas
 */
export const formatNumber = (num: bigint | number): string => {
    return num.toLocaleString();
};

/**
 * Format dataset size with appropriate units
 */
export const formatDatasetSize = (size: bigint): string => {
    const sizeNum = Number(size);
    if (sizeNum >= 1000000000) {
        return `${(sizeNum / 1000000000).toFixed(1)}B`;
    } else if (sizeNum >= 1000000) {
        return `${(sizeNum / 1000000).toFixed(1)}M`;
    } else if (sizeNum >= 1000) {
        return `${(sizeNum / 1000).toFixed(1)}K`;
    }
    return sizeNum.toString();
};

/**
 * Format timestamp to readable date
 */
export const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Validate agent parameters before creating
 */
export const validateAgentParams = (params: AgentParams): string[] => {
    const errors: string[] = [];

    if (!params.name || params.name.trim().length === 0) {
        errors.push('Agent name is required');
    }

    if (!params.description || params.description.trim().length === 0) {
        errors.push('Agent description is required');
    }

    if (!params.lighthouseHash || params.lighthouseHash.trim().length === 0) {
        errors.push('Lighthouse hash is required');
    }

    if (!params.agentType || params.agentType.trim().length === 0) {
        errors.push('Agent type is required');
    }

    if (params.datasetSize <= BigInt(0)) {
        errors.push('Dataset size must be greater than 0');
    }

    if (params.trainingEpochs <= BigInt(0)) {
        errors.push('Training epochs must be greater than 0');
    }

    if (params.accuracy <= BigInt(0) || params.accuracy > BigInt(10000)) {
        errors.push('Accuracy must be between 0.01% and 100%');
    }

    if (params.maxSupply <= BigInt(0)) {
        errors.push('Max supply must be greater than 0');
    }

    if (params.mintPrice < BigInt(0)) {
        errors.push('Mint price cannot be negative');
    }

    return errors;
};

/**
 * Create agent parameters from form data
 */
export const createAgentParams = (formData: {
    name: string;
    description: string;
    lighthouseHash: string;
    agentType: string;
    datasetSize: number;
    trainingEpochs: number;
    accuracy: number; // percentage (e.g., 85 for 85%)
    maxSupply: number;
    mintPrice: string; // ETH amount as string
    allowPublicMint: boolean;
    initialMint?: number; // Optional initial mint amount
}): AgentParams => {
    return {
        name: formData.name.trim(),
        description: formData.description.trim(),
        lighthouseHash: formData.lighthouseHash.trim(),
        agentType: formData.agentType.trim(),
        datasetSize: BigInt(formData.datasetSize),
        trainingEpochs: BigInt(formData.trainingEpochs),
        accuracy: parseAccuracy(formData.accuracy),
        maxSupply: BigInt(formData.maxSupply),
        mintPrice: parseEther(formData.mintPrice),
        allowPublicMint: formData.allowPublicMint,
        initialMint: formData.initialMint ? BigInt(formData.initialMint) : BigInt(0),
    };
};

/**
 * Calculate the percentage of minted tokens
 */
export const calculateMintedPercentage = (agentData: AgentData): number => {
    const current = Number(agentData.minting.currentSupply);
    const max = Number(agentData.minting.maxSupply);
    return max > 0 ? (current / max) * 100 : 0;
};

/**
 * Calculate remaining supply
 */
export const calculateRemainingSupply = (agentData: AgentData): bigint => {
    return agentData.minting.maxSupply - agentData.minting.currentSupply;
};

/**
 * Check if agent can be minted
 */
export const canMintAgent = (agentData: AgentData, requestedAmount: number = 1): boolean => {
    if (!agentData.minting.isActive) return false;
    if (!agentData.minting.allowPublicMint) return false;

    const remaining = calculateRemainingSupply(agentData);
    return remaining >= BigInt(requestedAmount);
};

/**
 * Get agent type display name and color
 */
export const getAgentTypeInfo = (agentType: string) => {
    const types: Record<string, { displayName: string; color: string; bgColor: string }> = {
        'classification': {
            displayName: 'Classification',
            color: 'text-blue-700',
            bgColor: 'bg-blue-100'
        },
        'regression': {
            displayName: 'Regression',
            color: 'text-green-700',
            bgColor: 'bg-green-100'
        },
        'nlp': {
            displayName: 'NLP',
            color: 'text-purple-700',
            bgColor: 'bg-purple-100'
        },
        'computer-vision': {
            displayName: 'Computer Vision',
            color: 'text-orange-700',
            bgColor: 'bg-orange-100'
        },
        'reinforcement-learning': {
            displayName: 'Reinforcement Learning',
            color: 'text-red-700',
            bgColor: 'bg-red-100'
        },
        'other': {
            displayName: 'Other',
            color: 'text-gray-700',
            bgColor: 'bg-gray-100'
        },
    };

    return types[agentType.toLowerCase()] || types['other'];
};

/**
 * Truncate address for display
 */
export const truncateAddress = (address: string, startLength: number = 6, endLength: number = 4): string => {
    if (!address) return '';
    if (address.length <= startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};

/**
 * Generate Etherscan URL for transaction
 */
export const getEtherscanUrl = (txHash: string): string => {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
};

/**
 * Generate Etherscan URL for address
 */
export const getEtherscanAddressUrl = (address: string): string => {
    return `https://sepolia.etherscan.io/address/${address}`;
};

/**
 * Generate OpenSea URL for NFT
 */
export const getOpenSeaUrl = (contractAddress: string, tokenId: string): string => {
    return `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${tokenId}`;
};
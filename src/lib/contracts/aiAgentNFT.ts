// Deployed contract addresses on Sepolia testnet
export const CONTRACT_ADDRESSES = {
    AIAgentBatchNFT: '0x3Adcdf52260fEbe0776B02ab031A3A68Cae50592',
    AgentStorage: '0xE39E63dF14B1b916A8aC1c777D956865BBD87218'
} as const;

// Sepolia testnet chain ID
export const CHAIN_ID = 11155111;

// Contract ABI for AIAgentBatchNFT
export const AI_AGENT_BATCH_NFT_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_storageContract",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            }
        ],
        "name": "AgentCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "minter",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "AgentMinted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            }
        ],
        "name": "AgentStatusToggled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "description",
                "type": "string"
            }
        ],
        "name": "AgentUpdated",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "agentStorage",
        "outputs": [
            {
                "internalType": "contract AgentStorage",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "accounts",
                "type": "address[]"
            },
            {
                "internalType": "uint256[]",
                "name": "ids",
                "type": "uint256[]"
            }
        ],
        "name": "balanceOfBatch",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "baseURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "lighthouseHash",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "agentType",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "datasetSize",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "trainingEpochs",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "accuracy",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxSupply",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "mintPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "allowPublicMint",
                        "type": "bool"
                    }
                ],
                "internalType": "struct AgentDataLib.AgentParams[]",
                "name": "params",
                "type": "tuple[]"
            },
            {
                "internalType": "uint256[]",
                "name": "initialMints",
                "type": "uint256[]"
            }
        ],
        "name": "batchCreateAgents",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "tokenIds",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "amounts",
                "type": "uint256[]"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            }
        ],
        "name": "batchMintAgents",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "lighthouseHash",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "agentType",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "datasetSize",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "trainingEpochs",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "accuracy",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxSupply",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "mintPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "allowPublicMint",
                        "type": "bool"
                    }
                ],
                "internalType": "struct AgentDataLib.AgentParams",
                "name": "params",
                "type": "tuple"
            },
            {
                "internalType": "uint256",
                "name": "initialMint",
                "type": "uint256"
            }
        ],
        "name": "createAgent",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "getAgent",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "lighthouseHash",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "agentType",
                        "type": "string"
                    },
                    {
                        "internalType": "address",
                        "name": "creator",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "createdAt",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct AgentDataLib.AgentCore",
                "name": "core",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "datasetSize",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "trainingEpochs",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "accuracy",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct AgentDataLib.AgentMetrics",
                "name": "metrics",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "maxSupply",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "currentSupply",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "mintPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "allowPublicMint",
                        "type": "bool"
                    }
                ],
                "internalType": "struct AgentDataLib.AgentMinting",
                "name": "minting",
                "type": "tuple"
            },
            {
                "internalType": "string[]",
                "name": "tags",
                "type": "string[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "creator",
                "type": "address"
            }
        ],
        "name": "getAgentsByCreator",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            }
        ],
        "name": "isApprovedForAll",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "hash",
                "type": "string"
            }
        ],
        "name": "isHashUsed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxBatchSize",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            }
        ],
        "name": "mintAgent",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "mintingFee",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "mintingPaused",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalAgentTypes",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "toggleAgentStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "uri",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "mintPrice",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "allowPublicMint",
                "type": "bool"
            }
        ],
        "name": "updateAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "string[]",
                "name": "tags",
                "type": "string[]"
            }
        ],
        "name": "setAgentTags",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

// Type definitions for contract interaction
export interface AgentParams {
    name: string;
    description: string;
    lighthouseHash: string;
    agentType: string;
    datasetSize: bigint;
    trainingEpochs: bigint;
    accuracy: bigint;
    maxSupply: bigint;
    mintPrice: bigint;
    allowPublicMint: boolean;
    initialMint?: bigint; // Optional initial mint amount
}

export interface AgentCore {
    name: string;
    description: string;
    lighthouseHash: string;
    agentType: string;
    creator: string;
    createdAt: bigint;
}

export interface AgentMetrics {
    datasetSize: bigint;
    trainingEpochs: bigint;
    accuracy: bigint;
}

export interface AgentMinting {
    maxSupply: bigint;
    currentSupply: bigint;
    mintPrice: bigint;
    isActive: boolean;
    allowPublicMint: boolean;
}

export interface AgentData {
    core: AgentCore;
    metrics: AgentMetrics;
    minting: AgentMinting;
    tags: string[];
}
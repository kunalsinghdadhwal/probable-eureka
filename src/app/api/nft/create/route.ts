import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

// Contract ABI
const contractABI = [
    "function createAgent(tuple(string name, string description, string lighthouseHash, string agentType, uint256 datasetSize, uint256 trainingEpochs, uint256 accuracy, uint256 maxSupply, uint256 mintPrice, bool allowPublicMint) params, uint256 initialMint) external payable returns (uint256)",
    "function isCreatorVerified(address creator) external view returns (bool)",
    "function mintingFee() external view returns (uint256)",
    "event AgentCreated(uint256 indexed tokenId, address indexed creator, string name)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

interface NFTCreationRequest {
    creatorAddress: string;
    agentParams: {
        name: string;
        description: string;
        lighthouseHash: string;
        agentType: string;
        datasetSize: number;
        trainingEpochs: number;
        accuracy: number;
        maxSupply: number;
        mintPrice: string; // in wei
        allowPublicMint: boolean;
    };
    initialMint: number;
    mintingFee: string; // in wei
}

/**
 * POST /api/nft/create
 * Create NFT after zkTLS verification
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { creatorAddress, agentParams, initialMint, mintingFee }: NFTCreationRequest = body;

        // Validate creator is verified
        const isVerified = await contract.isCreatorVerified(creatorAddress);
        if (!isVerified) {
            return NextResponse.json({
                success: false,
                error: 'Creator not verified or verification expired'
            }, { status: 403 });
        }

        // Validate agent parameters
        if (!agentParams.name || !agentParams.lighthouseHash) {
            return NextResponse.json({
                success: false,
                error: 'Missing required agent parameters'
            }, { status: 400 });
        }

        if (agentParams.accuracy > 10000) {
            return NextResponse.json({
                success: false,
                error: 'Invalid accuracy (max 10000 for 100%)'
            }, { status: 400 });
        }

        // Create agent NFT
        const tx = await contract.createAgent(
            agentParams,
            initialMint,
            {
                value: mintingFee
            }
        );

        const receipt = await tx.wait();

        // Extract token ID from events
        const agentCreatedEvent = receipt.logs.find((log: any) =>
            log.topics[0] === ethers.id('AgentCreated(uint256,address,string)')
        );

        let tokenId = null;
        if (agentCreatedEvent) {
            const parsedLog = contract.interface.parseLog({
                topics: agentCreatedEvent.topics,
                data: agentCreatedEvent.data
            });
            tokenId = parsedLog?.args?.tokenId?.toString();
        }

        return NextResponse.json({
            success: true,
            data: {
                transactionHash: receipt.hash,
                tokenId: tokenId,
                creatorAddress,
                agentName: agentParams.name,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            }
        });

    } catch (error: any) {
        console.error('NFT creation error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}

/**
 * GET /api/nft/contract-info
 * Get contract information
 */
export async function GET() {
    try {
        const mintingFee = await contract.mintingFee();

        return NextResponse.json({
            success: true,
            data: {
                contractAddress: CONTRACT_ADDRESS,
                mintingFee: mintingFee.toString()
            }
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to get contract info'
        }, { status: 500 });
    }
}
/ src/app / api / zktls / route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { ZkTLSVerificationService, type AgentVerificationData, type ZkTLSProof } from '@/services/zkTLSVerificationService';

// Initialize services
const zkTLSService = new ZkTLSVerificationService();

// Environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

// Contract ABI (relevant functions only)
const contractABI = [
    "function verifyCreatorWithZkTLS(tuple(string lighthouseHash, uint256 datasetSize, uint256 trainingEpochs, uint256 accuracy, uint256 timestamp, bytes32 dataHash) verificationData, tuple(address nodeAddress, bytes signature)[] nodeSignatures) external",
    "function isCreatorVerified(address creator) external view returns (bool)",
    "function getCreatorVerificationStatus(address creator) external view returns (bool isVerified, uint256 verificationTime, bool isExpired)",
    "function createAgent(tuple(string name, string description, string lighthouseHash, string agentType, uint256 datasetSize, uint256 trainingEpochs, uint256 accuracy, uint256 maxSupply, uint256 mintPrice, bool allowPublicMint) params, uint256 initialMint) external payable returns (uint256)",
    "event CreatorVerified(address indexed creator, string lighthouseHash, uint256 timestamp)"
];

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

// Trusted Lighthouse node addresses
const TRUSTED_LIGHTHOUSE_NODES = [
    process.env.LIGHTHOUSE_NODE_1 || '',
    process.env.LIGHTHOUSE_NODE_2 || '',
    process.env.LIGHTHOUSE_NODE_3 || '',
    process.env.LIGHTHOUSE_NODE_4 || '',
    process.env.LIGHTHOUSE_NODE_5 || ''
].filter(addr => addr !== '');

interface VerificationRequest {
    creatorAddress: string;
    lighthouseHash: string;
    zkTLSProof: ZkTLSProof;
}

interface CreatorStatusRequest {
    address: string;
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * POST /api/zktls
 * Verify creator using zkTLS proof and mark as verified on-chain
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
    try {
        const body = await request.json();
        const { creatorAddress, lighthouseHash, zkTLSProof }: VerificationRequest = body;

        // Input validation
        if (!creatorAddress || !lighthouseHash || !zkTLSProof) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: creatorAddress, lighthouseHash, and zkTLSProof are required'
            }, { status: 400 });
        }

        if (!ethers.isAddress(creatorAddress)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid Ethereum address format'
            }, { status: 400 });
        }

        // Validate Lighthouse hash format
        if (!lighthouseHash.startsWith('bafkrei') || lighthouseHash.length < 10) {
            return NextResponse.json({
                success: false,
                error: 'Invalid Lighthouse hash format'
            }, { status: 400 });
        }

        // Check if creator is already verified
        try {
            const isAlreadyVerified = await contract.isCreatorVerified(creatorAddress);
            if (isAlreadyVerified) {
                return NextResponse.json({
                    success: false,
                    error: 'Creator is already verified'
                }, { status: 409 });
            }
        } catch (contractError) {
            console.error('Contract call failed:', contractError);
            return NextResponse.json({
                success: false,
                error: 'Failed to check existing verification status'
            }, { status: 500 });
        }

        // Step 1: Verify zkTLS proof with Lighthouse
        console.log('Verifying zkTLS proof for creator:', creatorAddress);
        const verificationResult = await zkTLSService.verifyAgentCreatorProof(
            lighthouseHash,
            creatorAddress,
            PRIVATE_KEY,
            zkTLSProof
        );

        if (!verificationResult.isVerified || !verificationResult.agentData) {
            console.error('zkTLS verification failed:', verificationResult.error);
            return NextResponse.json({
                success: false,
                error: verificationResult.error || 'zkTLS verification failed'
            }, { status: 400 });
        }

        // Step 2: Generate signatures from trusted Lighthouse nodes
        console.log('Generating node signatures...');
        const nodeSignatures = await generateLighthouseNodeSignatures(
            creatorAddress,
            verificationResult.agentData
        );

        if (nodeSignatures.length < 3) {
            console.error('Insufficient node signatures:', nodeSignatures.length);
            return NextResponse.json({
                success: false,
                error: `Insufficient node signatures: got ${nodeSignatures.length}, need at least 3`
            }, { status: 500 });
        }

        // Step 3: Prepare verification data for smart contract
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const verificationData = {
            lighthouseHash: verificationResult.agentData.lighthouseHash,
            datasetSize: verificationResult.agentData.datasetSize,
            trainingEpochs: verificationResult.agentData.trainingEpochs,
            accuracy: verificationResult.agentData.accuracy,
            timestamp: currentTimestamp,
            dataHash: ethers.keccak256(
                ethers.toUtf8Bytes(JSON.stringify(verificationResult.agentData))
            )
        };

        // Step 4: Submit verification to smart contract
        console.log('Submitting verification to smart contract...');
        try {
            const tx = await contract.verifyCreatorWithZkTLS(
                verificationData,
                nodeSignatures,
                {
                    gasLimit: 500000 // Set appropriate gas limit
                }
            );

            console.log('Transaction submitted:', tx.hash);
            const receipt = await tx.wait();
            console.log('Transaction confirmed in block:', receipt.blockNumber);

            // Extract CreatorVerified event
            const verifiedEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed?.name === 'CreatorVerified';
                } catch {
                    return false;
                }
            });

            return NextResponse.json({
                success: true,
                data: {
                    transactionHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    creatorAddress,
                    lighthouseHash,
                    verificationTimestamp: currentTimestamp,
                    agentData: {
                        datasetSize: verificationResult.agentData.datasetSize,
                        trainingEpochs: verificationResult.agentData.trainingEpochs,
                        accuracy: verificationResult.agentData.accuracy,
                        modelType: verificationResult.agentData.modelType
                    },
                    eventFound: !!verifiedEvent
                }
            });

        } catch (contractError: any) {
            console.error('Smart contract call failed:', contractError);

            // Parse contract revert reasons
            let errorMessage = 'Smart contract verification failed';
            if (contractError.reason) {
                errorMessage = contractError.reason;
            } else if (contractError.message?.includes('revert')) {
                const match = contractError.message.match(/revert (.+?)'/);
                if (match) errorMessage = match[1];
            }

            return NextResponse.json({
                success: false,
                error: errorMessage
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('zkTLS verification error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error during verification'
        }, { status: 500 });
    }
}

/**
 * GET /api/zktls?address=0x...
 * Check creator verification status
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({
                success: false,
                error: 'Address parameter is required'
            }, { status: 400 });
        }

        if (!ethers.isAddress(address)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid Ethereum address format'
            }, { status: 400 });
        }

        try {
            // Get detailed verification status from contract
            const [isVerified, verificationTime, isExpired] = await contract.getCreatorVerificationStatus(address);

            // Get additional verification data if available
            const canCreateNFT = isVerified && !isExpired;

            return NextResponse.json({
                success: true,
                data: {
                    address,
                    isVerified,
                    verificationTime: verificationTime.toString(),
                    isExpired,
                    canCreateNFT,
                    timeRemaining: canCreateNFT ? calculateTimeRemaining(verificationTime) : null
                }
            });

        } catch (contractError: any) {
            console.error('Failed to get verification status:', contractError);
            return NextResponse.json({
                success: false,
                error: 'Failed to retrieve verification status from contract'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Status check error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}

/**
 * Helper function to generate signatures from trusted Lighthouse nodes
 * In production, this would communicate with actual Lighthouse nodes
 */
async function generateLighthouseNodeSignatures(
    creatorAddress: string,
    agentData: AgentVerificationData
): Promise<Array<{ nodeAddress: string; signature: string }>> {
    const signatures: Array<{ nodeAddress: string; signature: string }> = [];

    try {
        // Create message hash for signing
        const messageHash = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'string', 'uint256', 'uint256', 'uint256', 'uint256'],
                [
                    creatorAddress,
                    agentData.lighthouseHash,
                    agentData.datasetSize,
                    agentData.trainingEpochs,
                    agentData.accuracy,
                    Math.floor(Date.now() / 1000)
                ]
            )
        );

        // In production, you would make HTTP requests to actual Lighthouse nodes
        // For development/testing, we'll simulate the node signatures
        const requiredSignatures = Math.min(TRUSTED_LIGHTHOUSE_NODES.length, 5);

        for (let i = 0; i < requiredSignatures; i++) {
            const nodeAddress = TRUSTED_LIGHTHOUSE_NODES[i];
            if (!nodeAddress) continue;

            try {
                // In production: const signature = await requestSignatureFromNode(nodeAddress, messageHash);
                // For development: simulate node signature
                const mockNodeWallet = new ethers.Wallet(
                    ethers.keccak256(ethers.toUtf8Bytes(`node-${i}-${nodeAddress}`))
                );
                const signature = await mockNodeWallet.signMessage(ethers.getBytes(messageHash));

                signatures.push({
                    nodeAddress: nodeAddress,
                    signature: signature
                });
            } catch (nodeError) {
                console.error(`Failed to get signature from node ${nodeAddress}:`, nodeError);
                // Continue with other nodes
            }
        }

        console.log(`Generated ${signatures.length} node signatures`);
        return signatures;

    } catch (error) {
        console.error('Error generating node signatures:', error);
        throw new Error('Failed to generate required node signatures');
    }
}

/**
 * Calculate time remaining until verification expires
 */
function calculateTimeRemaining(verificationTimestamp: any): string {
    const verificationTime = Number(verificationTimestamp);
    const expiryDuration = 30 * 24 * 60 * 60; // 30 days in seconds
    const expiryTime = verificationTime + expiryDuration;
    const currentTime = Math.floor(Date.now() / 1000);
    const remaining = expiryTime - currentTime;

    if (remaining <= 0) return 'Expired';

    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(remaining / 60)}m`;
}

/**
 * In production, this function would make actual HTTP requests to Lighthouse nodes
 * to request signatures for the verification data
 */
async function requestSignatureFromNode(
    nodeUrl: string,
    messageHash: string
): Promise<string> {
    // This is where you'd implement the actual node communication
    // Example:
    // const response = await fetch(`${nodeUrl}/sign`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ messageHash })
    // });
    // const data = await response.json();
    // return data.signature;

    throw new Error('Production node communication not implemented');
}
import { useState, useCallback } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { readContract, prepareContractCall, getContract, toWei, toEther, getRpcClient } from 'thirdweb';
import { sepolia } from 'thirdweb/chains';
import { client } from '@/lib/client';
import { AI_AGENT_BATCH_NFT_ABI, CONTRACT_ADDRESSES, AgentParams } from './aiAgentNFT';

export const useAIAgentContract = () => {
    const account = useActiveAccount();
    const { mutateAsync: sendTransaction } = useSendTransaction();
    const [transactionLoading, setTransactionLoading] = useState(false);

    const isConnected = !!account;
    const accountAddress = account?.address || '';

    // Get the thirdweb contract instance
    const contract = getContract({
        client,
        chain: sepolia,
        address: CONTRACT_ADDRESSES.AIAgentBatchNFT,
        abi: AI_AGENT_BATCH_NFT_ABI,
    });

    const createAgent = useCallback(async (params: AgentParams) => {
        if (!isConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            setTransactionLoading(true);

            // Calculate the value to send if there's an initial mint
            const initialMint = params.initialMint || BigInt(0);
            // params.mintPrice is already in wei from createAgentParams, don't convert again!
            const mintPrice = params.mintPrice;
            const valueToSend = initialMint > 0 ? mintPrice * initialMint : BigInt(0);
            
            console.log('Creating agent with params:', {
                name: params.name,
                initialMint: initialMint.toString(),
                mintPrice: params.mintPrice,
                valueToSend: valueToSend.toString()
            });

            // Prepare the transaction - let thirdweb handle gas estimation automatically
            const transaction = prepareContractCall({
                contract,
                method: 'createAgent',
                params: [{
                    name: params.name,
                    description: params.description,
                    lighthouseHash: params.lighthouseHash,
                    agentType: params.agentType,
                    datasetSize: BigInt(params.datasetSize),
                    trainingEpochs: BigInt(params.trainingEpochs),
                    accuracy: BigInt(params.accuracy),
                    maxSupply: BigInt(params.maxSupply),
                    mintPrice: mintPrice,
                    allowPublicMint: params.allowPublicMint
                }, initialMint],
                ...(valueToSend > 0 && { value: valueToSend }), // Only include value if needed
                // Removed explicit gas and gasPrice - let thirdweb estimate automatically
            });

            // Send transaction and wait for confirmation
            const result = await sendTransaction(transaction);
            
            // Log transaction details for debugging
            console.log('Agent creation transaction sent:', {
                hash: result.transactionHash,
                chain: result.chain?.name || 'Sepolia'
            });
            
            // Store transaction hash for user reference
            const txHash = result.transactionHash;
            const etherscanUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
            console.log(`Transaction pending at: ${etherscanUrl}`);
            
            return {
                ...result,
                etherscanUrl,
                message: `Agent creation transaction submitted! Track progress at: ${etherscanUrl}`
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Create agent error:', error);
            
            // Enhanced error analysis for contract-specific issues
            if (errorMessage?.includes('execution reverted')) {
                // This suggests the contract rejected the transaction
                console.error('Contract execution reverted. This may be due to:');
                console.error('1. Contract validation rules not met');
                console.error('2. Insufficient contract permissions');
                console.error('3. Invalid parameters passed to contract');
                throw new Error('Contract rejected the transaction. This may be due to invalid parameters or contract rules. Please check your input values and try again.');
            }
            
            // Provide more user-friendly error messages
            if (errorMessage?.includes('Insufficient fee') || errorMessage?.includes('insufficient funds for gas') || errorMessage?.includes('insufficient funds for intrinsic transaction cost')) {
                throw new Error('Insufficient ETH for gas fees. You need at least 0.02 ETH in your wallet for Sepolia testnet transactions. Please add Sepolia ETH from a faucet like https://sepoliafaucet.com/');
            }
            if (errorMessage?.includes('insufficient funds')) {
                throw new Error('Insufficient funds in your wallet. Please add more Sepolia ETH to continue.');
            }
            if (errorMessage?.includes('gas required exceeds allowance') || errorMessage?.includes('out of gas')) {
                throw new Error('Transaction requires more gas than allowed. Please try again with automatic gas estimation.');
            }
            if (errorMessage?.includes('user rejected') || errorMessage?.includes('User denied')) {
                throw new Error('Transaction was rejected. Please approve the transaction in your wallet to continue.');
            }
            
            // Thirdweb-specific error handling
            if (errorMessage?.includes('thirdweb') || errorMessage?.includes('ThirdwebError')) {
                throw new Error(`Thirdweb SDK error: ${errorMessage}. Try refreshing the page and connecting your wallet again.`);
            }
            
            // Log the full error for debugging
            console.error('Full transaction error details:', {
                message: errorMessage,
                error: error,
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });
            throw new Error(`Transaction failed: ${errorMessage}`);   
        } finally {
            setTransactionLoading(false);
        }
    }, [isConnected, sendTransaction, contract]);

    const mintAgent = useCallback(async (agentId: string, amount: number, mintPrice: string) => {
        if (!isConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            setTransactionLoading(true);

            const totalPrice = toWei(mintPrice) * BigInt(amount);
            
            // Prepare the transaction - let thirdweb handle gas estimation automatically
            const transaction = prepareContractCall({
                contract,
                method: 'mintAgent',
                params: [BigInt(agentId), BigInt(amount), accountAddress],
                value: totalPrice,
                // Removed explicit gas and gasPrice - let thirdweb estimate automatically
            });

            // Send transaction and wait for confirmation
            const result = await sendTransaction(transaction);
            
            // Log transaction details for debugging
            const txHash = result.transactionHash;
            const etherscanUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
            console.log(`Mint transaction sent: ${txHash}`);
            console.log(`Track at: ${etherscanUrl}`);
            
            return {
                ...result,
                etherscanUrl,
                message: `Mint transaction submitted! Track progress at: ${etherscanUrl}`
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Mint agent error:', error);
            
            // Provide more user-friendly error messages
            if (errorMessage?.includes('Insufficient fee') || errorMessage?.includes('insufficient funds for gas') || errorMessage?.includes('insufficient funds for intrinsic transaction cost')) {
                throw new Error('Insufficient ETH for gas fees. You need at least 0.02 ETH in your wallet for Sepolia testnet transactions. Please add Sepolia ETH from a faucet like https://sepoliafaucet.com/');
            }
            if (errorMessage?.includes('insufficient funds')) {
                throw new Error('Insufficient funds for transaction. Please check your ETH balance.');
            }
            if (errorMessage?.includes('gas required exceeds allowance') || errorMessage?.includes('out of gas')) {
                throw new Error('Transaction requires more gas than allowed. Please try again.');
            }
            if (errorMessage?.includes('user rejected') || errorMessage?.includes('User denied')) {
                throw new Error('Transaction was rejected by user.');
            }
            if (errorMessage?.includes('execution reverted')) {
                throw new Error('Minting failed during execution. Please check agent availability and try again.');
            }
            
            // Log the full error for debugging
            console.error('Full mint error:', error);
            throw new Error(`Minting failed: ${errorMessage}`);
        } finally {
            setTransactionLoading(false);
        }
    }, [isConnected, sendTransaction, accountAddress, contract]);

    const getAgentData = useCallback(async (agentId: string): Promise<{
        name: string;
        description: string;
        lighthouseHash: string;
        agentType: string;
        creator: string;
        datasetSize: number;
        trainingEpochs: number;
        accuracy: number;
        maxSupply: number;
        currentSupply: number;
        mintPrice: string;
        allowPublicMint: boolean;
        isActive: boolean;
        tags: string[];
    }> => {
        try {
            const thirdwebContract = getContract({
                client,
                chain: sepolia,
                address: CONTRACT_ADDRESSES.AIAgentBatchNFT,
                abi: AI_AGENT_BATCH_NFT_ABI,
            });

            const agentData = await readContract({
                contract: thirdwebContract,
                method: 'getAgent',
                params: [BigInt(agentId)]
            }) as readonly [
                { name: string; description: string; lighthouseHash: string; agentType: string; creator: string; createdAt: bigint },
                { datasetSize: bigint; trainingEpochs: bigint; accuracy: bigint },
                { maxSupply: bigint; currentSupply: bigint; mintPrice: bigint; isActive: boolean; allowPublicMint: boolean },
                readonly string[]
            ];

            const [core, metrics, minting, tags] = agentData;

            return {
                name: core.name,
                description: core.description,
                lighthouseHash: core.lighthouseHash,
                agentType: core.agentType,
                creator: core.creator,
                datasetSize: Number(metrics.datasetSize),
                trainingEpochs: Number(metrics.trainingEpochs),
                accuracy: Number(metrics.accuracy),
                maxSupply: Number(minting.maxSupply),
                currentSupply: Number(minting.currentSupply),
                mintPrice: toEther(minting.mintPrice),
                allowPublicMint: minting.allowPublicMint,
                isActive: minting.isActive,
                tags: [...tags]
            };
        } catch (error) {
            console.error('Get agent data error:', error);
            throw error;
        }
    }, []);

    const getTotalAgentTypes = useCallback(async (): Promise<string> => {
        try {
            const thirdwebContract = getContract({
                client,
                chain: sepolia,
                address: CONTRACT_ADDRESSES.AIAgentBatchNFT,
                abi: AI_AGENT_BATCH_NFT_ABI,
            });

            const total = await readContract({
                contract: thirdwebContract,
                method: 'totalAgentTypes',
                params: []
            });
            return total.toString();
        } catch (error) {
            console.error('Get total agent types error:', error);
            throw error;
        }
    }, []);

    const getUserAgentBalance = useCallback(async (userAddress: string, agentId: string): Promise<number> => {
        try {
            const thirdwebContract = getContract({
                client,
                chain: sepolia,
                address: CONTRACT_ADDRESSES.AIAgentBatchNFT,
                abi: AI_AGENT_BATCH_NFT_ABI,
            });

            const balance = await readContract({
                contract: thirdwebContract,
                method: 'balanceOf',
                params: [userAddress, BigInt(agentId)]
            });
            return Number(balance);
        } catch (error) {
            console.error('Get user agent balance error:', error);
            throw error;
        }
    }, []);

    const getUserCreatedAgents = useCallback(async (userAddress: string): Promise<string[]> => {
        try {
            const thirdwebContract = getContract({
                client,
                chain: sepolia,
                address: CONTRACT_ADDRESSES.AIAgentBatchNFT,
                abi: AI_AGENT_BATCH_NFT_ABI,
            });

            const agents = await readContract({
                contract: thirdwebContract,
                method: 'getAgentsByCreator',
                params: [userAddress]
            });
            return (agents as bigint[]).map((id: bigint) => id.toString());
        } catch (error) {
            console.error('Get user created agents error:', error);
            throw error;
        }
    }, []);

    // Helper function to check if user has sufficient ETH for gas
    const checkSufficientBalance = useCallback(async (): Promise<{ hasBalance: boolean; balance: string }> => {
        if (!account?.address) {
            return { hasBalance: false, balance: '0' };
        }

        try {
            // Get the ETH balance using thirdweb RPC client
            const rpcRequest = getRpcClient({ client, chain: sepolia });
            const balance = await rpcRequest({
                method: 'eth_getBalance',
                params: [account.address, 'latest'],
            });

            const balanceInEth = toEther(BigInt(balance));
            const minimumRequired = '0.01'; // Minimum 0.01 ETH recommended for gas fees
            
            return {
                hasBalance: parseFloat(balanceInEth) >= parseFloat(minimumRequired),
                balance: balanceInEth
            };
        } catch (error) {
            console.error('Error checking balance:', error);
            return { hasBalance: false, balance: '0' };
        }
    }, [account?.address]);

    // Helper function to wait for transaction confirmation
    const waitForTransactionConfirmation = useCallback(async (txHash: `0x${string}`, maxWaitTime = 60000): Promise<boolean> => {
        const startTime = Date.now();
        const rpcRequest = getRpcClient({ client, chain: sepolia });
        
        try {
            while (Date.now() - startTime < maxWaitTime) {
                try {
                    const receipt = await rpcRequest({
                        method: 'eth_getTransactionReceipt',
                        params: [txHash],
                    }) as { status?: string };
                    
                    if (receipt && receipt.status) {
                        console.log('Transaction confirmed:', txHash);
                        return receipt.status === '0x1'; // success
                    }
                } catch {
                    // Transaction might still be pending, continue waiting
                }
                
                // Wait 2 seconds before checking again
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            console.log('Transaction confirmation timeout:', txHash);
            return false;
        } catch (error) {
            console.error('Error waiting for transaction confirmation:', error);
            return false;
        }
    }, []);

    return {
        // Contract state
        contract,
        account: accountAddress,
        isConnected,
        transactionLoading,

        // Contract functions
        createAgent,
        mintAgent,
        getAgentData,
        getTotalAgentTypes,
        getUserAgentBalance,
        getUserCreatedAgents,
        checkSufficientBalance,
        waitForTransactionConfirmation,
    };
};
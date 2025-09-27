'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAIAgentContract } from '@/lib/contracts/hooks'
// Remove AgentData import since we're using a different structure
import {
    formatAccuracy,
    formatDatasetSize,
    getAgentTypeInfo,
    truncateAddress,
    getEtherscanUrl,
    getOpenSeaUrl
} from '@/lib/contracts/utils'
import { CONTRACT_ADDRESSES } from '@/lib/contracts/aiAgentNFT'

interface AgentCardProps {
    tokenId: string
    onUpdate?: () => void
}

export function AgentCard({ tokenId, onUpdate }: AgentCardProps) {
    const {
        getAgentData,
        getUserAgentBalance,
        mintAgent,
        account,
        isConnected,
        transactionLoading
    } = useAIAgentContract()

    const [agentData, setAgentData] = useState<{
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
    } | null>(null)
    const [userBalance, setUserBalance] = useState<string>('0')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>('')
    const [mintAmount, setMintAmount] = useState(1)
    const [mintError, setMintError] = useState<string>('')
    const [mintSuccess, setMintSuccess] = useState<string>('')

    const loadAgentData = useCallback(async () => {
        try {
            setLoading(true)
            const data = await getAgentData(tokenId)
            setAgentData(data)

            if (account && isConnected) {
                const balance = await getUserAgentBalance(account, tokenId)
                setUserBalance(balance.toString())
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load agent data')
        } finally {
            setLoading(false)
        }
    }, [getAgentData, getUserAgentBalance, tokenId, account, isConnected])

    useEffect(() => {
        loadAgentData()
    }, [loadAgentData])

    const handleMint = async () => {
        if (!agentData || !isConnected) return

        try {
            setMintError('')
            setMintSuccess('')

            // Validate mint amount
            const remaining = agentData.maxSupply - agentData.currentSupply
            if (BigInt(mintAmount) > remaining) {
                setMintError(`Cannot mint ${mintAmount} tokens. Only ${remaining} remaining.`)
                return
            }

            if (!agentData.allowPublicMint || !agentData.isActive || remaining < mintAmount) {
                setMintError('This agent is not available for public minting or is inactive.')
                return
            }

            await mintAgent(tokenId, mintAmount, agentData.mintPrice)
            setMintSuccess(`Successfully minted ${mintAmount} tokens!`)

            // Refresh data
            await loadAgentData()
            onUpdate?.()

            // Reset form
            setMintAmount(1)
        } catch (err) {
            setMintError(err instanceof Error ? err.message : 'Failed to mint tokens')
        }
    }

    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="w-full">
                <CardContent className="p-6">
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    if (!agentData) return null

    const typeInfo = getAgentTypeInfo(agentData.agentType)
    const mintedPercentage = (agentData.currentSupply / agentData.maxSupply) * 100
    const remaining = agentData.maxSupply - agentData.currentSupply
    const canMint = agentData.allowPublicMint && agentData.isActive && remaining >= mintAmount

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl">{agentData.name}</CardTitle>
                        <CardDescription className="mt-1">
                            Token ID: #{tokenId} • Created by {truncateAddress(agentData.creator)}
                        </CardDescription>
                    </div>
                    <Badge className={`${typeInfo.bgColor} ${typeInfo.color}`}>
                        {typeInfo.displayName}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Description */}
                <div>
                    <p className="text-sm text-muted-foreground">{agentData.description}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Dataset Size</p>
                        <p className="font-medium">{formatDatasetSize(BigInt(agentData.datasetSize))}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Training Epochs</p>
                        <p className="font-medium">{agentData.trainingEpochs.toString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="font-medium">{formatAccuracy(BigInt(agentData.accuracy))}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="font-medium text-xs">Created recently</p>
                    </div>
                </div>

                {/* Supply Information */}
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span>Supply Progress</span>
                        <span>{agentData.currentSupply.toString()} / {agentData.maxSupply.toString()}</span>
                    </div>
                    <Progress value={mintedPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{mintedPercentage.toFixed(1)}% minted</span>
                        <span>{remaining.toString()} remaining</span>
                    </div>
                </div>

                {/* Mint Information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Mint Price</p>
                        <p className="font-medium">{agentData.mintPrice} ETH</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Your Balance</p>
                        <p className="font-medium">{userBalance} tokens</p>
                    </div>
                </div>

                {/* Mint Section */}
                {isConnected && agentData.allowPublicMint && agentData.isActive && remaining > 0 && (
                    <div className="border-t pt-4 space-y-3">
                        <h4 className="font-medium">Mint Tokens</h4>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label htmlFor="mintAmount" className="sr-only">Amount to mint</Label>
                                <Input
                                    id="mintAmount"
                                    type="number"
                                    min="1"
                                    max={remaining.toString()}
                                    value={mintAmount}
                                    onChange={(e) => setMintAmount(parseInt(e.target.value) || 1)}
                                    placeholder="Amount"
                                />
                            </div>
                            <Button
                                onClick={handleMint}
                                disabled={transactionLoading || !canMint}
                            >
                                {transactionLoading ? 'Minting...' : `Mint (${(parseFloat(agentData.mintPrice) * mintAmount).toFixed(4)} ETH)`}
                            </Button>
                        </div>

                        {mintError && (
                            <Alert variant="destructive">
                                <AlertDescription>{mintError}</AlertDescription>
                            </Alert>
                        )}

                        {mintSuccess && (
                            <Alert>
                                <AlertDescription>{mintSuccess}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                    {!agentData.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                    )}
                    {!agentData.allowPublicMint && (
                        <Badge variant="outline">Private Mint</Badge>
                    )}
                    {remaining === 0 && (
                        <Badge variant="destructive">Sold Out</Badge>
                    )}
                    {agentData.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">
                            {tag}
                        </Badge>
                    ))}
                </div>

                {/* Links */}
                <div className="flex gap-2 text-sm">
                    <a
                        href={getEtherscanUrl(`${CONTRACT_ADDRESSES.AIAgentBatchNFT}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        View Contract
                    </a>
                    <span>•</span>
                    <a
                        href={getOpenSeaUrl(CONTRACT_ADDRESSES.AIAgentBatchNFT, tokenId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        View on OpenSea
                    </a>
                </div>
            </CardContent>
        </Card>
    )
}
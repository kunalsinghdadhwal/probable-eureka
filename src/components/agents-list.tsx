'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AgentCard } from './agent-card'
import { useAIAgentContract } from '@/lib/contracts/hooks'
import { ConnectButton } from 'thirdweb/react'
import { client } from '@/lib/client'
import { createWallet } from 'thirdweb/wallets'

export function AgentsList() {
    const { getTotalAgentTypes, isConnected } = useAIAgentContract()
    const [totalAgents, setTotalAgents] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>('')
    const [searchTokenId, setSearchTokenId] = useState('')
    const [displayTokenId, setDisplayTokenId] = useState<string | null>(null)

    const loadTotalAgents = useCallback(async () => {
        try {
            setLoading(true)
            const total = await getTotalAgentTypes()
            setTotalAgents(parseInt(total))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load agents')
        } finally {
            setLoading(false)
        }
    }, [getTotalAgentTypes])

    useEffect(() => {
        loadTotalAgents()
    }, [loadTotalAgents])

    const handleSearchById = () => {
        const tokenId = parseInt(searchTokenId)
        if (isNaN(tokenId) || tokenId < 0) {
            setError('Please enter a valid token ID')
            return
        }
        if (tokenId >= totalAgents) {
            setError(`Token ID ${tokenId} does not exist. Total agents: ${totalAgents}`)
            return
        }
        setDisplayTokenId(searchTokenId)
        setError('')
    }

    const handleShowAll = () => {
        setDisplayTokenId(null)
        setSearchTokenId('')
        setError('')
    }

    // Generate array of token IDs to display
    const getTokenIdsToDisplay = (): string[] => {
        if (displayTokenId !== null) {
            return [displayTokenId]
        }

        // Show latest 10 agents or all if less than 10
        const count = Math.min(totalAgents, 10)
        const tokenIds: string[] = []
        for (let i = Math.max(0, totalAgents - count); i < totalAgents; i++) {
            tokenIds.push(i.toString())
        }
        return tokenIds.reverse() // Show newest first
    }

    if (!isConnected) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Browse AI Agents</CardTitle>
                    <CardDescription>
                        Connect your wallet to browse and interact with AI agent NFTs
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <ConnectButton
                        client={client}
                        theme="dark"
                        connectModal={{
                            size: "compact",
                            title: "Connect to Explore Agents",
                            showThirdwebBranding: false,
                        }}
                        wallets={[
                            createWallet("io.metamask"),
                            createWallet("com.coinbase.wallet"),
                            createWallet("me.rainbow"),
                        ]}
                    />
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const tokenIdsToDisplay = getTokenIdsToDisplay()

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>AI Agent NFTs</CardTitle>
                            <CardDescription>
                                Discover and mint shares of AI training datasets
                            </CardDescription>
                        </div>
                        <Badge variant="secondary">
                            {totalAgents} Total Agents
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Search Section */}
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="Search by Token ID..."
                            value={searchTokenId}
                            onChange={(e) => setSearchTokenId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchById()}
                        />
                        <Button onClick={handleSearchById}>
                            Search
                        </Button>
                        {displayTokenId !== null && (
                            <Button variant="outline" onClick={handleShowAll}>
                                Show All
                            </Button>
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Agents Display */}
            {totalAgents === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No agents have been created yet.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Be the first to create an AI agent NFT!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {displayTokenId !== null && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Showing agent #{displayTokenId}</span>
                        </div>
                    )}

                    {tokenIdsToDisplay.length > 0 ? (
                        tokenIdsToDisplay.map(tokenId => (
                            <AgentCard
                                key={tokenId}
                                tokenId={tokenId}
                                onUpdate={loadTotalAgents}
                            />
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p className="text-muted-foreground">No agents found.</p>
                            </CardContent>
                        </Card>
                    )}

                    {displayTokenId === null && totalAgents > 10 && (
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Showing latest 10 agents. Use search to find specific agents by Token ID.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
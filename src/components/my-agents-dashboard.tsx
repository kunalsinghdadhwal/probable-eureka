'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AgentCard } from './agent-card'
import { useAIAgentContract } from '@/lib/contracts/hooks'
import { ConnectButton } from 'thirdweb/react'
import { client } from '@/lib/client'
import { createWallet } from 'thirdweb/wallets'
import { truncateAddress } from '@/lib/contracts/utils'

export function MyAgentsDashboard() {
    const {
        getUserCreatedAgents,
        account,
        isConnected
    } = useAIAgentContract()

    const [createdAgents, setCreatedAgents] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>('')
    const [lastRefresh, setLastRefresh] = useState<number>(Date.now())

    const loadUserAgents = useCallback(async () => {
        if (!account || !isConnected) return

        try {
            setLoading(true)
            setError('')
            console.log('Loading user agents for:', account)
            const agentIds = await getUserCreatedAgents(account)
            console.log('Found agents:', agentIds)
            setCreatedAgents(agentIds)
            setLastRefresh(Date.now())
        } catch (err) {
            console.error('Error loading user agents:', err)
            setError(err instanceof Error ? err.message : 'Failed to load your agents')
        } finally {
            setLoading(false)
        }
    }, [getUserCreatedAgents, account, isConnected])

    useEffect(() => {
        if (account && isConnected) {
            loadUserAgents()
        }
    }, [loadUserAgents, account, isConnected])

    // Auto-refresh every 30 seconds to catch newly mined transactions
    useEffect(() => {
        if (!account || !isConnected) return

        const interval = setInterval(() => {
            console.log('Auto-refreshing agents list...')
            loadUserAgents()
        }, 30000) // 30 seconds

        return () => clearInterval(interval)
    }, [account, isConnected, loadUserAgents])

    if (!isConnected) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>My AI Agents</CardTitle>
                    <CardDescription>
                        Connect your wallet to view and manage your AI agent NFTs
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <ConnectButton
                        client={client}
                        theme="dark"
                        connectModal={{
                            size: "compact",
                            title: "Connect to View Your Agents",
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
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>My AI Agents</CardTitle>
                            <CardDescription>
                                Manage your created AI agent NFTs
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <Badge variant="secondary">
                                {createdAgents.length} Created
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                                {truncateAddress(account || '')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(lastRefresh).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Info about pending transactions */}
            <Alert>
                <AlertDescription>
                    <strong>Note:</strong> If you just created an agent, it may take 1-2 minutes to appear here after the transaction is mined. 
                    The page auto-refreshes every 30 seconds. You can also click &ldquo;Refresh&rdquo; to check manually.
                </AlertDescription>
            </Alert>

            {/* Created Agents */}
            {createdAgents.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center space-y-4">
                        <div>
                            <h3 className="text-lg font-medium">No agents created yet</h3>
                            <p className="text-muted-foreground">
                                Create your first AI agent NFT to get started
                            </p>
                        </div>
                        <Button asChild>
                            <a href="/mint">Create Agent</a>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Created Agents ({createdAgents.length})</h3>
                        <Button variant="outline" onClick={() => loadUserAgents()}>
                            Refresh
                        </Button>
                    </div>

                    {createdAgents.map(tokenId => (
                        <AgentCard
                            key={tokenId}
                            tokenId={tokenId}
                            onUpdate={loadUserAgents}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
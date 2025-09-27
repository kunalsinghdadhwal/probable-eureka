'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAIAgentContract } from '@/lib/contracts/hooks'
import { createAgentParams, validateAgentParams } from '@/lib/contracts/utils'
import { getEtherscanUrl } from '@/lib/contracts/utils'
import { ConnectButton } from 'thirdweb/react'
import { client } from '@/lib/client'
import { createWallet } from 'thirdweb/wallets'

interface CreateAgentFormData {
    name: string
    description: string
    lighthouseHash: string
    agentType: string
    datasetSize: number
    trainingEpochs: number
    accuracy: number
    maxSupply: number
    mintPrice: string
    allowPublicMint: boolean
    initialMint: number
}

const AGENT_TYPES = [
    { value: 'classification', label: 'Classification' },
    { value: 'regression', label: 'Regression' },
    { value: 'nlp', label: 'NLP' },
    { value: 'computer-vision', label: 'Computer Vision' },
    { value: 'reinforcement-learning', label: 'Reinforcement Learning' },
    { value: 'other', label: 'Other' }
]

export function CreateAgentForm() {
    const { isConnected, account, createAgent, transactionLoading } = useAIAgentContract()
    const [formData, setFormData] = useState<CreateAgentFormData>({
        name: '',
        description: '',
        lighthouseHash: '',
        agentType: 'classification',
        datasetSize: 1000,
        trainingEpochs: 100,
        accuracy: 85,
        maxSupply: 1000,
        mintPrice: '0.001',
        allowPublicMint: true,
        initialMint: 0
    })
    const [errors, setErrors] = useState<string[]>([])
    const [success, setSuccess] = useState<{ tokenId: string; txHash: string } | null>(null)

    const handleInputChange = (field: keyof CreateAgentFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setErrors([])
        setSuccess(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isConnected) {
            setErrors(['Please connect your wallet first'])
            return
        }

        try {
            // Create agent parameters
            const agentParams = createAgentParams(formData)

            // Validate parameters
            const validationErrors = validateAgentParams(agentParams)
            if (validationErrors.length > 0) {
                setErrors(validationErrors)
                return
            }

            // Create the agent
            setErrors([])
            const result = await createAgent(agentParams)

            // Show transaction submission success
            setSuccess({
                tokenId: 'Transaction Submitted',
                txHash: result.transactionHash
            })

            // Reset form
            setFormData({
                name: '',
                description: '',
                lighthouseHash: '',
                agentType: 'classification',
                datasetSize: 1000,
                trainingEpochs: 100,
                accuracy: 85,
                maxSupply: 1000,
                mintPrice: '0.001',
                allowPublicMint: true,
                initialMint: 0
            })

        } catch (error) {
            console.error('Error creating agent:', error)
            setErrors([error instanceof Error ? error.message : 'Failed to create agent'])
        }
    }

    if (!isConnected) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Create AI Agent NFT</CardTitle>
                    <CardDescription>
                        Connect your wallet to create and mint AI agent NFTs
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <ConnectButton
                        client={client}
                        theme="dark"
                        connectModal={{
                            size: "compact",
                            title: "Connect to Create AI Agent",
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

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create AI Agent NFT</CardTitle>
                <CardDescription>
                    Create a new AI agent and mint ERC-1155 tokens representing dataset shares
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>

                        <div>
                            <Label htmlFor="name">Agent Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="My AI Classification Model"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Describe your AI model, its purpose, and capabilities..."
                                rows={3}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="lighthouseHash">Lighthouse Hash *</Label>
                            <Input
                                id="lighthouseHash"
                                value={formData.lighthouseHash}
                                onChange={(e) => handleInputChange('lighthouseHash', e.target.value)}
                                placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="agentType">Agent Type *</Label>
                            <select
                                id="agentType"
                                value={formData.agentType}
                                onChange={(e) => handleInputChange('agentType', e.target.value)}
                                className="w-full p-2 border border-input bg-background rounded-md"
                                required
                            >
                                {AGENT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Model Metrics */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Model Metrics</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="datasetSize">Dataset Size *</Label>
                                <Input
                                    id="datasetSize"
                                    type="number"
                                    value={formData.datasetSize}
                                    onChange={(e) => handleInputChange('datasetSize', parseInt(e.target.value) || 0)}
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="trainingEpochs">Training Epochs *</Label>
                                <Input
                                    id="trainingEpochs"
                                    type="number"
                                    value={formData.trainingEpochs}
                                    onChange={(e) => handleInputChange('trainingEpochs', parseInt(e.target.value) || 0)}
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="accuracy">Accuracy (%) *</Label>
                                <div className="space-y-2">
                                    <Input
                                        id="accuracy"
                                        type="number"
                                        value={formData.accuracy}
                                        onChange={(e) => handleInputChange('accuracy', parseFloat(e.target.value) || 0)}
                                        min="0.01"
                                        max="100"
                                        step="0.01"
                                        required
                                    />
                                    <Progress value={formData.accuracy} className="h-2" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Minting Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Minting Configuration</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="maxSupply">Max Supply *</Label>
                                <Input
                                    id="maxSupply"
                                    type="number"
                                    value={formData.maxSupply}
                                    onChange={(e) => handleInputChange('maxSupply', parseInt(e.target.value) || 0)}
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="mintPrice">Mint Price (ETH) *</Label>
                                <Input
                                    id="mintPrice"
                                    type="number"
                                    value={formData.mintPrice}
                                    onChange={(e) => handleInputChange('mintPrice', e.target.value)}
                                    min="0"
                                    step="0.001"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="initialMint">Initial Mint Amount</Label>
                            <Input
                                id="initialMint"
                                type="number"
                                value={formData.initialMint}
                                onChange={(e) => handleInputChange('initialMint', parseInt(e.target.value) || 0)}
                                min="0"
                                max={formData.maxSupply}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Number of tokens to mint to yourself immediately
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="allowPublicMint"
                                checked={formData.allowPublicMint}
                                onChange={(e) => handleInputChange('allowPublicMint', e.target.checked)}
                                className="rounded"
                            />
                            <Label htmlFor="allowPublicMint">Allow Public Minting</Label>
                        </div>
                    </div>

                    {/* Errors */}
                    {errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                <ul className="list-disc list-inside">
                                    {errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success */}
                    {success && (
                        <Alert>
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p>🚀 Transaction submitted successfully!</p>
                                    <p><strong>Status:</strong> {success.tokenId}</p>
                                    <p className="text-sm">
                                        Your agent is being created on the blockchain. This usually takes 1-2 minutes on Sepolia testnet.
                                    </p>
                                    <p>
                                        <strong>Track Transaction:</strong>{' '}
                                        <a
                                            href={getEtherscanUrl(success.txHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            View on Etherscan
                                        </a>
                                    </p>
                                    <p className="text-sm">
                                        💡 Your new agent will appear in &ldquo;My AI Agents&rdquo; once the transaction is confirmed.
                                    </p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={transactionLoading}
                        className="w-full"
                    >
                        {transactionLoading ? 'Creating Agent...' : 'Create Agent NFT'}
                    </Button>

                    {/* Connection Status */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Connected: <Badge variant="secondary">{account?.slice(0, 6)}...{account?.slice(-4)}</Badge>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
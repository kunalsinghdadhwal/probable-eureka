# AI Agent NFT Smart Contracts

A modular smart contract system for creating, managing, and trading AI Agent NFTs with batch operations support.

## Overview

This project implements a comprehensive NFT system specifically designed for AI agents, featuring:

- **Modular Architecture**: Separated concerns with libraries and storage contracts
- **Batch Operations**: Efficient creation and minting of multiple agents
- **Payment Processing**: Built-in platform fees and creator royalties
- **Access Control**: Creator-specific management functions
- **Metadata Support**: Flexible URI system for agent metadata

## Contract Architecture

### Core Contracts

1. **AIAgentBatchNFT.sol** - Main ERC1155 contract for AI Agent NFTs
2. **AgentStorage.sol** - Storage contract for agent data management

### Libraries

1. **AgentDataLib.sol** - Data structures for agent information
2. **ValidationLib.sol** - Input validation and business logic
3. **PaymentLib.sol** - Payment processing and fee calculations

## Features

### Agent Creation
- Create individual AI agents with metadata
- Batch create multiple agents efficiently
- Lighthouse hash verification for uniqueness
- Configurable supply and pricing

### Minting System
- Public and creator-only minting options
- Batch minting for multiple agents
- Supply validation and active status checks
- Platform fee collection

### Agent Management
- Update agent information (creator only)
- Set and manage agent tags
- Toggle active/inactive status
- View agent metrics and data

### Payment Processing
- Configurable platform fees (default 2.5%)
- Creator royalty distribution
- Automatic refund handling
- Emergency withdrawal functions

## Installation

```bash
npm install
```

## Compilation

```bash
npm run compile
```

## Testing

```bash
npm run test
```

## Deployment

### Local Network
```bash
npm run deploy:local
```

### Sepolia Testnet
```bash
npm run deploy:sepolia
```

### Mainnet
```bash
npm run deploy:mainnet
```

## Environment Variables

Create a `.env` file with the following variables:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_URL=https://sepolia.infura.io/v3/your_project_id
MAINNET_URL=https://mainnet.infura.io/v3/your_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
REPORT_GAS=true
```

## Contract Functions

### Agent Creation
- `createAgent(params, initialMint)` - Create a single agent
- `batchCreateAgents(params[], initialMints[])` - Create multiple agents

### Minting
- `mintAgent(tokenId, amount, to)` - Mint tokens for an agent
- `batchMintAgents(tokenIds[], amounts[], to)` - Mint multiple agents

### Management
- `updateAgent(tokenId, name, description, mintPrice, allowPublicMint)` - Update agent info
- `setAgentTags(tokenId, tags[])` - Set agent tags
- `toggleAgentStatus(tokenId)` - Toggle active status

### View Functions
- `getAgent(tokenId)` - Get complete agent data
- `getAgentsByCreator(creator)` - Get all agents by creator
- `totalAgentTypes()` - Get total number of agent types
- `isHashUsed(hash)` - Check if lighthouse hash is used

## Data Structures

### AgentCore
```solidity
struct AgentCore {
    string name;
    string description;
    string lighthouseHash;
    string agentType;
    address creator;
    uint256 createdAt;
}
```

### AgentMetrics
```solidity
struct AgentMetrics {
    uint256 datasetSize;
    uint256 trainingEpochs;
    uint256 accuracy;
}
```

### AgentMinting
```solidity
struct AgentMinting {
    uint256 maxSupply;
    uint256 currentSupply;
    uint256 mintPrice;
    bool isActive;
    bool allowPublicMint;
}
```

## Events

- `AgentCreated` - Emitted when a new agent is created
- `AgentMinted` - Emitted when tokens are minted
- `AgentUpdated` - Emitted when agent info is updated
- `AgentStatusToggled` - Emitted when agent status changes
- `TagsUpdated` - Emitted when agent tags are updated

## Security Features

- ReentrancyGuard protection
- Input validation and sanitization
- Access control with role-based permissions
- Emergency withdrawal functions
- Pausable minting functionality

## Gas Optimization

- Batch operations for efficiency
- Library usage for code reuse
- Optimized data structures
- Minimal external calls

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For questions and support, please open an issue in the repository.
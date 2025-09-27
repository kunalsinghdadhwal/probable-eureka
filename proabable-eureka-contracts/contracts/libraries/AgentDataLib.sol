// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AgentDataLib
 * @dev Library for agent data structures
 */
library AgentDataLib {
    struct AgentCore {
        string name;
        string description;
        string lighthouseHash;
        string agentType;
        address creator;
        uint256 createdAt;
    }

    struct AgentMetrics {
        uint256 datasetSize;
        uint256 trainingEpochs;
        uint256 accuracy;
    }

    struct AgentMinting {
        uint256 maxSupply;
        uint256 currentSupply;
        uint256 mintPrice;
        bool isActive;
        bool allowPublicMint;
    }

    struct AgentParams {
        string name;
        string description;
        string lighthouseHash;
        string agentType;
        uint256 datasetSize;
        uint256 trainingEpochs;
        uint256 accuracy;
        uint256 maxSupply;
        uint256 mintPrice;
        bool allowPublicMint;
    }
}

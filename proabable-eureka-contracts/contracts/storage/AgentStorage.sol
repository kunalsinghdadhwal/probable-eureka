// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../libraries/AgentDataLib.sol";

/**
 * @title AgentStorage
 * @dev Storage contract for agent data
 */
contract AgentStorage is Ownable {
    using AgentDataLib for *;

    mapping(uint256 => AgentDataLib.AgentCore) public agentCores;
    mapping(uint256 => AgentDataLib.AgentMetrics) public agentMetrics;
    mapping(uint256 => AgentDataLib.AgentMinting) public agentMinting;
    mapping(uint256 => string[]) public agentTags;
    
    mapping(address => uint256[]) public creatorAgents;
    mapping(string => bool) public usedHashes;
    mapping(string => uint256) public hashToTokenId;
    
    address public mainContract;

    modifier onlyMainContract() {
        require(msg.sender == mainContract, "Only main contract");
        _;
    }

    constructor() Ownable() {}

    function setMainContract(address _mainContract) external onlyOwner {
        mainContract = _mainContract;
    }

    function storeAgent(
        uint256 tokenId,
        AgentDataLib.AgentParams memory params,
        uint256 initialSupply
    ) external onlyMainContract {
        agentCores[tokenId] = AgentDataLib.AgentCore({
            name: params.name,
            description: params.description,
            lighthouseHash: params.lighthouseHash,
            agentType: params.agentType,
            creator: tx.origin,
            createdAt: block.timestamp
        });

        agentMetrics[tokenId] = AgentDataLib.AgentMetrics({
            datasetSize: params.datasetSize,
            trainingEpochs: params.trainingEpochs,
            accuracy: params.accuracy
        });

        agentMinting[tokenId] = AgentDataLib.AgentMinting({
            maxSupply: params.maxSupply,
            currentSupply: initialSupply,
            mintPrice: params.mintPrice,
            isActive: true,
            allowPublicMint: params.allowPublicMint
        });

        usedHashes[params.lighthouseHash] = true;
        hashToTokenId[params.lighthouseHash] = tokenId;
        creatorAgents[tx.origin].push(tokenId);
    }

    function updateSupply(uint256 tokenId, uint256 newSupply) external onlyMainContract {
        agentMinting[tokenId].currentSupply = newSupply;
    }

    function updateAgentInfo(
        uint256 tokenId,
        string memory name,
        string memory description,
        uint256 mintPrice,
        bool allowPublicMint
    ) external onlyMainContract {
        if (bytes(name).length > 0) {
            agentCores[tokenId].name = name;
        }
        if (bytes(description).length > 0) {
            agentCores[tokenId].description = description;
        }
        agentMinting[tokenId].mintPrice = mintPrice;
        agentMinting[tokenId].allowPublicMint = allowPublicMint;
    }

    function setTags(uint256 tokenId, string[] memory tags) external onlyMainContract {
        delete agentTags[tokenId];
        for (uint256 i = 0; i < tags.length; i++) {
            agentTags[tokenId].push(tags[i]);
        }
    }

    function toggleActive(uint256 tokenId) external onlyMainContract {
        agentMinting[tokenId].isActive = !agentMinting[tokenId].isActive;
    }

    // View functions
    function getAgentData(uint256 tokenId) external view returns (
        AgentDataLib.AgentCore memory core,
        AgentDataLib.AgentMetrics memory metrics,
        AgentDataLib.AgentMinting memory minting
    ) {
        return (agentCores[tokenId], agentMetrics[tokenId], agentMinting[tokenId]);
    }

    function getTags(uint256 tokenId) external view returns (string[] memory) {
        return agentTags[tokenId];
    }

    function isHashUsed(string memory hash) external view returns (bool) {
        return usedHashes[hash];
    }

    function getCreatorAgents(address creator) external view returns (uint256[] memory) {
        return creatorAgents[creator];
    }
}

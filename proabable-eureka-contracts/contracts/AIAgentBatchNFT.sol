// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./libraries/AgentDataLib.sol";
import "./libraries/ValidationLib.sol";
import "./libraries/PaymentLib.sol";
import "./storage/AgentStorage.sol";

/**
 * @title AIAgentBatchNFT
 * @dev Main AI Agent NFT contract with batch operations
 */
contract AIAgentBatchNFT is ERC1155, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;
    using AgentDataLib for *;
    using ValidationLib for *;
    using PaymentLib for *;

    Counters.Counter private _tokenIdCounter;
    AgentStorage public agentStorage;

    // Settings
    uint256 public mintingFee = 0.001 ether;
    uint256 public maxBatchSize = 20;
    uint256 public platformFeePercentage = 250; // 2.5%
    bool public mintingPaused;
    string public baseURI = "https://api.your-project.com/metadata/";

    // Events
    event AgentCreated(uint256 indexed tokenId, address indexed creator, string name);
    event AgentMinted(uint256 indexed tokenId, address indexed minter, uint256 amount);
    event AgentUpdated(uint256 indexed tokenId, string name, string description);
    event AgentStatusToggled(uint256 indexed tokenId, bool isActive);
    event TagsUpdated(uint256 indexed tokenId, uint256 tagCount);

    modifier whenNotPaused() {
        require(!mintingPaused, "Paused");
        _;
    }

    constructor(address _storageContract) ERC1155("") Ownable() {
        require(_storageContract != address(0), "Invalid storage address");
        agentStorage = AgentStorage(_storageContract);
    }

    /**
     * @dev Create a single agent
     */
    function createAgent(
        AgentDataLib.AgentParams calldata params,
        uint256 initialMint
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value >= mintingFee, "Insufficient fee");
        ValidationLib.validateAgentParams(params, initialMint);
        require(!agentStorage.isHashUsed(params.lighthouseHash), "Hash used");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        agentStorage.storeAgent(tokenId, params, initialMint);

        if (initialMint > 0) {
            _mint(msg.sender, tokenId, initialMint, "");
        }

        if (msg.value > mintingFee) {
            payable(msg.sender).transfer(msg.value - mintingFee);
        }

        emit AgentCreated(tokenId, msg.sender, params.name);
        return tokenId;
    }

    /**
     * @dev Batch create agents
     */
    function batchCreateAgents(
        AgentDataLib.AgentParams[] calldata params,
        uint256[] calldata initialMints
    ) external payable nonReentrant whenNotPaused returns (uint256[] memory) {
        ValidationLib.validateBatchSize(params.length, maxBatchSize);
        require(params.length == initialMints.length, "Length mismatch");
        require(msg.value >= mintingFee * params.length, "Insufficient fee");

        uint256[] memory tokenIds = new uint256[](params.length);

        for (uint256 i = 0; i < params.length; i++) {
            ValidationLib.validateAgentParams(params[i], initialMints[i]);
            require(!agentStorage.isHashUsed(params[i].lighthouseHash), "Hash used");

            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            tokenIds[i] = tokenId;

            agentStorage.storeAgent(tokenId, params[i], initialMints[i]);

            if (initialMints[i] > 0) {
                _mint(msg.sender, tokenId, initialMints[i], "");
            }

            emit AgentCreated(tokenId, msg.sender, params[i].name);
        }

        uint256 excess = msg.value - (mintingFee * params.length);
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }

        return tokenIds;
    }

    /**
     * @dev Mint tokens for an existing agent
     */
    function mintAgent(
        uint256 tokenId,
        uint256 amount,
        address to
    ) external payable nonReentrant whenNotPaused {
        (
            AgentDataLib.AgentCore memory core,
            ,
            AgentDataLib.AgentMinting memory minting
        ) = agentStorage.getAgentData(tokenId);

        ValidationLib.validateMint(
            minting.currentSupply,
            minting.maxSupply,
            amount,
            minting.isActive
        );

        if (msg.sender != core.creator) {
            require(minting.allowPublicMint, "No public mint");
            PaymentLib.processPayment(
                core.creator,
                amount,
                minting.mintPrice,
                platformFeePercentage,
                msg.value
            );
        }

        agentStorage.updateSupply(tokenId, minting.currentSupply + amount);
        _mint(to, tokenId, amount, "");
        
        emit AgentMinted(tokenId, to, amount);
    }

    /**
     * @dev Batch mint multiple agents
     */
    function batchMintAgents(
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        address to
    ) external payable nonReentrant whenNotPaused {
        require(tokenIds.length == amounts.length, "Length mismatch");
        ValidationLib.validateBatchSize(tokenIds.length, maxBatchSize);

        uint256 totalCost = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            (
                AgentDataLib.AgentCore memory core,
                ,
                AgentDataLib.AgentMinting memory minting
            ) = agentStorage.getAgentData(tokenIds[i]);

            ValidationLib.validateMint(
                minting.currentSupply,
                minting.maxSupply,
                amounts[i],
                minting.isActive
            );

            if (msg.sender != core.creator) {
                require(minting.allowPublicMint, "No public mint");
                totalCost += minting.mintPrice * amounts[i];
            }

            agentStorage.updateSupply(tokenIds[i], minting.currentSupply + amounts[i]);
        }

        require(msg.value >= totalCost, "Insufficient payment");
        
        _mintBatch(to, tokenIds, amounts, "");

        // Process payments
        if (totalCost > 0) {
            // Platform fee stays in contract
            // uint256 platformFee = (totalCost * platformFeePercentage) / 10000;
        }

        // Refund excess
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit AgentMinted(tokenIds[i], to, amounts[i]);
        }
    }

    /**
     * @dev Update agent information (creator only)
     */
    function updateAgent(
        uint256 tokenId,
        string calldata name,
        string calldata description,
        uint256 mintPrice,
        bool allowPublicMint
    ) external {
        (AgentDataLib.AgentCore memory core, , ) = agentStorage.getAgentData(tokenId);
        require(core.creator == msg.sender, "Not creator");
        
        agentStorage.updateAgentInfo(tokenId, name, description, mintPrice, allowPublicMint);
        emit AgentUpdated(tokenId, name, description);
    }

    /**
     * @dev Set agent tags
     */
    function setAgentTags(uint256 tokenId, string[] calldata tags) external {
        (AgentDataLib.AgentCore memory core, , ) = agentStorage.getAgentData(tokenId);
        require(core.creator == msg.sender, "Not creator");
        require(tags.length <= 10, "Too many tags");
        
        agentStorage.setTags(tokenId, tags);
        emit TagsUpdated(tokenId, tags.length);
    }

    /**
     * @dev Toggle agent active status
     */
    function toggleAgentStatus(uint256 tokenId) external {
        (AgentDataLib.AgentCore memory core, , ) = agentStorage.getAgentData(tokenId);
        require(core.creator == msg.sender, "Not creator");
        
        agentStorage.toggleActive(tokenId);
        (, , AgentDataLib.AgentMinting memory minting) = agentStorage.getAgentData(tokenId);
        emit AgentStatusToggled(tokenId, minting.isActive);
    }

    // View functions
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function getAgent(uint256 tokenId) external view returns (
        AgentDataLib.AgentCore memory core,
        AgentDataLib.AgentMetrics memory metrics,
        AgentDataLib.AgentMinting memory minting,
        string[] memory tags
    ) {
        (core, metrics, minting) = agentStorage.getAgentData(tokenId);
        tags = agentStorage.getTags(tokenId);
    }

    function getAgentsByCreator(address creator) external view returns (uint256[] memory) {
        return agentStorage.getCreatorAgents(creator);
    }

    function totalAgentTypes() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function isHashUsed(string calldata hash) external view returns (bool) {
        return agentStorage.isHashUsed(hash);
    }

    // Owner functions
    function setMintingFee(uint256 _fee) external onlyOwner {
        mintingFee = _fee;
    }

    function setPlatformFeePercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 1000, "Too high"); // Max 10%
        platformFeePercentage = _percentage;
    }

    function setMaxBatchSize(uint256 _maxBatchSize) external onlyOwner {
        require(_maxBatchSize > 0 && _maxBatchSize <= 100, "Invalid batch size");
        maxBatchSize = _maxBatchSize;
    }

    function setBaseURI(string calldata _uri) external onlyOwner {
        baseURI = _uri;
    }

    function pauseMinting() external onlyOwner {
        mintingPaused = true;
    }

    function unpauseMinting() external onlyOwner {
        mintingPaused = false;
    }

    function withdrawFees() external onlyOwner {
        require(address(this).balance > 0, "No funds");
        payable(owner()).transfer(address(this).balance);
    }

    // Emergency function
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }
}

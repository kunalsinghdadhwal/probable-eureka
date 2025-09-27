// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./libraries/AgentDataLib.sol";
import "./libraries/ValidationLib.sol";
import "./libraries/PaymentLib.sol";
import "./storage/AgentStorage.sol";

/**
 * @title AIAgentBatchNFT with zkTLS Verification
 * @dev Enhanced AI Agent NFT contract with zkTLS-based creator verification
 */
contract AIAgentBatchNFT is ERC1155, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;
    using ECDSA for bytes32;
    using AgentDataLib for *;
    using ValidationLib for *;
    using PaymentLib for *;

    Counters.Counter private _tokenIdCounter;
    AgentStorage public agentStorage;

    // zkTLS Verification structs
    struct VerificationData {
        string lighthouseHash;
        uint256 datasetSize;
        uint256 trainingEpochs;
        uint256 accuracy;
        uint256 timestamp;
        bytes32 dataHash;
    }

    struct NodeSignature {
        address nodeAddress;
        bytes signature;
    }

    struct CreatorVerification {
        bool isVerified;
        uint256 verificationTime;
        string lighthouseHash;
        VerificationData data;
        uint256 expiryDuration; // in seconds
    }

    // Settings
    uint256 public mintingFee = 0.001 ether;
    uint256 public maxBatchSize = 20;
    uint256 public platformFeePercentage = 250; // 2.5%
    uint256 public verificationExpiryDuration = 30 days;
    bool public mintingPaused;
    string public baseURI = "https://api.your-project.com/metadata/";

    // zkTLS verification storage
    mapping(address => CreatorVerification) public creatorVerifications;
    mapping(address => bool) public trustedLighthouseNodes;
    mapping(bytes32 => bool) public usedVerificationHashes;
    
    // Trusted node management
    address[] public trustedNodesList;
    uint256 public requiredNodeSignatures = 3;

    // Events
    event AgentCreated(uint256 indexed tokenId, address indexed creator, string name);
    event AgentMinted(uint256 indexed tokenId, address indexed minter, uint256 amount);
    event AgentUpdated(uint256 indexed tokenId, string name, string description);
    event AgentStatusToggled(uint256 indexed tokenId, bool isActive);
    event TagsUpdated(uint256 indexed tokenId, uint256 tagCount);
    event CreatorVerified(address indexed creator, string lighthouseHash, uint256 timestamp);
    event VerificationExpired(address indexed creator, uint256 expiredAt);
    event TrustedNodeAdded(address indexed nodeAddress);
    event TrustedNodeRemoved(address indexed nodeAddress);

    modifier whenNotPaused() {
        require(!mintingPaused, "Minting is paused");
        _;
    }

    modifier onlyVerifiedCreator() {
        require(isCreatorVerified(msg.sender), "Creator not verified or verification expired");
        _;
    }

    constructor(
        address _storageContract,
        address[] memory _trustedNodes
    ) ERC1155("") Ownable() {
        require(_storageContract != address(0), "Invalid storage address");
        agentStorage = AgentStorage(_storageContract);
        
        // Initialize trusted Lighthouse nodes
        for (uint i = 0; i < _trustedNodes.length; i++) {
            require(_trustedNodes[i] != address(0), "Invalid node address");
            trustedLighthouseNodes[_trustedNodes[i]] = true;
            trustedNodesList.push(_trustedNodes[i]);
        }
    }

    /**
     * @dev Verify creator using zkTLS proof from Lighthouse
     * @param verificationData The agent verification data from zkTLS proof
     * @param nodeSignatures Signatures from trusted Lighthouse nodes
     */
    function verifyCreatorWithZkTLS(
        VerificationData calldata verificationData,
        NodeSignature[] calldata nodeSignatures
    ) external {
        require(nodeSignatures.length >= requiredNodeSignatures, "Insufficient node signatures");
        require(bytes(verificationData.lighthouseHash).length > 0, "Empty lighthouse hash");
        require(verificationData.accuracy <= 10000, "Invalid accuracy"); // Max 100%
        require(verificationData.timestamp > 0, "Invalid timestamp");
        require(verificationData.timestamp <= block.timestamp + 300, "Future timestamp"); // Max 5 min ahead
        require(verificationData.timestamp >= block.timestamp - 3600, "Stale timestamp"); // Max 1 hour old

        // Prevent replay attacks
        bytes32 verificationHash = keccak256(abi.encodePacked(
            msg.sender,
            verificationData.lighthouseHash,
            verificationData.datasetSize,
            verificationData.trainingEpochs,
            verificationData.accuracy,
            verificationData.timestamp,
            verificationData.dataHash
        ));
        require(!usedVerificationHashes[verificationHash], "Verification already used");

        // Verify node signatures
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            verificationData.lighthouseHash,
            verificationData.datasetSize,
            verificationData.trainingEpochs,
            verificationData.accuracy,
            verificationData.timestamp
        ));

        uint256 validSignatures = 0;
        for (uint256 i = 0; i < nodeSignatures.length; i++) {
            require(trustedLighthouseNodes[nodeSignatures[i].nodeAddress], "Untrusted node");
            
            address recoveredSigner = messageHash.toEthSignedMessageHash().recover(nodeSignatures[i].signature);
            if (recoveredSigner == nodeSignatures[i].nodeAddress) {
                validSignatures++;
            }
        }

        require(validSignatures >= requiredNodeSignatures, "Insufficient valid signatures");

        // Mark verification hash as used
        usedVerificationHashes[verificationHash] = true;

        // Store creator verification
        creatorVerifications[msg.sender] = CreatorVerification({
            isVerified: true,
            verificationTime: block.timestamp,
            lighthouseHash: verificationData.lighthouseHash,
            data: verificationData,
            expiryDuration: verificationExpiryDuration
        });

        emit CreatorVerified(msg.sender, verificationData.lighthouseHash, block.timestamp);
    }

    /**
     * @dev Check if creator is verified and verification hasn't expired
     */
    function isCreatorVerified(address creator) public view returns (bool) {
        CreatorVerification memory verification = creatorVerifications[creator];
        if (!verification.isVerified) {
            return false;
        }
        
        return block.timestamp <= verification.verificationTime + verification.expiryDuration;
    }

    /**
     * @dev Get creator verification status with details
     */
    function getCreatorVerificationStatus(address creator) external view returns (
        bool isVerified,
        uint256 verificationTime,
        bool isExpired
    ) {
        CreatorVerification memory verification = creatorVerifications[creator];
        isVerified = verification.isVerified;
        verificationTime = verification.verificationTime;
        isExpired = verification.isVerified && 
                   (block.timestamp > verification.verificationTime + verification.expiryDuration);
    }

    /**
     * @dev Create a single agent (only verified creators)
     */
    function createAgent(
        AgentDataLib.AgentParams calldata params,
        uint256 initialMint
    ) external payable nonReentrant whenNotPaused onlyVerifiedCreator returns (uint256) {
        require(msg.value >= mintingFee, "Insufficient minting fee");
        ValidationLib.validateAgentParams(params, initialMint);
        require(!agentStorage.isHashUsed(params.lighthouseHash), "Lighthouse hash already used");

        // Verify lighthouse hash matches creator's verification
        CreatorVerification memory verification = creatorVerifications[msg.sender];
        require(
            keccak256(abi.encodePacked(params.lighthouseHash)) == 
            keccak256(abi.encodePacked(verification.lighthouseHash)),
            "Lighthouse hash mismatch with verification"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        agentStorage.storeAgent(tokenId, params, initialMint);

        if (initialMint > 0) {
            _mint(msg.sender, tokenId, initialMint, "");
        }

        // Refund excess payment
        if (msg.value > mintingFee) {
            payable(msg.sender).transfer(msg.value - mintingFee);
        }

        emit AgentCreated(tokenId, msg.sender, params.name);
        return tokenId;
    }

    /**
     * @dev Batch create agents (only verified creators)
     */
    function batchCreateAgents(
        AgentDataLib.AgentParams[] calldata params,
        uint256[] calldata initialMints
    ) external payable nonReentrant whenNotPaused onlyVerifiedCreator returns (uint256[] memory) {
        ValidationLib.validateBatchSize(params.length, maxBatchSize);
        require(params.length == initialMints.length, "Length mismatch");
        require(msg.value >= mintingFee * params.length, "Insufficient minting fee");

        uint256[] memory tokenIds = new uint256[](params.length);

        for (uint256 i = 0; i < params.length; i++) {
            ValidationLib.validateAgentParams(params[i], initialMints[i]);
            require(!agentStorage.isHashUsed(params[i].lighthouseHash), "Lighthouse hash already used");

            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            tokenIds[i] = tokenId;

            agentStorage.storeAgent(tokenId, params[i], initialMints[i]);

            if (initialMints[i] > 0) {
                _mint(msg.sender, tokenId, initialMints[i], "");
            }

            emit AgentCreated(tokenId, msg.sender, params[i].name);
        }

        // Refund excess payment
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

        // Creator check with verification
        if (msg.sender != core.creator) {
            require(minting.allowPublicMint, "Public minting not allowed");
            PaymentLib.processPayment(
                core.creator,
                amount,
                minting.mintPrice,
                platformFeePercentage,
                msg.value
            );
        } else {
            require(isCreatorVerified(core.creator), "Creator verification expired");
        }

        agentStorage.updateSupply(tokenId, minting.currentSupply + amount);
        _mint(to, tokenId, amount, "");
        
        emit AgentMinted(tokenId, to, amount);
    }

    // ... (other functions remain the same as in original contract)

    // Owner functions for trusted node management
    function addTrustedNode(address nodeAddress) external onlyOwner {
        require(nodeAddress != address(0), "Invalid node address");
        require(!trustedLighthouseNodes[nodeAddress], "Node already trusted");
        
        trustedLighthouseNodes[nodeAddress] = true;
        trustedNodesList.push(nodeAddress);
        
        emit TrustedNodeAdded(nodeAddress);
    }

    function removeTrustedNode(address nodeAddress) external onlyOwner {
        require(trustedLighthouseNodes[nodeAddress], "Node not trusted");
        
        trustedLighthouseNodes[nodeAddress] = false;
        
        // Remove from list
        for (uint256 i = 0; i < trustedNodesList.length; i++) {
            if (trustedNodesList[i] == nodeAddress) {
                trustedNodesList[i] = trustedNodesList[trustedNodesList.length - 1];
                trustedNodesList.pop();
                break;
            }
        }
        
        emit TrustedNodeRemoved(nodeAddress);
    }

    function setRequiredNodeSignatures(uint256 _required) external onlyOwner {
        require(_required > 0 && _required <= trustedNodesList.length, "Invalid requirement");
        requiredNodeSignatures = _required;
    }

    function setVerificationExpiryDuration(uint256 _duration) external onlyOwner {
        require(_duration >= 1 hours, "Duration too short");
        require(_duration <= 365 days, "Duration too long");
        verificationExpiryDuration = _duration;
    }

    // View functions
    function getTrustedNodes() external view returns (address[] memory) {
        return trustedNodesList;
    }

    function getCreatorVerificationData(address creator) external view returns (
        bool isVerified,
        uint256 verificationTime,
        string memory lighthouseHash,
        VerificationData memory data,
        bool isExpired
    ) {
        CreatorVerification memory verification = creatorVerifications[creator];
        isVerified = verification.isVerified;
        verificationTime = verification.verificationTime;
        lighthouseHash = verification.lighthouseHash;
        data = verification.data;
        isExpired = verification.isVerified && 
                   (block.timestamp > verification.verificationTime + verification.expiryDuration);
    }

    // Emergency functions
    function emergencyRemoveVerification(address creator) external onlyOwner {
        delete creatorVerifications[creator];
    }

    function emergencyPauseVerifications() external onlyOwner {
        // Could add a pause mechanism for verifications if needed
    }
}
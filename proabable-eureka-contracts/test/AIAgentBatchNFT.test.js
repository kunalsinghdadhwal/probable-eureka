const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIAgentBatchNFT", function () {
  let aiAgentNFT;
  let agentStorage;
  let owner;
  let creator;
  let minter;
  let addrs;

  const MINTING_FEE = ethers.parseEther("0.001");
  const MINT_PRICE = ethers.parseEther("0.01");
  const PLATFORM_FEE_PERCENTAGE = 250; // 2.5%

  beforeEach(async function () {
    [owner, creator, minter, ...addrs] = await ethers.getSigners();

    // Deploy AgentStorage first
    const AgentStorage = await ethers.getContractFactory("AgentStorage");
    agentStorage = await AgentStorage.deploy();
    await agentStorage.waitForDeployment();

    // Deploy AIAgentBatchNFT
    const AIAgentBatchNFT = await ethers.getContractFactory("AIAgentBatchNFT");
    aiAgentNFT = await AIAgentBatchNFT.deploy(await agentStorage.getAddress());
    await aiAgentNFT.waitForDeployment();

    // Set main contract in storage
    await agentStorage.setMainContract(await aiAgentNFT.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await aiAgentNFT.owner()).to.equal(owner.address);
    });

    it("Should set the right storage contract", async function () {
      expect(await aiAgentNFT.agentStorage()).to.equal(await agentStorage.getAddress());
    });

    it("Should set default values", async function () {
      expect(await aiAgentNFT.mintingFee()).to.equal(MINTING_FEE);
      expect(await aiAgentNFT.maxBatchSize()).to.equal(20);
      expect(await aiAgentNFT.platformFeePercentage()).to.equal(PLATFORM_FEE_PERCENTAGE);
      expect(await aiAgentNFT.mintingPaused()).to.be.false;
    });
  });

  describe("Agent Creation", function () {
    const agentParams = {
      name: "Test Agent",
      description: "A test AI agent",
      lighthouseHash: "QmTestHash123",
      agentType: "classification",
      datasetSize: 1000,
      trainingEpochs: 100,
      accuracy: 9500, // 95%
      maxSupply: 100,
      mintPrice: MINT_PRICE,
      allowPublicMint: true
    };

    it("Should create a single agent", async function () {
      const tx = await aiAgentNFT.connect(creator).createAgent(agentParams, 10, {
        value: MINTING_FEE
      });
      await tx.wait();

      const tokenId = 0;
      const agent = await aiAgentNFT.getAgent(tokenId);
      
      expect(agent.core.name).to.equal(agentParams.name);
      expect(agent.core.creator).to.equal(creator.address);
      expect(agent.minting.currentSupply).to.equal(10);
      expect(agent.minting.maxSupply).to.equal(agentParams.maxSupply);
    });

    it("Should emit AgentCreated event", async function () {
      await expect(
        aiAgentNFT.connect(creator).createAgent(agentParams, 10, {
          value: MINTING_FEE
        })
      ).to.emit(aiAgentNFT, "AgentCreated")
        .withArgs(0, creator.address, agentParams.name);
    });

    it("Should reject creation with insufficient fee", async function () {
      await expect(
        aiAgentNFT.connect(creator).createAgent(agentParams, 10, {
          value: MINTING_FEE - 1n
        })
      ).to.be.revertedWith("Insufficient fee");
    });

    it("Should reject creation with empty name", async function () {
      const invalidParams = { ...agentParams, name: "" };
      await expect(
        aiAgentNFT.connect(creator).createAgent(invalidParams, 10, {
          value: MINTING_FEE
        })
      ).to.be.revertedWith("Empty name");
    });

    it("Should reject creation with used hash", async function () {
      await aiAgentNFT.connect(creator).createAgent(agentParams, 10, {
        value: MINTING_FEE
      });

      await expect(
        aiAgentNFT.connect(creator).createAgent(agentParams, 10, {
          value: MINTING_FEE
        })
      ).to.be.revertedWith("Hash used");
    });
  });

  describe("Batch Agent Creation", function () {
    const agentParams1 = {
      name: "Test Agent 1",
      description: "First test agent",
      lighthouseHash: "QmTestHash1",
      agentType: "classification",
      datasetSize: 1000,
      trainingEpochs: 100,
      accuracy: 9500,
      maxSupply: 100,
      mintPrice: MINT_PRICE,
      allowPublicMint: true
    };

    const agentParams2 = {
      name: "Test Agent 2",
      description: "Second test agent",
      lighthouseHash: "QmTestHash2",
      agentType: "regression",
      datasetSize: 2000,
      trainingEpochs: 200,
      accuracy: 9200,
      maxSupply: 50,
      mintPrice: MINT_PRICE,
      allowPublicMint: false
    };

    it("Should create multiple agents in batch", async function () {
      const params = [agentParams1, agentParams2];
      const initialMints = [5, 10];

      const tx = await aiAgentNFT.connect(creator).batchCreateAgents(params, initialMints, {
        value: MINTING_FEE * 2n
      });
      await tx.wait();

      const agent1 = await aiAgentNFT.getAgent(0);
      const agent2 = await aiAgentNFT.getAgent(1);

      expect(agent1.core.name).to.equal(agentParams1.name);
      expect(agent2.core.name).to.equal(agentParams2.name);
      expect(agent1.minting.currentSupply).to.equal(5);
      expect(agent2.minting.currentSupply).to.equal(10);
    });

    it("Should reject batch creation with mismatched lengths", async function () {
      const params = [agentParams1];
      const initialMints = [5, 10];

      await expect(
        aiAgentNFT.connect(creator).batchCreateAgents(params, initialMints, {
          value: MINTING_FEE * 2n
        })
      ).to.be.revertedWith("Length mismatch");
    });

    it("Should reject batch creation exceeding max batch size", async function () {
      const params = new Array(21).fill(agentParams1);
      const initialMints = new Array(21).fill(5);

      await expect(
        aiAgentNFT.connect(creator).batchCreateAgents(params, initialMints, {
          value: MINTING_FEE * 21n
        })
      ).to.be.revertedWith("Invalid batch size");
    });
  });

  describe("Minting", function () {
    let tokenId;

    beforeEach(async function () {
      const agentParams = {
        name: "Test Agent",
        description: "A test AI agent",
        lighthouseHash: "QmTestHash123",
        agentType: "classification",
        datasetSize: 1000,
        trainingEpochs: 100,
        accuracy: 9500,
        maxSupply: 100,
        mintPrice: MINT_PRICE,
        allowPublicMint: true
      };

      await aiAgentNFT.connect(creator).createAgent(agentParams, 10, {
        value: MINTING_FEE
      });
      tokenId = 0;
    });

    it("Should mint tokens for existing agent", async function () {
      const amount = 5;
      const totalCost = MINT_PRICE * BigInt(amount);

      await aiAgentNFT.connect(minter).mintAgent(tokenId, amount, minter.address, {
        value: totalCost
      });

      const balance = await aiAgentNFT.balanceOf(minter.address, tokenId);
      expect(balance).to.equal(amount);
    });

    it("Should reject minting when not active", async function () {
      await aiAgentNFT.connect(creator).toggleAgentStatus(tokenId);
      
      await expect(
        aiAgentNFT.connect(minter).mintAgent(tokenId, 5, minter.address, {
          value: MINT_PRICE * 5n
        })
      ).to.be.revertedWith("Not active");
    });

    it("Should reject minting when exceeding supply", async function () {
      await expect(
        aiAgentNFT.connect(minter).mintAgent(tokenId, 95, minter.address, {
          value: MINT_PRICE * 95n
        })
      ).to.be.revertedWith("Exceeds supply");
    });

    it("Should reject public minting when not allowed", async function () {
      await aiAgentNFT.connect(creator).updateAgent(
        tokenId,
        "",
        "",
        MINT_PRICE,
        false
      );

      await expect(
        aiAgentNFT.connect(minter).mintAgent(tokenId, 5, minter.address, {
          value: MINT_PRICE * 5n
        })
      ).to.be.revertedWith("No public mint");
    });
  });

  describe("Agent Management", function () {
    let tokenId;

    beforeEach(async function () {
      const agentParams = {
        name: "Test Agent",
        description: "A test AI agent",
        lighthouseHash: "QmTestHash123",
        agentType: "classification",
        datasetSize: 1000,
        trainingEpochs: 100,
        accuracy: 9500,
        maxSupply: 100,
        mintPrice: MINT_PRICE,
        allowPublicMint: true
      };

      await aiAgentNFT.connect(creator).createAgent(agentParams, 10, {
        value: MINTING_FEE
      });
      tokenId = 0;
    });

    it("Should update agent information", async function () {
      const newName = "Updated Agent";
      const newDescription = "Updated description";
      const newMintPrice = ethers.parseEther("0.02");

      await aiAgentNFT.connect(creator).updateAgent(
        tokenId,
        newName,
        newDescription,
        newMintPrice,
        false
      );

      const agent = await aiAgentNFT.getAgent(tokenId);
      expect(agent.core.name).to.equal(newName);
      expect(agent.core.description).to.equal(newDescription);
      expect(agent.minting.mintPrice).to.equal(newMintPrice);
      expect(agent.minting.allowPublicMint).to.be.false;
    });

    it("Should set agent tags", async function () {
      const tags = ["AI", "ML", "Classification"];

      await aiAgentNFT.connect(creator).setAgentTags(tokenId, tags);

      const agentTags = await agentStorage.getTags(tokenId);
      expect(agentTags).to.deep.equal(tags);
    });

    it("Should toggle agent status", async function () {
      await aiAgentNFT.connect(creator).toggleAgentStatus(tokenId);

      const agent = await aiAgentNFT.getAgent(tokenId);
      expect(agent.minting.isActive).to.be.false;
    });

    it("Should reject non-creator operations", async function () {
      await expect(
        aiAgentNFT.connect(minter).updateAgent(
          tokenId,
          "New Name",
          "",
          MINT_PRICE,
          true
        )
      ).to.be.revertedWith("Not creator");
    });
  });

  describe("Owner Functions", function () {
    it("Should set minting fee", async function () {
      const newFee = ethers.parseEther("0.002");
      await aiAgentNFT.setMintingFee(newFee);
      expect(await aiAgentNFT.mintingFee()).to.equal(newFee);
    });

    it("Should set platform fee percentage", async function () {
      const newPercentage = 500; // 5%
      await aiAgentNFT.setPlatformFeePercentage(newPercentage);
      expect(await aiAgentNFT.platformFeePercentage()).to.equal(newPercentage);
    });

    it("Should set max batch size", async function () {
      const newBatchSize = 50;
      await aiAgentNFT.setMaxBatchSize(newBatchSize);
      expect(await aiAgentNFT.maxBatchSize()).to.equal(newBatchSize);
    });

    it("Should pause and unpause minting", async function () {
      await aiAgentNFT.pauseMinting();
      expect(await aiAgentNFT.mintingPaused()).to.be.true;

      await aiAgentNFT.unpauseMinting();
      expect(await aiAgentNFT.mintingPaused()).to.be.false;
    });

    it("Should withdraw fees", async function () {
      // First create an agent to generate some fees
      const agentParams = {
        name: "Test Agent",
        description: "A test AI agent",
        lighthouseHash: "QmTestHash123",
        agentType: "classification",
        datasetSize: 1000,
        trainingEpochs: 100,
        accuracy: 9500,
        maxSupply: 100,
        mintPrice: MINT_PRICE,
        allowPublicMint: true
      };

      await aiAgentNFT.connect(creator).createAgent(agentParams, 10, {
        value: MINTING_FEE
      });

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await aiAgentNFT.withdrawFees();
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const agentParams = {
        name: "Test Agent",
        description: "A test AI agent",
        lighthouseHash: "QmTestHash123",
        agentType: "classification",
        datasetSize: 1000,
        trainingEpochs: 100,
        accuracy: 9500,
        maxSupply: 100,
        mintPrice: MINT_PRICE,
        allowPublicMint: true
      };

      await aiAgentNFT.connect(creator).createAgent(agentParams, 10, {
        value: MINTING_FEE
      });
    });

    it("Should return correct URI", async function () {
      const uri = await aiAgentNFT.uri(0);
      expect(uri).to.equal("https://api.your-project.com/metadata/0");
    });

    it("Should return total agent types", async function () {
      expect(await aiAgentNFT.totalAgentTypes()).to.equal(1);
    });

    it("Should check if hash is used", async function () {
      expect(await aiAgentNFT.isHashUsed("QmTestHash123")).to.be.true;
      expect(await aiAgentNFT.isHashUsed("QmUnusedHash")).to.be.false;
    });

    it("Should return agents by creator", async function () {
      const creatorAgents = await aiAgentNFT.getAgentsByCreator(creator.address);
      expect(creatorAgents).to.deep.equal([0]);
    });
  });
});

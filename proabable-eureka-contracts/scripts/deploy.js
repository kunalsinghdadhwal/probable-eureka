const { ethers } = require("hardhat");

async function main() {
    // Deploy AgentStorage first
    const AgentStorage = await ethers.getContractFactory("AgentStorage");
    const agentStorage = await AgentStorage.deploy();
    await agentStorage.deployed();
    console.log("AgentStorage deployed to:", agentStorage.address);

    // Deploy AIAgentBatchNFT with trusted nodes
    const trustedNodes = [
        process.env.LIGHTHOUSE_NODE_1,
        process.env.LIGHTHOUSE_NODE_2,
        process.env.LIGHTHOUSE_NODE_3,
        process.env.LIGHTHOUSE_NODE_4,
        process.env.LIGHTHOUSE_NODE_5
    ].filter(addr => addr && addr !== '');

    const AIAgentBatchNFT = await ethers.getContractFactory("AIAgentBatchNFT");
    const nftContract = await AIAgentBatchNFT.deploy(
        agentStorage.address,
        trustedNodes
    );
    await nftContract.deployed();
    console.log("AIAgentBatchNFT deployed to:", nftContract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
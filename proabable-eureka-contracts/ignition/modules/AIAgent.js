const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AIAgentModule", (m) => {
  // Deploy AgentStorage first
  const agentStorage = m.contract("AgentStorage", []);

  // Deploy AIAgentBatchNFT with AgentStorage address
  const aiAgentNFT = m.contract("AIAgentBatchNFT", [agentStorage]);

  // Set the main contract in AgentStorage
  m.call(agentStorage, "setMainContract", [aiAgentNFT]);

  return { agentStorage, aiAgentNFT };
});

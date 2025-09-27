import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AIAgentModule", (m) => {
  const agentStorage = m.contract("AgentStorage", []);

  // Deploy AIAgentBatchNFT with AgentStorage address
  const aiAgentNFT = m.contract("AIAgentBatchNFT", [agentStorage]);

  // Set the main contract in AgentStorage
  m.call(agentStorage, "setMainContract", [aiAgentNFT]);

  return { agentStorage, aiAgentNFT };
});

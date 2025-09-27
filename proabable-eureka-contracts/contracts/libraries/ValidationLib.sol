// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AgentDataLib.sol";

/**
 * @title ValidationLib
 * @dev Library for validation logic
 */
library ValidationLib {
    function validateAgentParams(
        AgentDataLib.AgentParams memory params,
        uint256 initialMint
    ) internal pure {
        require(bytes(params.name).length > 0, "Empty name");
        require(bytes(params.lighthouseHash).length > 0, "Empty hash");
        require(params.accuracy <= 10000, "Invalid accuracy");
        require(params.maxSupply > 0, "Invalid supply");
        require(initialMint <= params.maxSupply, "Mint exceeds max");
    }

    function validateMint(
        uint256 currentSupply,
        uint256 maxSupply,
        uint256 amount,
        bool isActive
    ) internal pure {
        require(isActive, "Not active");
        require(currentSupply + amount <= maxSupply, "Exceeds supply");
    }

    function validateBatchSize(uint256 size, uint256 maxSize) internal pure {
        require(size > 0 && size <= maxSize, "Invalid batch size");
    }
}

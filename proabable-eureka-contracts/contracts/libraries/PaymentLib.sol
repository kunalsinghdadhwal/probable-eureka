// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PaymentLib
 * @dev Library for payment processing
 */
library PaymentLib {
    function processPayment(
        address creator,
        uint256 amount,
        uint256 mintPrice,
        uint256 platformFeePercentage,
        uint256 msgValue
    ) internal {
        uint256 totalCost = mintPrice * amount;
        require(msgValue >= totalCost, "Insufficient payment");
        
        if (totalCost > 0) {
            uint256 platformFee = (totalCost * platformFeePercentage) / 10000;
            uint256 creatorPayment = totalCost - platformFee;

            if (creatorPayment > 0) {
                (bool success, ) = payable(creator).call{value: creatorPayment}("");
                require(success, "Creator payment failed");
            }
        }

        // Refund excess
        if (msgValue > totalCost) {
            (bool success, ) = payable(msg.sender).call{value: msgValue - totalCost}("");
            require(success, "Refund failed");
        }
    }

    function calculateTotalCost(
        uint256[] memory amounts,
        uint256[] memory prices
    ) internal pure returns (uint256 total) {
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i] * prices[i];
        }
    }
}

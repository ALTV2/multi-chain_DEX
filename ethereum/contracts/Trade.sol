// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./OrderBook.sol";

// Контракт для выполнения ордеров из OrderBook
contract Trade is ReentrancyGuard {
    OrderBook public orderBook;

    event OrderExecuted(uint256 orderId, address executor, address creator, uint256 sellAmount, uint256 buyAmount);

    constructor(address _orderBookAddress) {
        require(_orderBookAddress != address(0), "Invalid OrderBook address");
        orderBook = OrderBook(_orderBookAddress);
    }

    // Выполнение ордера пользователем
    function executeOrder(uint256 _orderId) external nonReentrant {
        (, address creator, address tokenToSellAddr, address tokenToBuyAddr, uint256 sellAmount, uint256 buyAmount, bool active) = orderBook.orders(_orderId);
        require(active, "Order is not active");
        require(creator != msg.sender, "Cannot execute your own order");

        IERC20 tokenToBuy = IERC20(tokenToBuyAddr);
        IERC20 tokenToSell = IERC20(tokenToSellAddr);

        require(tokenToBuy.transferFrom(msg.sender, creator, buyAmount), "Token buy transfer failed");
        orderBook.moveTokensToTradeContract(_orderId);
        require(tokenToSell.transfer(msg.sender, sellAmount), "Token sell transfer failed");
        orderBook.deactivateOrder(_orderId);

        emit OrderExecuted(_orderId, msg.sender, creator, sellAmount, buyAmount);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./OrderBook.sol";

contract Trade is ReentrancyGuard {
    OrderBook public orderBook;

    event OrderExecuted(uint256 orderId, address executor, address creator, uint256 sellAmount, uint256 buyAmount);

    constructor(address _orderBookAddress) {
        require(_orderBookAddress != address(0), "Invalid OrderBook address");
        orderBook = OrderBook(_orderBookAddress);
    }

    function executeOrder(uint256 _orderId) external nonReentrant {
        (, address creator, address tokenToSellAddr, address tokenToBuyAddr, uint256 sellAmount, uint256 buyAmount, bool active) = orderBook.orders(_orderId);
        require(active, "Order is not active");
        require(creator != msg.sender, "Cannot execute your own order");

        IERC20 tokenToBuy = IERC20(tokenToBuyAddr);
        IERC20 tokenToSell = IERC20(tokenToSellAddr);

        // Проверка баланса и allowance
        require(tokenToBuy.balanceOf(msg.sender) >= buyAmount, "Insufficient balance");
        require(tokenToBuy.allowance(msg.sender, address(this)) >= buyAmount, "Insufficient allowance");
        require(tokenToSell.balanceOf(address(orderBook)) >= sellAmount, "OrderBook has insufficient balance");

//         перевод токенов из orderBook
        orderBook.moveTokensToTradeContract(_orderId);

        // Прямой перевод токенов
        require(tokenToBuy.transferFrom(msg.sender, creator, buyAmount), "Token buy transfer failed");
        require(tokenToSell.transferFrom(address(this), msg.sender, sellAmount), "Token sell transfer failed");

        // Деактивация ордера
        orderBook.deactivateOrder(_orderId);

        emit OrderExecuted(_orderId, msg.sender, creator, sellAmount, buyAmount);
    }
}
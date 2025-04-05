// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./OrderBook.sol";

/**
 * @title Trade
 * @dev Контракт для выполнения ордеров из OrderBook с поддержкой ERC20 и ETH.
 */
contract Trade is ReentrancyGuard {
    OrderBook public immutable orderBook;

    event OrderExecuted(
        uint256 indexed orderId,
        address indexed executor,
        address indexed creator,
        uint256 sellAmount,
        uint256 buyAmount,
        uint256 timestamp
    );

    constructor(address _orderBookAddress) {
        require(_orderBookAddress != address(0), "Invalid OrderBook address");
        orderBook = OrderBook(_orderBookAddress);
    }

    /**
     * @dev Выполнение ордера.
     * @param _orderId ID ордера.
     */
    function executeOrder(uint256 _orderId) external payable nonReentrant {
        (
            uint256 id,
            address creator,
            address tokenToSellAddr,
            address tokenToBuyAddr,
            uint256 sellAmount,
            uint256 buyAmount,
            bool active
        ) = orderBook.orders(_orderId);
        require(id == _orderId && id <= orderBook.orderCounter(), "Order does not exist");
        require(active, "Order is not active");
        require(creator != msg.sender, "Cannot execute own order");

        // Обработка токена/ETH для покупки
        if (tokenToBuyAddr == address(0)) {
            require(msg.value == buyAmount, "Incorrect ETH amount sent");
            (bool sentToCreator, ) = payable(creator).call{value: buyAmount}("");
            require(sentToCreator, "ETH transfer to creator failed");
            // Возврат избыточного ETH
            if (msg.value > buyAmount) {
                (bool sentBack, ) = payable(msg.sender).call{value: msg.value - buyAmount}("");
                require(sentBack, "ETH refund failed");
            }
        } else {
            IERC20 tokenToBuy = IERC20(tokenToBuyAddr);
            require(
                tokenToBuy.allowance(msg.sender, address(this)) >= buyAmount,
                "Insufficient allowance"
            );
            require(
                tokenToBuy.transferFrom(msg.sender, creator, buyAmount),
                "Token buy transfer failed"
            );
        }

        // Перемещение активов из OrderBook
        orderBook.moveTokensToTradeContract(_orderId);

        // Передача активов исполнителю
        if (tokenToSellAddr == address(0)) {
            (bool sent, ) = payable(msg.sender).call{value: sellAmount}("");
            require(sent, "ETH transfer to executor failed");
        } else {
            IERC20 tokenToSell = IERC20(tokenToSellAddr);
            require(tokenToSell.transfer(msg.sender, sellAmount), "Token sell transfer failed");
        }

        orderBook.deactivateOrder(_orderId);
        emit OrderExecuted(_orderId, msg.sender, creator, sellAmount, buyAmount, block.timestamp);
    }

    /**
     * @dev Проверка баланса ETH контракта.
     */
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
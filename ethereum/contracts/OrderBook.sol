// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TokenManager.sol";

// Контракт для управления книгой ордеров DEX
contract OrderBook is ReentrancyGuard, Ownable {
    TokenManager public tokenManager;
    address public tradeContract;

    struct Order {
        uint256 id;
        address creator;
        address tokenToSell;
        address tokenToBuy;
        uint256 sellAmount;
        uint256 buyAmount;
        bool active;
    }

    mapping(uint256 => Order) public orders;
    uint256 public orderCounter;

    event OrderCreated(uint256 indexed id, address indexed creator, address tokenToSell, address tokenToBuy, uint256 sellAmount, uint256 buyAmount);
    event OrderCancelled(uint256 indexed id);
    event OrderExecuted(uint256 indexed id, address indexed executor);

//    modifier onlyTrade() {
//        require(msg.sender == tradeContract, "Only Trade contract can call this");
//        _;
//    }

    constructor(address _tokenManagerAddress) Ownable(msg.sender) {
        require(_tokenManagerAddress != address(0), "Invalid TokenManager address");
        tokenManager = TokenManager(_tokenManagerAddress);
    }

    // Создание нового ордера для обмена токенов
    function createOrder(
        address _tokenToSell,
        address _tokenToBuy,
        uint256 _sellAmount,
        uint256 _buyAmount
    ) external nonReentrant returns (uint256) {
        require(_tokenToSell != address(0) && _tokenToBuy != address(0), "Invalid token address");
        require(_sellAmount > 0 && _buyAmount > 0, "Amounts must be greater than 0");
        require(tokenManager.supportedTokens(_tokenToSell), "Token to sell not supported");
        require(tokenManager.supportedTokens(_tokenToBuy), "Token to buy not supported");

        IERC20 tokenToSell = IERC20(_tokenToSell);
        require(tokenToSell.transferFrom(msg.sender, address(this), _sellAmount), "Token transfer failed");

        orderCounter++;
        uint256 orderId = orderCounter;

        orders[orderId] = Order({
            id: orderId,
            creator: msg.sender,
            tokenToSell: _tokenToSell,
            tokenToBuy: _tokenToBuy,
            sellAmount: _sellAmount,
            buyAmount: _buyAmount,
            active: true
        });

        emit OrderCreated(orderId, msg.sender, _tokenToSell, _tokenToBuy, _sellAmount, _buyAmount);
        return orderId;
    }

    // Отмена ордера создателем
    function cancelOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.active, "Order is not active");
        require(order.creator == msg.sender, "Not the order creator");

        IERC20 tokenToSell = IERC20(order.tokenToSell);
        require(tokenToSell.transfer(order.creator, order.sellAmount), "Token return failed");

        order.active = false;
        emit OrderCancelled(_orderId);
    }

    // Деактивация ордера (только для Trade контракта)
    function deactivateOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(order.active, "Order is not active");
        order.active = false;
    }

    // Установка адреса Trade контракта (только владелец)
    function setTradeContract(address _tradeContract) external onlyOwner {
        require(_tradeContract != address(0), "Invalid Trade contract address");
        tradeContract = _tradeContract;
    }

    // Перемещение токенов в Trade контракт (только для Trade)
    function moveTokensToTradeContract(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(order.sellAmount > 0, "Order does not exist or has zero amount");
        require(order.active, "Order is not active");

        IERC20 tokenToSell = IERC20(order.tokenToSell);
        require(tokenToSell.transfer(tradeContract, order.sellAmount), "Token move to Trade failed");
    }
}
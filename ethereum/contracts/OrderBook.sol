// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TokenManager.sol";

/**
 * @title OrderBook
 * @dev Контракт для управления книгой ордеров DEX с поддержкой ERC20 и ETH.
 * Позволяет создавать, отменять и выполнять ордера с опциональным ограничением токенов.
 */
contract OrderBook is ReentrancyGuard, Ownable {
    TokenManager public immutable tokenManager; // Контракт управления токенами
    address public tradeContract; // Адрес контракта Trade
    bool public restrictTokens; // Флаг ограничения токенов (по умолчанию false)

    struct Order {
        uint256 id; // Уникальный ID ордера
        address creator; // Создатель ордера
        address tokenToSell; // Токен для продажи (address(0) для ETH)
        address tokenToBuy; // Токен для покупки (address(0) для ETH)
        uint256 sellAmount; // Количество для продажи
        uint256 buyAmount; // Количество для покупки
        bool active; // Статус активности
    }

    mapping(uint256 => Order) public orders; // Хранилище ордеров
    uint256 public orderCounter; // Счетчик ордеров

    // События для логирования
    event OrderCreated(
        uint256 indexed id,
        address indexed creator,
        address tokenToSell,
        address tokenToBuy,
        uint256 sellAmount,
        uint256 buyAmount,
        uint256 timestamp
    );
    event OrderCancelled(uint256 indexed id, address indexed creator, uint256 timestamp);
    event OrderExecuted(uint256 indexed id, address indexed executor, uint256 timestamp);
    event TradeContractUpdated(address indexed oldTradeContract, address indexed newTradeContract, uint256 timestamp);
    event TokenRestrictionToggled(bool restricted, uint256 timestamp);

    modifier onlyTrade() {
        require(msg.sender == tradeContract, "Only Trade contract can call this");
        _;
    }

    constructor(address _tokenManagerAddress) Ownable(msg.sender) {
        require(_tokenManagerAddress != address(0), "Invalid TokenManager address");
        tokenManager = TokenManager(_tokenManagerAddress);
        restrictTokens = false; // Ограничение токенов отключено по умолчанию
    }

    /**
     * @dev Создание нового ордера.
     * @param _tokenToSell Токен/ETH для продажи.
     * @param _tokenToBuy Токен/ETH для покупки.
     * @param _sellAmount Количество для продажи.
     * @param _buyAmount Количество для покупки.
     * @return orderId ID созданного ордера.
     */
    function createOrder(
        address _tokenToSell,
        address _tokenToBuy,
        uint256 _sellAmount,
        uint256 _buyAmount
    ) external payable nonReentrant returns (uint256) {
        require(_sellAmount > 0 && _buyAmount > 0, "Amounts must be greater than 0");
        require(_tokenToSell != _tokenToBuy, "Cannot trade same asset");

        // Проверка токенов при включенном ограничении
        if (restrictTokens) {
            if (_tokenToSell != address(0)) {
                require(tokenManager.supportedTokens(_tokenToSell), "Token to sell not supported");
            }
            if (_tokenToBuy != address(0)) {
                require(tokenManager.supportedTokens(_tokenToBuy), "Token to buy not supported");
            }
        }

        // Обработка ETH или ERC20
        if (_tokenToSell == address(0)) {
            require(msg.value == _sellAmount, "Incorrect ETH amount sent");
            // Избыточный ETH возвращается отправителю
            if (msg.value > _sellAmount) {
                (bool sent, ) = payable(msg.sender).call{value: msg.value - _sellAmount}("");
                require(sent, "ETH refund failed");
            }
        } else {
            IERC20 tokenToSell = IERC20(_tokenToSell);
            require(
                tokenToSell.allowance(msg.sender, address(this)) >= _sellAmount,
                "Insufficient allowance"
            );
            require(
                tokenToSell.transferFrom(msg.sender, address(this), _sellAmount),
                "Token transfer failed"
            );
        }

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

        emit OrderCreated(orderId, msg.sender, _tokenToSell, _tokenToBuy, _sellAmount, _buyAmount, block.timestamp);
        return orderId;
    }

    /**
     * @dev Отмена ордера с возвратом активов.
     * @param _orderId ID ордера.
     */
    function cancelOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(_orderId <= orderCounter, "Order does not exist");
        require(order.active, "Order is not active");
        require(order.creator == msg.sender, "Not the order creator");

        uint256 amountToReturn = order.sellAmount;
        order.sellAmount = 0; // Предотвращение повторного вывода

        if (order.tokenToSell == address(0)) {
            (bool sent, ) = payable(order.creator).call{value: amountToReturn}("");
            require(sent, "ETH return failed");
        } else {
            IERC20 tokenToSell = IERC20(order.tokenToSell);
            require(tokenToSell.transfer(order.creator, amountToReturn), "Token return failed");
        }

        order.active = false;
        emit OrderCancelled(_orderId, msg.sender, block.timestamp);
    }

    /**
     * @dev Деактивация ордера (только Trade).
     * @param _orderId ID ордера.
     */
    function deactivateOrder(uint256 _orderId) external onlyTrade {
        Order storage order = orders[_orderId];
        require(_orderId <= orderCounter, "Order does not exist");
        require(order.active, "Order is not active");
        order.active = false;
    }

    /**
     * @dev Установка адреса Trade (только владелец).
     * @param _tradeContract Новый адрес Trade.
     */
    function setTradeContract(address _tradeContract) external onlyOwner {
        require(_tradeContract != address(0), "Invalid Trade contract address");
        emit TradeContractUpdated(tradeContract, _tradeContract, block.timestamp);
        tradeContract = _tradeContract;
    }

    /**
     * @dev Перемещение активов в Trade (только Trade).
     * @param _orderId ID ордера.
     */
    function moveTokensToTradeContract(uint256 _orderId) external onlyTrade {
        Order storage order = orders[_orderId];
        require(_orderId <= orderCounter, "Order does not exist");
        require(order.active, "Order is not active");
        require(order.sellAmount > 0, "No funds to move");

        uint256 amountToMove = order.sellAmount;
        order.sellAmount = 0; // Предотвращение повторного вывода

        if (order.tokenToSell == address(0)) {
            (bool sent, ) = payable(tradeContract).call{value: amountToMove}("");
            require(sent, "ETH transfer to Trade failed");
        } else {
            IERC20 tokenToSell = IERC20(order.tokenToSell);
            require(tokenToSell.transfer(tradeContract, amountToMove), "Token transfer to Trade failed");
        }
    }

    /**
     * @dev Переключение ограничения токенов (только владелец).
     * @param _restricted Новый статус ограничения.
     */
    function toggleTokenRestriction(bool _restricted) external onlyOwner {
        require(restrictTokens != _restricted, "Restriction already set to this value");
        restrictTokens = _restricted;
        emit TokenRestrictionToggled(_restricted, block.timestamp);
    }

    /**
     * @dev Проверка баланса ETH контракта.
     */
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
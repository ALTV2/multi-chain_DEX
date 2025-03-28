// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Контракт для управления списком поддерживаемых токенов
contract TokenManager is Ownable {
    mapping(address => bool) public supportedTokens;

    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "Invalid initial owner");
    }

    // Добавление нового токена в список поддерживаемых
    function addToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!supportedTokens[_token], "Token already supported");
        supportedTokens[_token] = true;
        emit TokenAdded(_token);
    }

    // Удаление токена из списка поддерживаемых
    function removeToken(address _token) external onlyOwner {
        require(supportedTokens[_token], "Token not supported");
        supportedTokens[_token] = false;
        emit TokenRemoved(_token);
    }

    // Проверка поддержки токена
    function isTokenSupported(address _token) external view returns (bool) {
        return supportedTokens[_token];
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenManager is Ownable {
    // Хранение списка поддерживаемых токенов
    mapping(address => bool) public supportedTokens;

    // События
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    constructor(address initialOwner) Ownable(initialOwner) {
        // Дополнительная логика конструктора, если нужно
    }

    // Добавление токена (только владелец)
    function addToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!supportedTokens[_token], "Token already supported");
        supportedTokens[_token] = true;
        emit TokenAdded(_token);
    }

    // Удаление токена (только владелец)
    function removeToken(address _token) external onlyOwner {
        require(supportedTokens[_token], "Token not supported");
        supportedTokens[_token] = false;
        emit TokenRemoved(_token);
    }

    // Проверка, поддерживается ли токен
    function isTokenSupported(address _token) external view returns (bool) {
        return supportedTokens[_token];
    }
}
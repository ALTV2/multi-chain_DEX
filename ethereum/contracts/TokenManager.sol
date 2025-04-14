// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenManager
 * @dev Контракт для управления списком поддерживаемых токенов.
 */
contract TokenManager is Ownable {
    mapping(address => bool) public supportedTokens; // Список поддерживаемых токенов
    address[] private tokenList; // Список адресов токенов для итерации

    event TokenAdded(address indexed token, uint256 timestamp);
    event TokenRemoved(address indexed token, uint256 timestamp);

    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "Invalid initial owner");
    }

    /**
     * @dev Добавление токена в список поддерживаемых.
     * @param _token Адрес токена (не может быть address(0)).
     */
    function addToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!supportedTokens[_token], "Token already supported");
        supportedTokens[_token] = true;
        tokenList.push(_token);
        emit TokenAdded(_token, block.timestamp);
    }

    /**
     * @dev Удаление токена из списка поддерживаемых.
     * @param _token Адрес токена.
     */
    function removeToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(supportedTokens[_token], "Token not supported");
        supportedTokens[_token] = false;
        // Удаление из tokenList
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == _token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        emit TokenRemoved(_token, block.timestamp);
    }

    /**
     * @dev Проверка поддержки токена.
     * @param _token Адрес токена.
     * @return Поддерживается ли токен.
     */
    function isTokenSupported(address _token) external view returns (bool) {
        return supportedTokens[_token];
    }

    /**
     * @dev Получение списка поддерживаемых токенов.
     * @return Массив адресов поддерживаемых токенов.
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
}
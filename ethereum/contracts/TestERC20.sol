// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Тестовый ERC20 токен с возможностью минтинга
contract TestERC20 is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}

    // Выпуск новых токенов (только владелец)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
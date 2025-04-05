// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestERC20
 * @dev Тестовый токен ERC20 с функцией минтинга для тестирования DEX.
 */
contract TestERC20 is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        _mint(to, amount);
    }
}
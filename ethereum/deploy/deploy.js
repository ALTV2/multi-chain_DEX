// deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Деплой контрактов с аккаунта:", deployer.address);
  console.log("Баланс деплоера:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Деплой TokenManager
  const TokenManager = await ethers.getContractFactory("TokenManager");
  const tokenManager = await TokenManager.deploy(deployer.address);
  await tokenManager.waitForDeployment();
  console.log("TokenManager задеплоен по адресу:", tokenManager.target);

  // Деплой OrderBook
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = await OrderBook.deploy(tokenManager.target);
  await orderBook.waitForDeployment();
  console.log("OrderBook задеплоен по адресу:", orderBook.target);

  // Деплой Trade
  const Trade = await ethers.getContractFactory("Trade");
  const trade = await Trade.deploy(orderBook.target);
  await trade.waitForDeployment();
  console.log("Trade задеплоен по адресу:", trade.target);

  // Установка адреса Trade в OrderBook
  const setTradeTx = await orderBook.setTradeContract(trade.target);
  await setTradeTx.wait();
  console.log("Trade контракт установлен в OrderBook. Транзакция:", setTradeTx.hash);

//  // Деплой первого тестового токена (TSTA)
//  const TestERC20 = await ethers.getContractFactory("TestERC20");
//  const tokenA = await TestERC20.deploy("Test Token A", "TSTA");
//  await tokenA.waitForDeployment();
//  console.log("Test Token A (TSTA) задеплоен по адресу:", tokenA.target);
//
//  // Деплой второго тестового токена (TSTB)
//  const tokenB = await TestERC20.deploy("Test Token B", "TSTB");
//  await tokenB.waitForDeployment();
//  console.log("Test Token B (TSTB) задеплоен по адресу:", tokenB.target);

  // Итоговые адреса контрактов
  console.log("\nИтоговые адреса контрактов:");
  console.log("TokenManager:", tokenManager.target);
  console.log("OrderBook:", orderBook.target);
  console.log("Trade:", trade.target);
  console.log("Test Token A (TSTA):", tokenA.target);
  console.log("Test Token B (TSTB):", tokenB.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Ошибка при деплое:", error);
    process.exit(1);
  });
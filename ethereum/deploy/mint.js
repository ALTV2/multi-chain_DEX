// mint.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Минтинг токенов с аккаунта:", deployer.address);
  console.log("Баланс деплоера:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Адреса контрактов (нужно заменить на реальные после деплоя)
  const tokenAAddress = "YOUR_TSTA_ADDRESS_HERE"; // Замените после деплоя
  const tokenBAddress = "YOUR_TSTB_ADDRESS_HERE"; // Замените после деплоя

  // Подключение к контрактам TSTA и TSTB
  const TestERC20 = await ethers.getContractFactory("TestERC20");
  const tokenA = TestERC20.attach(tokenAAddress);
  const tokenB = TestERC20.attach(tokenBAddress);

  // Минтинг токенов для деплоера (1000 единиц каждого)
  const mintAmount = ethers.parseEther("1000");

  const mintTokenATx = await tokenA.mint(deployer.address, mintAmount);
  await mintTokenATx.wait();
  console.log("1000 TSTA заминчены для:", deployer.address, "Транзакция:", mintTokenATx.hash);

  const mintTokenBTx = await tokenB.mint(deployer.address, mintAmount);
  await mintTokenBTx.wait();
  console.log("1000 TSTB заминчены для:", deployer.address, "Транзакция:", mintTokenBTx.hash);

  // Проверка балансов токенов
  const balanceA = await tokenA.balanceOf(deployer.address);
  const balanceB = await tokenB.balanceOf(deployer.address);
  console.log("Баланс TSTA деплоера:", ethers.formatEther(balanceA));
  console.log("Баланс TSTB деплоера:", ethers.formatEther(balanceB));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Ошибка при минтинге:", error);
    process.exit(1);
  });
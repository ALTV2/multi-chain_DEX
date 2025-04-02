async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Деплой контрактов с аккаунта:", deployer.address);

  const TokenManager = await ethers.getContractFactory("TokenManager");
  const tokenManager = await TokenManager.deploy(deployer.address);
//  await tokenManager.deployed();
  console.log("TokenManager задеплоен по адресу:", tokenManager.target);

  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = await OrderBook.deploy(tokenManager.target);
//  await orderBook.deployed();
  console.log("OrderBook задеплоен по адресу:", orderBook.target);

  const Trade = await ethers.getContractFactory("Trade");
  const trade = await Trade.deploy(orderBook.target);
//  await trade.deployed();
  console.log("Trade задеплоен по адресу:", trade.target);

  // Развертывание первого тестового токена (Test Token A)
  const TestERC20 = await ethers.getContractFactory("TestERC20");
  const tokenA = await TestERC20.deploy("Test Token A", "TSTA");
//  await tokenA.deployed();
  console.log("Test Token A (TSTA) задеплоен по адресу:", tokenA.target);

  // Развертывание второго тестового токена (Test Token B)
  const tokenB = await TestERC20.deploy("Test Token B", "TSTB");
//  await tokenB.deployed();
  console.log("Test Token B (TSTB) задеплоен по адресу:", tokenB.target);

  // Опционально: минтинг токенов для деплоера (например, 1000 единиц каждого)
  await tokenA.mint(deployer.address, ethers.parseEther("1000"));
  await tokenB.mint(deployer.address, ethers.parseEther("1000"));
  console.log("1000 TSTA и 1000 TSTB заминчены для:", deployer.address);

  // нужно вызывать метод setTradeContract В ордер буки и передать адрес контракта
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
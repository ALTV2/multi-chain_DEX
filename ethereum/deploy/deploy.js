async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Деплой контрактов с аккаунта:", deployer.address);

  const TokenManager = await ethers.getContractFactory("TokenManager");
  const tokenManager = await TokenManager.deploy();
  await tokenManager.deployed();
  console.log("TokenManager задеплоен по адресу:", tokenManager.target);

  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = await OrderBook.deploy(tokenManager.target);
  await orderBook.deployed();
  console.log("OrderBook задеплоен по адресу:", orderBook.target);

  const Trade = await ethers.getContractFactory("Trade");
  const trade = await Trade.deploy(orderBook.target);
  await trade.deployed();
  console.log("Trade задеплоен по адресу:", trade.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
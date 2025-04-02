const { ethers } = require("hardhat");

async function main() {
    // Адрес уже задеплоенного контракта
    const contractAddress = "0xaE925718310E5aDF3Fa2d98c186BfbBEcC0D7cD5";

    // Получаем signer (аккаунт для отправки транзакции)
    const [signer] = await ethers.getSigners();

    // Подключение к контракту с signer'ом
    const Contract = await ethers.getContractFactory("OrderBook");
    const contract = await Contract.attach(contractAddress).connect(signer);

    // Отправляем транзакцию
    const tx = await contract.setTradeContract("0x7ec2b7D6F0492De75620C105ba67e6119CAAB754");
    await tx.wait();

    console.log("Токен добавлен, хэш транзакции:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
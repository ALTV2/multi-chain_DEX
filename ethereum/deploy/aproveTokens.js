const { ethers } = require("hardhat");

async function main() {
    // Адрес уже задеплоенного контракта
    const contractAddress = "0x22763589e1dd35d1FE86c51B0593E71677d72054";

    // Получаем signer (аккаунт для отправки транзакции)
    const [signer] = await ethers.getSigners();

    // Подключение к контракту с signer'ом
    const Contract = await ethers.getContractFactory("TokenManager");
    const contract = await Contract.attach(contractAddress).connect(signer);

    // Отправляем транзакцию
    const tx = await contract.addToken("0x20E2434C1f611D3E6C1D2947061ede1A16d04d17");
    await tx.wait();

    console.log("Токен добавлен, хэш транзакции:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
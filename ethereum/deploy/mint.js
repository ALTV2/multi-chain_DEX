const { ethers } = require("hardhat");

async function main() {
    // Адрес уже задеплоенного контракта
    const contractAddress = "0x20E2434C1f611D3E6C1D2947061ede1A16d04d17";

    // Подключение к контракту
    const Contract = await ethers.getContractFactory("TestERC20");
    const contract = await Contract.attach(contractAddress);

    // Сумма для минтинга (предположим, это 10 токенов)
    const amount = ethers.parseUnits("100", 18);
    // Вызов функции mint (пример с параметрами)
    const tx = await contract.mint("0x64Ab3C77F89a46aFB77E5BD4Fe54Cbe593fDF6ed", amount);
    await tx.wait();

    console.log("Mint выполнен, транзакция:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
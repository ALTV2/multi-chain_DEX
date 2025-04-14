const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x22763589e1dd35d1FE86c51B0593E71677d72054"; // Адрес вашего контракта
    const tokenToCheck = "0x3d857Fc3510246A050817C29ea7C434ab7EbA81A"; // Токен для проверки

    // Подключение к контракту
    const Contract = await ethers.getContractFactory("TokenManager");
    const contract = await Contract.attach(contractAddress);

    // Проверка поддержки токена
    const isSupported = await contract.isTokenSupported("0x3d857Fc3510246A050817C29ea7C434ab7EbA81A");
    console.log(`Токен ${tokenToCheck} поддерживается: ${isSupported}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
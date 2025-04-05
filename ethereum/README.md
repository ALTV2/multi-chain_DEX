# DEX Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

```shell
rm -rf node_modules package-lock.json
```
```shell
npm install --save-dev @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers@6 hardhat typescript ts-node @types/chai @types/mocha chai typechain @typechain/hardhat
npm install @openzeppelin/contracts
```


//
```shell
npx hardhat compile
```
```shell
npx hardhat clean
```
```shell
npx hardhat test
```

//deploy contracts
```shell
sudo npx hardhat run deploy/deploy.js --network sepolia
```
```shell
npx hardhat run deploy/setTradeContract.js --network sepolia
```
// кран https://www.alchemy.com/faucets/ethereum-sepolia

// нужно добавить возможность отключать апрувы токинов в ethereum
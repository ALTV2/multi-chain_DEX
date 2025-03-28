import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  networks: {
      sepolia: {
        url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      },
    },
};

export default config;
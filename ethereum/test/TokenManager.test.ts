import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TokenManager } from "../typechain-types";

describe("TokenManager", function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let tokenManager: TokenManager;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    const TokenManagerFactory = await ethers.getContractFactory("TokenManager");
    tokenManager = await TokenManagerFactory.deploy(owner.address);
  });

  it("should allow owner to add a token", async function () {
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    const newToken = await TestERC20Factory.deploy("NewToken", "NTK");

    await expect(tokenManager.connect(owner).addToken(newToken.target))
      .to.emit(tokenManager, "TokenAdded")
      .withArgs(newToken.target);
    expect(await tokenManager.supportedTokens(newToken.target)).to.be.true;
  });

  it("should not allow non-owner to add a token", async function () {
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    const newToken = await TestERC20Factory.deploy("NewToken", "NTK");

    await expect(
      tokenManager.connect(user1).addToken(newToken.target)
    ).to.be.revertedWithCustomError(tokenManager, "OwnableUnauthorizedAccount");
  });

  it("should allow owner to remove a token", async function () {
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    const token = await TestERC20Factory.deploy("Token", "TOK");

    await tokenManager.connect(owner).addToken(token.target);
    await expect(tokenManager.connect(owner).removeToken(token.target))
      .to.emit(tokenManager, "TokenRemoved")
      .withArgs(token.target);
    expect(await tokenManager.supportedTokens(token.target)).to.be.false;
  });

  it("should not allow non-owner to remove a token", async function () {
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    const token = await TestERC20Factory.deploy("Token", "TOK");

    await tokenManager.connect(owner).addToken(token.target);
    await expect(
      tokenManager.connect(user1).removeToken(token.target)
    ).to.be.revertedWithCustomError(tokenManager, "OwnableUnauthorizedAccount");
  });

  it("should not add the same token twice", async function () {
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    const token = await TestERC20Factory.deploy("Token", "TOK");

    await tokenManager.connect(owner).addToken(token.target);
    await expect(
      tokenManager.connect(owner).addToken(token.target)
    ).to.be.revertedWith("Token already supported");
  });

  it("should not remove a non-supported token", async function () {
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    const token = await TestERC20Factory.deploy("Token", "TOK");

    await expect(
      tokenManager.connect(owner).removeToken(token.target)
    ).to.be.revertedWith("Token not supported");
  });
});
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TestERC20 } from "../typechain-types";

describe("TestERC20", function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let token: TestERC20;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    token = await TestERC20Factory.deploy("TestToken", "TTK");
  });

  it("should allow owner to mint tokens", async function () {
    await token.connect(owner).mint(user1.address, 1000);
    expect(await token.balanceOf(user1.address)).to.equal(1000);
    expect(await token.totalSupply()).to.equal(1000);
  });

  it("should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("TestToken");
    expect(await token.symbol()).to.equal("TTK");
  });
});
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TokenManager, TestERC20, OrderBook, Trade } from "../typechain-types";

describe("Trade", function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let tokenManager: TokenManager;
  let tokenA: TestERC20;
  let tokenB: TestERC20;
  let orderBook: OrderBook;
  let trade: Trade;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const TokenManagerFactory = await ethers.getContractFactory("TokenManager");
    tokenManager = await TokenManagerFactory.deploy(owner.address);

    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    tokenA = await TestERC20Factory.deploy("TokenA", "TKA");
    tokenB = await TestERC20Factory.deploy("TokenB", "TKB");

    await tokenManager.connect(owner).addToken(tokenA.target);
    await tokenManager.connect(owner).addToken(tokenB.target);

    const OrderBookFactory = await ethers.getContractFactory("OrderBook");
    orderBook = await OrderBookFactory.deploy(tokenManager.target);

    const TradeFactory = await ethers.getContractFactory("Trade");
    trade = await TradeFactory.deploy(orderBook.target);

    await orderBook.connect(owner).setTradeContract(trade.target);

    await tokenA.connect(owner).mint(user1.address, 10000);
    await tokenB.connect(owner).mint(user2.address, 10000);

    await tokenA.connect(user1).approve(orderBook.target, 10000);
    await tokenB.connect(user2).approve(trade.target, 10000);
  });

  it("should execute an order successfully", async function () {
    await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);

    const initialBalanceUser1TokenB = await tokenB.balanceOf(user1.address);
    const initialBalanceUser2TokenA = await tokenA.balanceOf(user2.address);

    await expect(trade.connect(user2).executeOrder(1))
      .to.emit(orderBook, "OrderExecuted")
      .withArgs(1, user2.address);

    const finalBalanceUser1TokenB = await tokenB.balanceOf(user1.address);
    const finalBalanceUser2TokenA = await tokenA.balanceOf(user2.address);

    expect(finalBalanceUser1TokenB).to.equal(initialBalanceUser1TokenB.add(200));
    expect(finalBalanceUser2TokenA).to.equal(initialBalanceUser2TokenA.add(100));

    const order = await orderBook.orders(1);
    expect(order.active).to.be.false;
  });

  it("should not execute an inactive order", async function () {
    await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);
    await orderBook.connect(user1).cancelOrder(1);

    await expect(trade.connect(user2).executeOrder(1)).to.be.revertedWith("Order is not active");
  });

  it("should not allow creator to execute their own order", async function () {
    await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);

    await expect(trade.connect(user1).executeOrder(1)).to.be.revertedWith("Cannot execute your own order");
  });

  it("should not execute with insufficient allowance", async function () {
    await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);
    await tokenB.connect(user2).approve(trade.target, 199);

    await expect(trade.connect(user2).executeOrder(1)).to.be.revertedWith("Insufficient allowance");
  });

  it("should not execute with insufficient balance", async function () {
    await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);
    await tokenB.connect(user2).transfer(user1.address, 10000);

    await expect(trade.connect(user2).executeOrder(1)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });
});

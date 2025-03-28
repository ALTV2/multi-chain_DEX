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

    await tokenA.connect(owner).mint(user1.address, 1000);
    await tokenB.connect(owner).mint(user2.address, 1000);

    await tokenA.connect(user1).approve(orderBook.target, 1000);
    await tokenB.connect(user2).approve(trade.target, 1000);
  });

  it("should execute an order successfully", async function () {
    const initUser1TokenA = await tokenA.balanceOf(user1.address); //1000
    const initUser1TokenB = await tokenB.balanceOf(user1.address); //0

    const initUser2TokenA = await tokenA.balanceOf(user2.address); //0
    const initUser2TokenB = await tokenB.balanceOf(user2.address); //1000

    await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100n, 200n);
    const order = await orderBook.orders(1);
    await trade.connect(user2).executeOrder(order.id);

    const finalUser1TokenA = await tokenA.balanceOf(user1.address); //900
    const finalUser1TokenB = await tokenB.balanceOf(user1.address); //200

    const finalUser2TokenA = await tokenA.balanceOf(user2.address); //100
    const finalUser2TokenB = await tokenB.balanceOf(user2.address); //800

    expect(finalUser1TokenA).to.equal(900n);
    expect(finalUser1TokenB).to.equal(200n);
    expect(finalUser2TokenA).to.equal(100n);
    expect(finalUser2TokenB).to.equal(800n);

    const finalOrder = await orderBook.orders(1);
    expect(finalOrder.active).to.be.false;
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

//   it("should not execute with insufficient allowance", async function () {
//     await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);
//     await tokenB.connect(user2).approve(trade.target, 199);
//
//     try {
//     await expect(trade.connect(user2).executeOrder(1));
//     } catch (error) {
//     console.log(error)
//     }
//   });
//
//   it("should not execute with insufficient balance", async function () {
//     await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);
//     await tokenB.connect(user2).transfer(user1.address, 10000);
//
//     await expect(trade.connect(user2).executeOrder(1)).to.be.revertedWith("ERC20InsufficientBalance");
//   });
});

import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TokenManager, TestERC20, OrderBook } from "../typechain-types";

describe("OrderBook", function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let tokenManager: TokenManager;
  let tokenA: TestERC20;
  let tokenB: TestERC20;
  let orderBook: OrderBook;

beforeEach(async function () {
  // Получение Signers
  [owner, user1, user2] = await ethers.getSigners();

  // Развёртывание TokenManager
  const TokenManagerFactory = await ethers.getContractFactory("TokenManager");
  tokenManager = await TokenManagerFactory.deploy(owner.address);

  // Развёртывание токенов
  const TestERC20Factory = await ethers.getContractFactory("TestERC20");
  tokenA = await TestERC20Factory.deploy("TokenA", "TKA");
  tokenB = await TestERC20Factory.deploy("TokenB", "TKB");

  // Проверка перед вызовом addToken
  if (!tokenManager.target) {
    throw new Error("TokenManager target is not defined");
  }
  if (!tokenA.target || !tokenB.target) {
    throw new Error("TokenA or TokenB target is invalid");
  }

  // Вызов addToken с использованием .target
  await tokenManager.connect(owner).addToken(tokenA.target);
  await tokenManager.connect(owner).addToken(tokenB.target);

  // Развёртывание OrderBook
  const OrderBookFactory = await ethers.getContractFactory("OrderBook");
  orderBook = await OrderBookFactory.deploy(tokenManager.target);

  // Вызов методов токенов
  await tokenA.connect(owner).mint(user1.address, 10000);
  await tokenB.connect(owner).mint(user2.address, 10000);
  await tokenA.connect(user1).approve(orderBook.target, 10000);
  await tokenB.connect(user2).approve(orderBook.target, 10000);
});

  it("should create an order successfully", async function () {
    const sellAmount = 100;
    const buyAmount = 200;
    await expect(
      orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, sellAmount, buyAmount)
    )
      .to.emit(orderBook, "OrderCreated")
      .withArgs(1, user1.address, tokenA.target, tokenB.target, sellAmount, buyAmount);

    const order = await orderBook.orders(1);

    expect(order.id).to.equal(1);
    expect(order.creator).to.equal(user1.address);
    expect(order.tokenToSell).to.equal(tokenA.target);
    expect(order.tokenToBuy).to.equal(tokenB.target);
    expect(order.sellAmount).to.equal(sellAmount);
    expect(order.buyAmount).to.equal(buyAmount);
    expect(order.active).to.be.true;
    expect(await tokenA.balanceOf(orderBook.target)).to.equal(sellAmount);
  });

  it("should not create an order with unsupported tokens", async function () {
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    const unsupportedToken = await TestERC20Factory.deploy("Unsupported", "UNS");

    await expect(
      orderBook.connect(user1).createOrder(unsupportedToken.target, tokenB.target, 100, 200)
    ).to.be.revertedWith("Token to sell not supported");
    await expect(
      orderBook.connect(user1).createOrder(tokenA.target, unsupportedToken.target, 100, 200)
    ).to.be.revertedWith("Token to buy not supported");
  });

  it("should not create an order with zero amounts", async function () {
    await expect(
      orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 0, 200)
    ).to.be.revertedWith("Amounts must be greater than 0");
    await expect(
      orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 0)
    ).to.be.revertedWith("Amounts must be greater than 0");
  });

//   it("should not create an order with insufficient allowance", async function () {
//     await tokenA.connect(user1).approve(orderBook.target, 50);
//     await expect(
//       orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200)
//     ).to.be.revertedWith("Insufficient allowance");
//   });
//
//   it("should not create an order with insufficient balance", async function () {
//     await tokenA.connect(user1).transfer(user2.address, 10000); // Transfer all tokens away
//     await expect(
//       orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200)
//     ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
//   });

  it("should cancel an order successfully", async function () {
    await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);
    await expect(orderBook.connect(user1).cancelOrder(1))
      .to.emit(orderBook, "OrderCancelled")
      .withArgs(1);
    const order = await orderBook.orders(1);
    expect(order.active).to.be.false;
    expect(await tokenA.balanceOf(user1.address)).to.equal(10000);
  });

  it("should not allow non-creator to cancel an order", async function () {
    await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);
    await expect(orderBook.connect(user2).cancelOrder(1)).to.be.revertedWith(
      "Not the order creator"
    );
  });

  it("should not cancel an inactive order", async function () {
    await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);
    await orderBook.connect(user1).cancelOrder(1);
    await expect(orderBook.connect(user1).cancelOrder(1)).to.be.revertedWith(
      "Order is not active"
    );
  });

//   it("should deactivate an order successfully", async function () {
//     await orderBook.connect(user1).createOrder(tokenA.target, tokenB.target, 100, 200);
//     await expect(orderBook.connect(owner).deactivateOrder(1))
//       .to.emit(orderBook, "OrderExecuted")
//       .withArgs(1, owner.address);
//     const order = await orderBook.orders(1);
//     expect(order.active).to.be.false;
//   });
});
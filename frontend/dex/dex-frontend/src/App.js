import React, { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers"; // Исправленные импорты
import OrderBookABI from "./abis/OrderBook.json"; // ABI контракта OrderBook
import TradeABI from "./abis/Trade.json"; // ABI контракта Trade
import TokenManagerABI from "./abis/TokenManager.json"; // ABI контракта TokenManager
import ERC20ABI from "@openzeppelin/contracts/build/contracts/ERC20.json"; // ABI для ERC-20
import "./App.css";

const ORDERBOOK_ADDRESS = "0xYourOrderBookAddress";
const TRADE_ADDRESS = "0xYourTradeAddress";
const TOKENMANAGER_ADDRESS = "0xYourTokenManagerAddress";
const TOKEN_A_ADDRESS = "0xYourTokenAAddress"; // Пример токена A
const TOKEN_B_ADDRESS = "0xYourTokenBAddress"; // Пример токена B

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sellToken, setSellToken] = useState(TOKEN_A_ADDRESS);
  const [buyToken, setBuyToken] = useState(TOKEN_B_ADDRESS);
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");

  // Подключение к MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new BrowserProvider(window.ethereum); // Используем BrowserProvider вместо Web3Provider
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Загрузка активных ордеров
  const loadOrders = async () => {
    if (!provider) return;
    const orderBook = new Contract(ORDERBOOK_ADDRESS, OrderBookABI.abi, provider);
    const orderCount = await orderBook.orderCounter();
    const loadedOrders = [];
    for (let i = 1n; i <= orderCount; i++) { // Используем BigInt для индекса
      const order = await orderBook.orders(i);
      if (order.active) {
        loadedOrders.push({
          id: order.id.toString(),
          creator: order.creator,
          tokenToSell: order.tokenToSell,
          tokenToBuy: order.tokenToBuy,
          sellAmount: formatEther(order.sellAmount), // Используем formatEther из ethers
          buyAmount: formatEther(order.buyAmount),   // Используем formatEther из ethers
        });
      }
    }
    setOrders(loadedOrders);
  };

  // Создание ордера
  const createOrder = async () => {
    if (!signer) return;
    const orderBook = new Contract(ORDERBOOK_ADDRESS, OrderBookABI.abi, signer);
    const tokenToSell = new Contract(sellToken, ERC20ABI.abi, signer);

    const sellAmountWei = parseEther(sellAmount); // Используем parseEther из ethers
    const buyAmountWei = parseEther(buyAmount);   // Используем parseEther из ethers

    try {
      // Одобрение токенов
      const approveTx = await tokenToSell.approve(ORDERBOOK_ADDRESS, sellAmountWei);
      await approveTx.wait();

      // Создание ордера
      const tx = await orderBook.createOrder(sellToken, buyToken, sellAmountWei, buyAmountWei);
      await tx.wait();
      alert("Order created!");
      loadOrders();
    } catch (error) {
      console.error(error);
      alert("Error creating order");
    }
  };

  // Исполнение ордера
  const executeOrder = async (orderId) => {
    if (!signer) return;
    const trade = new Contract(TRADE_ADDRESS, TradeABI.abi, signer);
    const orderBook = new Contract(ORDERBOOK_ADDRESS, OrderBookABI.abi, provider);
    const order = await orderBook.orders(orderId);
    const tokenToBuy = new Contract(order.tokenToBuy, ERC20ABI.abi, signer);

    try {
      // Одобрение токенов для исполнения
      const approveTx = await tokenToBuy.approve(TRADE_ADDRESS, order.buyAmount);
      await approveTx.wait();

      // Исполнение ордера
      const tx = await trade.executeOrder(orderId);
      await tx.wait();
      alert("Order executed!");
      loadOrders();
    } catch (error) {
      console.error(error);
      alert("Error executing order");
    }
  };

  useEffect(() => {
    if (provider) loadOrders();
  }, [provider]);

  return (
    <div className="App">
      <header>
        <h1>DEX Order Book</h1>
        {!account ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
        )}
      </header>

      <section className="create-order">
        <h2>Create Order</h2>
        <div className="form">
          <select value={sellToken} onChange={(e) => setSellToken(e.target.value)}>
            <option value={TOKEN_A_ADDRESS}>Token A</option>
            <option value={TOKEN_B_ADDRESS}>Token B</option>
          </select>
          <input
            type="number"
            placeholder="Sell Amount"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
          />
          <select value={buyToken} onChange={(e) => setBuyToken(e.target.value)}>
            <option value={TOKEN_A_ADDRESS}>Token A</option>
            <option value={TOKEN_B_ADDRESS}>Token B</option>
          </select>
          <input
            type="number"
            placeholder="Buy Amount"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
          />
          <button onClick={createOrder} disabled={!account}>
            Create Order
          </button>
        </div>
      </section>

      <section className="order-book">
        <h2>Active Orders</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Sell Token</th>
              <th>Sell Amount</th>
              <th>Buy Token</th>
              <th>Buy Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.tokenToSell.slice(0, 6)}...</td>
                <td>{order.sellAmount}</td>
                <td>{order.tokenToBuy.slice(0, 6)}...</td>
                <td>{order.buyAmount}</td>
                <td>
                  <button onClick={() => executeOrder(order.id)} disabled={!account}>
                    Execute
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
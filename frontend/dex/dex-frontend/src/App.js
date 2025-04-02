import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import OrderBookABI from "./abis/OrderBook.json";
import TradeABI from "./abis/Trade.json";
import TokenManagerABI from "./abis/TokenManager.json";
import ERC20ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";
import "./App.css";

const CONTRACT_ADDRESSES = {
  ORDERBOOK: "0xaE925718310E5aDF3Fa2d98c186BfbBEcC0D7cD5",
  TRADE: "0x7ec2b7D6F0492De75620C105ba67e6119CAAB754",
  TOKENMANAGER: "0x22763589e1dd35d1FE86c51B0593E71677d72054",
};

const TOKENS = {
  TOKEN_A: { address: "0x3d857Fc3510246A050817C29ea7C434ab7EbA81A", symbol: "TKNA" },
  TOKEN_B: { address: "0x20E2434C1f611D3E6C1D2947061ede1A16d04d17", symbol: "TKNB" },
};

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sellToken, setSellToken] = useState(TOKENS.TOKEN_A.address);
  const [buyToken, setBuyToken] = useState(TOKENS.TOKEN_B.address);
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [supportedTokens, setSupportedTokens] = useState({});

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("Please install MetaMask!");
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      checkOwnership(address);
    } catch (err) {
      setError(err.message);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setOrders([]);
    setSupportedTokens({});
    setError(null);
    setIsOwner(false);
  };

  const checkOwnership = async (address) => {
    const tokenManager = new Contract(CONTRACT_ADDRESSES.TOKENMANAGER, TokenManagerABI.abi, provider);
    const owner = await tokenManager.owner();
    setIsOwner(owner.toLowerCase() === address.toLowerCase());
  };

  const checkSupportedTokens = useCallback(async () => {
    if (!provider) return;
    const tokenManager = new Contract(CONTRACT_ADDRESSES.TOKENMANAGER, TokenManagerABI.abi, provider);
    const supported = {};
    for (const token of Object.values(TOKENS)) {
      supported[token.address] = await tokenManager.supportedTokens(token.address);
    }
    setSupportedTokens(supported);
  }, [provider]);

  const addToken = async (tokenAddress) => {
    if (!signer || !isOwner) return;
    setLoading(true);
    setError(null);
    try {
      const tokenManager = new Contract(CONTRACT_ADDRESSES.TOKENMANAGER, TokenManagerABI.abi, signer);
      const tx = await tokenManager.addToken(tokenAddress);
      await tx.wait();
      setError("Token added successfully!");
      checkSupportedTokens();
    } catch (err) {
      setError("Failed to add token: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = useCallback(async () => {
    if (!provider) return;
    setLoading(true);
    try {
      const orderBook = new Contract(CONTRACT_ADDRESSES.ORDERBOOK, OrderBookABI.abi, provider);
      const orderCount = Number(await orderBook.orderCounter());
      const loadedOrders = [];
      for (let i = 1; i <= orderCount; i++) {
        const order = await orderBook.orders(i);
        if (order.active) {
          loadedOrders.push({
            id: order.id.toString(),
            creator: order.creator,
            tokenToSell: order.tokenToSell,
            tokenToBuy: order.tokenToBuy,
            sellAmount: formatEther(order.sellAmount),
            buyAmount: formatEther(order.buyAmount),
          });
        }
      }
      setOrders(loadedOrders);
    } catch (err) {
      setError("Failed to load orders: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const createOrder = async () => {
    if (!signer || !sellAmount || !buyAmount) return;
    if (!supportedTokens[sellToken] || !supportedTokens[buyToken]) {
      setError("One or both tokens are not supported!");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const orderBook = new Contract(CONTRACT_ADDRESSES.ORDERBOOK, OrderBookABI.abi, signer);
      const tokenToSell = new Contract(sellToken, ERC20ABI.abi, signer);
      const sellAmountWei = parseEther(sellAmount);
      const buyAmountWei = parseEther(buyAmount);
      const approveTx = await tokenToSell.approve(CONTRACT_ADDRESSES.ORDERBOOK, sellAmountWei);
      await approveTx.wait();
      const tx = await orderBook.createOrder(sellToken, buyToken, sellAmountWei, buyAmountWei);
      await tx.wait();
      loadOrders();
    } catch (err) {
      setError("Failed to create order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeOrder = async (orderId) => {
    if (!signer) return;
    setLoading(true);
    setError(null);
    try {
      const trade = new Contract(CONTRACT_ADDRESSES.TRADE, TradeABI.abi, signer);
      const orderBook = new Contract(CONTRACT_ADDRESSES.ORDERBOOK, OrderBookABI.abi, provider);
      const order = await orderBook.orders(orderId);
      const tokenToBuy = new Contract(order.tokenToBuy, ERC20ABI.abi, signer);
      const approveTx = await tokenToBuy.approve(CONTRACT_ADDRESSES.TRADE, order.buyAmount);
      await approveTx.wait();
      const tx = await trade.executeOrder(orderId);
      await tx.wait();
      loadOrders();
    } catch (err) {
      setError("Failed to execute order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || null);
        if (accounts[0]) checkOwnership(accounts[0]);
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
    return () => {
      if (window.ethereum) window.ethereum.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (provider) {
      loadOrders();
      checkSupportedTokens();
    }
  }, [ provider, loadOrders, checkSupportedTokens]);

  return (
    <div className="App">
      <header>
        <h1>DEX Order Book</h1>
        {!account ? (
          <button onClick={connectWallet} disabled={loading}>
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <button onClick={disconnectWallet} disabled={loading}>Disconnect</button>
          </div>
        )}
      </header>

      {error && <div className="error">{error}</div>}

      {isOwner && (
        <section className="token-manager">
          <h2>Manage Tokens</h2>
          {Object.values(TOKENS).map((token) => (
            <div key={token.address} className="token-item">
              <span>{token.symbol}: {supportedTokens[token.address] ? "Supported" : "Not Supported"}</span>
              {!supportedTokens[token.address] && (
                <button onClick={() => addToken(token.address)} disabled={loading}>
                  {loading ? "Adding..." : "Add Token"}
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="create-order">
        <h2>Create Order</h2>
        <div className="form">
          <select value={sellToken} onChange={(e) => setSellToken(e.target.value)} disabled={loading}>
            {Object.values(TOKENS).map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} {supportedTokens[token.address] ? "" : "(Not Supported)"}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Sell Amount"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
            disabled={loading}
            min="0"
            step="0.01"
          />
          <select value={buyToken} onChange={(e) => setBuyToken(e.target.value)} disabled={loading}>
            {Object.values(TOKENS).map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} {supportedTokens[token.address] ? "" : "(Not Supported)"}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Buy Amount"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            disabled={loading}
            min="0"
            step="0.01"
          />
          <button onClick={createOrder} disabled={!account || loading || !sellAmount || !buyAmount}>
            {loading ? "Processing..." : "Create Order"}
          </button>
        </div>
      </section>

      <section className="order-book">
        <h2>Active Orders {loading && "(Loading...)"}</h2>
        {orders.length === 0 ? (
          <p>No active orders</p>
        ) : (
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
                  <td>{TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToSell)]?.symbol}</td>
                  <td>{Number(order.sellAmount).toFixed(4)}</td>
                  <td>{TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToBuy)]?.symbol}</td>
                  <td>{Number(order.buyAmount).toFixed(4)}</td>
                  <td>
                    <button
                      onClick={() => executeOrder(order.id)}
                      disabled={!account || loading || order.creator === account}
                    >
                      Execute
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
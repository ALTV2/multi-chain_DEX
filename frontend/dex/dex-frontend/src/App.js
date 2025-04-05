import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, parseEther, formatEther, parseUnits, formatUnits } from "ethers";
import OrderBookABI from "./abis/OrderBook.json";
import TradeABI from "./abis/Trade.json";
import TokenManagerABI from "./abis/TokenManager.json";
import ERC20ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";
import "./App.css";

// Адреса контрактов
const CONTRACT_ADDRESSES = {
  ORDERBOOK: "0x146eCD601740442a1bb4D009F6c29685963965Ce",
  TRADE: "0x4Ad6c096f772A3Ee50ba3FfaCA19e80d4Af65E41",
  TOKENMANAGER: "0x86C09Aa858d0D12912c176C98845B27E522f80d3",
};

// Токены + ETH с указанием decimals
const TOKENS = {
  ETH: { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18 },
  TOKEN_A: { address: "0x3d857Fc3510246A050817C29ea7C434ab7EbA81A", symbol: "TSTA", decimals: 18 },
  TOKEN_B: { address: "0x20E2434C1f611D3E6C1D2947061ede1A16d04d17", symbol: "TSTB", decimals: 18 },
};

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sellToken, setSellToken] = useState(TOKENS.ETH.address);
  const [buyToken, setBuyToken] = useState(TOKENS.TOKEN_A.address);
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [restrictTokens, setRestrictTokens] = useState(false);
  const [supportedTokens, setSupportedTokens] = useState({});

  // Подключение кошелька
  const connectWallet = async (autoConnect = false) => {
    try {
      if (!window.ethereum) throw new Error("Please install MetaMask!");
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0 || !autoConnect) {
        if (!autoConnect) await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        await checkOwnership(address);
      } else if (autoConnect) {
        setProvider(provider);
      }
    } catch (err) {
      if (!autoConnect) setError(err.message);
    }
  };

  // Отключение кошелька
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setOrders([]);
    setSupportedTokens({});
    setRestrictTokens(false);
    setError(null);
    setIsOwner(false);
  };

  // Проверка владельца
  const checkOwnership = async (address) => {
    if (!provider || !address) return;
    try {
      const orderBook = new Contract(CONTRACT_ADDRESSES.ORDERBOOK, OrderBookABI.abi, provider);
      const owner = await orderBook.owner();
      setIsOwner(owner.toLowerCase() === address.toLowerCase());
    } catch (err) {
      console.error("Error checking ownership:", err);
    }
  };

  // Проверка ограничения токенов
  const checkRestrictTokens = useCallback(async () => {
    if (!provider) return;
    try {
      const orderBook = new Contract(CONTRACT_ADDRESSES.ORDERBOOK, OrderBookABI.abi, provider);
      const restricted = await orderBook.restrictTokens();
      setRestrictTokens(restricted);
    } catch (err) {
      console.error("Error checking restrictTokens:", err);
    }
  }, [provider]);

  // Проверка поддерживаемых токенов
  const checkSupportedTokens = useCallback(async () => {
    if (!provider) return;
    try {
      const tokenManager = new Contract(CONTRACT_ADDRESSES.TOKENMANAGER, TokenManagerABI.abi, provider);
      const supported = {};
      for (const token of Object.values(TOKENS)) {
        if (token.address !== TOKENS.ETH.address) {
          supported[token.address] = await tokenManager.supportedTokens(token.address);
        } else {
          supported[token.address] = true;
        }
      }
      setSupportedTokens(supported);
    } catch (err) {
      console.error("Error checking supported tokens:", err);
    }
  }, [provider]);

  // Переключение ограничения токенов
  const toggleTokenRestriction = async () => {
    if (!signer || !isOwner) return;
    setLoading(true);
    setError(null);
    try {
      const orderBook = new Contract(CONTRACT_ADDRESSES.ORDERBOOK, OrderBookABI.abi, signer);
      const tx = await orderBook.toggleTokenRestriction(!restrictTokens);
      await tx.wait();
      setRestrictTokens(!restrictTokens);
      setError("Token restriction toggled successfully!");
    } catch (err) {
      setError("Failed to toggle restriction: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Добавление токена
  const addToken = async (tokenAddress) => {
    if (!signer || !isOwner || tokenAddress === TOKENS.ETH.address) return;
    setLoading(true);
    setError(null);
    try {
      const tokenManager = new Contract(CONTRACT_ADDRESSES.TOKENMANAGER, TokenManagerABI.abi, signer);
      const tx = await tokenManager.addToken(tokenAddress);
      await tx.wait();
      setError("Token added successfully!");
      await checkSupportedTokens();
    } catch (err) {
      setError("Failed to add token: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка ордеров
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
            sellAmount: order.sellAmount.toString(), // Сохраняем в Wei как строку
            buyAmount: order.buyAmount.toString(),   // Сохраняем в Wei как строку
          });
        }
      }
      setOrders(loadedOrders);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load orders: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  // Создание ордера
  const createOrder = async () => {
    if (!signer || !sellAmount || !buyAmount || parseFloat(sellAmount) <= 0 || parseFloat(buyAmount) <= 0) {
      setError("Invalid amounts");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const orderBook = new Contract(CONTRACT_ADDRESSES.ORDERBOOK, OrderBookABI.abi, signer);
      const sellTokenDecimals = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === sellToken)].decimals;
      const buyTokenDecimals = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === buyToken)].decimals;
      const sellAmountWei = parseUnits(sellAmount, sellTokenDecimals);
      const buyAmountWei = parseUnits(buyAmount, buyTokenDecimals);

      let tx;
      if (sellToken === TOKENS.ETH.address) {
        tx = await orderBook.createOrder(sellToken, buyToken, sellAmountWei, buyAmountWei, {
          value: sellAmountWei.toString(),
        });
      } else {
        const tokenToSell = new Contract(sellToken, ERC20ABI.abi, signer);
        const balance = await tokenToSell.balanceOf(account);
        const allowance = await tokenToSell.allowance(account, CONTRACT_ADDRESSES.ORDERBOOK);

        if (balance < sellAmountWei) {
          throw new Error(
            `Insufficient ${
              TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === sellToken)]?.symbol
            } balance. Required: ${sellAmount}, Available: ${formatUnits(balance, sellTokenDecimals)}`
          );
        }
        if (allowance < sellAmountWei) {
          const approveTx = await tokenToSell.approve(CONTRACT_ADDRESSES.ORDERBOOK, sellAmountWei);
          await approveTx.wait();
        }
        tx = await orderBook.createOrder(sellToken, buyToken, sellAmountWei, buyAmountWei);
      }
      await tx.wait();
      await loadOrders();
      setSellAmount("");
      setBuyAmount("");
      setError("Order created successfully!");
    } catch (err) {
      console.error("Create order error:", err);
      setError(`Failed to create order: ${err.message}${err.data ? " - " + err.data.message : ""}`);
    } finally {
      setLoading(false);
    }
  };

  // Выполнение ордера
  const executeOrder = async (orderId) => {
    if (!signer || !account) return;
    setLoading(true);
    setError(null);
    try {
      const trade = new Contract(CONTRACT_ADDRESSES.TRADE, TradeABI.abi, signer);
      const orderBook = new Contract(CONTRACT_ADDRESSES.ORDERBOOK, OrderBookABI.abi, provider);
      const order = await orderBook.orders(orderId);

      if (!order.active) throw new Error("Order is not active");
      if (order.creator.toLowerCase() === account.toLowerCase()) {
        throw new Error("Cannot execute your own order");
      }

      const buyAmountWei = BigInt(order.buyAmount); // Уже в Wei
      const buyTokenDecimals = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToBuy)].decimals;
      const buyAmountFormatted = formatUnits(buyAmountWei, buyTokenDecimals);

      let tx;
      if (order.tokenToBuy === TOKENS.ETH.address) {
        tx = await trade.executeOrder(orderId, { value: buyAmountWei.toString() });
      } else {
        const tokenToBuy = new Contract(order.tokenToBuy, ERC20ABI.abi, signer);
        const balance = await tokenToBuy.balanceOf(account);
        const allowance = await tokenToBuy.allowance(account, CONTRACT_ADDRESSES.TRADE);

        console.log("Balance (Wei):", balance.toString());
        console.log("Required Buy Amount (Wei):", buyAmountWei.toString());
        console.log("Allowance (Wei):", allowance.toString());

        if (balance < buyAmountWei) {
          throw new Error(
            `Insufficient ${
              TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToBuy)]?.symbol
            } balance. Available: ${formatUnits(balance, buyTokenDecimals)}, Required: ${buyAmountFormatted}`
          );
        }
        if (allowance < buyAmountWei) {
          const approveTx = await tokenToBuy.approve(CONTRACT_ADDRESSES.TRADE, buyAmountWei);
          await approveTx.wait();
          console.log("Approval successful");
        }
        tx = await trade.executeOrder(orderId);
      }
      await tx.wait();
      await loadOrders();
      setError("Order executed successfully!");
    } catch (err) {
      console.error("Execute order error:", err);
      setError(`Failed to execute order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Отмена ордера
  const cancelOrder = async (orderId) => {
    if (!signer || !account) return;
    setLoading(true);
    setError(null);
    try {
      const orderBook = new Contract(CONTRACT_ADDRESSES.ORDERBOOK, OrderBookABI.abi, signer);
      const order = await orderBook.orders(orderId);

      if (!order.active) throw new Error("Order is already inactive");
      if (order.creator.toLowerCase() !== account.toLowerCase()) {
        throw new Error("You can only cancel your own orders");
      }

      const tx = await orderBook.cancelOrder(orderId);
      await tx.wait();
      await loadOrders();
      setError("Order cancelled successfully!");
    } catch (err) {
      setError(`Failed to cancel order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Эффекты
  useEffect(() => {
    connectWallet(true);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || null);
      if (accounts[0]) checkOwnership(accounts[0]);
    };
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (provider) {
      loadOrders();
      checkRestrictTokens();
      checkSupportedTokens();
    }
  }, [provider, loadOrders, checkRestrictTokens, checkSupportedTokens]);

  return (
    <div className="App">
      <header>
        <h1>DEX Order Book</h1>
        {!account ? (
          <button onClick={() => connectWallet(false)} disabled={loading}>
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <button onClick={disconnectWallet} disabled={loading}>Disconnect</button>
          </div>
        )}
      </header>

      {error && <div className={error.includes("successfully") ? "success" : "error"}>{error}</div>}

      {isOwner && (
        <section className="owner-controls">
          <h2>Owner Controls</h2>
          <div className="restriction-toggle">
            <p>Token Restriction: {restrictTokens ? "Enabled" : "Disabled"}</p>
            <button onClick={toggleTokenRestriction} disabled={loading}>
              {loading ? "Toggling..." : restrictTokens ? "Disable Restriction" : "Enable Restriction"}
            </button>
          </div>
          <div className="token-manager">
            <h3>Manage Tokens</h3>
            {Object.values(TOKENS)
              .filter((token) => token.address !== TOKENS.ETH.address)
              .map((token) => (
                <div key={token.address} className="token-item">
                  <span>
                    {token.symbol}: {supportedTokens[token.address] ? "Supported" : "Not Supported"}
                  </span>
                  {!supportedTokens[token.address] && (
                    <button onClick={() => addToken(token.address)} disabled={loading || !restrictTokens}>
                      {loading ? "Adding..." : "Add Token"}
                    </button>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="create-order">
        <h2>Create Order</h2>
        <div className="form">
          <select value={sellToken} onChange={(e) => setSellToken(e.target.value)} disabled={loading}>
            {Object.values(TOKENS).map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} {restrictTokens && !supportedTokens[token.address] ? "(Not Supported)" : ""}
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
                {token.symbol} {restrictTokens && !supportedTokens[token.address] ? "(Not Supported)" : ""}
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
          <button
            onClick={createOrder}
            disabled={
              !account ||
              loading ||
              !sellAmount ||
              !buyAmount ||
              (restrictTokens && (!supportedTokens[sellToken] || !supportedTokens[buyToken]))
            }
          >
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const sellTokenDecimals = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToSell)].decimals;
                const buyTokenDecimals = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToBuy)].decimals;
                return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToSell)]?.symbol || "Unknown"}</td>
                    <td>{Number(formatUnits(order.sellAmount, sellTokenDecimals)).toFixed(4)}</td>
                    <td>{TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToBuy)]?.symbol || "Unknown"}</td>
                    <td>{Number(formatUnits(order.buyAmount, buyTokenDecimals)).toFixed(4)}</td>
                    <td>
                      <button
                        onClick={() => executeOrder(order.id)}
                        disabled={!account || loading || order.creator.toLowerCase() === account?.toLowerCase()}
                      >
                        Execute
                      </button>
                      {order.creator.toLowerCase() === account?.toLowerCase() && (
                        <button onClick={() => cancelOrder(order.id)} disabled={!account || loading} className="cancel-button">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
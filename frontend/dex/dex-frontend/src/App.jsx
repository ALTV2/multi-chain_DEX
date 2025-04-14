import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import OrderCreation from './components/OrderCreation';
import OrderBook from './components/OrderBook';
import OwnerControls from './components/OwnerControls';
import Message from './components/Message';
import { useWallet } from './hooks/useWallet';
import { useOrders } from './hooks/useOrders';
import { useTokenManager } from './hooks/useTokenManager';
import { TOKENS } from './constants/blockchains';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Главный компонент приложения DEX
function App() {
  const { provider, signer, account, connectWallet, disconnectWallet, error: walletError, isConnecting } = useWallet();
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    loadOrders,
    createOrder: createOrderFn,
    executeOrder,
    cancelOrder,
    setError: setOrdersError,
  } = useOrders(provider, signer, account);
  const {
    isOwner,
    restrictTokens,
    supportedTokens,
    loading: tokenLoading,
    error: tokenError,
    toggleTokenRestriction,
    addToken,
  } = useTokenManager(provider, signer, account);

  const [sellToken, setSellToken] = useState(TOKENS.ETHEREUM.ETH.address);
  const [buyToken, setBuyToken] = useState(TOKENS.ETHEREUM.TOKEN_A.address);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [sellBlockchain, setSellBlockchain] = useState('ethereum');
  const [buyBlockchain, setBuyBlockchain] = useState('ethereum');
  const [customTokens, setCustomTokens] = useState(() => {
    const saved = localStorage.getItem('customTokens');
    return saved ? JSON.parse(saved) : { ETHEREUM: {}, TON: {}, SUI: {} };
  });

  const loading = ordersLoading || tokenLoading;
  const error = walletError || ordersError || tokenError;

  const handleCreateOrder = useCallback(async () => {
    if (!sellAmount || !buyAmount) {
      setOrdersError('Please enter both sell and buy amounts');
      return;
    }
    if (!sellToken || !buyToken) {
      setOrdersError('Please select both sell and buy tokens');
      return;
    }
    try {
      await createOrderFn(sellToken, buyToken, sellAmount, buyAmount, sellBlockchain, buyBlockchain);
      setSellAmount('');
      setBuyAmount('');
    } catch (err) {
      console.error('Error creating order:', err);
      setOrdersError('Failed to create order: ' + err.message);
    }
  }, [sellToken, buyToken, sellAmount, buyAmount, sellBlockchain, buyBlockchain, createOrderFn, setOrdersError]);

  const addCustomToken = useCallback((blockchain, address, name, iconUrl) => {
    setCustomTokens((prev) => {
      const normalizedBlockchain = blockchain.toLowerCase();
      // Check for duplicates
      if (
        TOKENS[blockchain]?.[address] ||
        prev[blockchain]?.[address]
      ) {
        toast.error('Token already exists');
        return prev;
      }
      const icon = iconUrl || '/icons/fallback.svg';
      const updated = {
        ...prev,
        [blockchain]: {
          ...prev[blockchain],
          [address]: {
            address,
            name,
            decimals: blockchain === 'ETHEREUM' ? 18 : 9,
            blockchain,
            icon,
          },
        },
      };
      console.log('Adding custom token:', { blockchain, address, name, icon });
      localStorage.setItem('customTokens', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!provider || !account) return;
    console.log('App: Loading orders for account:', account);
    loadOrders();
  }, [provider, account, loadOrders]);

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="content-wrapper">
        <Header
          account={account}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          loading={loading}
          isConnecting={isConnecting}
        />
        {error && <Message message={error} />}
        {loading && !account && !isConnecting && (
          <div className="card">
            <p>Loading contracts... <span className="spinner"></span></p>
          </div>
        )}
        <div className="section">
          <OwnerControls
            isOwner={isOwner}
            restrictTokens={restrictTokens}
            toggleTokenRestriction={toggleTokenRestriction}
            loading={loading}
            supportedTokens={supportedTokens}
            addToken={addToken}
          />
        </div>
        <div className="section">
          <OrderCreation
            sellToken={sellToken}
            setSellToken={setSellToken}
            buyToken={buyToken}
            setBuyToken={setBuyToken}
            sellAmount={sellAmount}
            setSellAmount={setSellAmount}
            buyAmount={buyAmount}
            setBuyAmount={setBuyAmount}
            sellBlockchain={sellBlockchain}
            setSellBlockchain={setSellBlockchain}
            buyBlockchain={buyBlockchain}
            setBuyBlockchain={setBuyBlockchain}
            createOrder={handleCreateOrder}
            loading={loading}
            account={account}
            restrictTokens={restrictTokens}
            supportedTokens={supportedTokens}
            customTokens={customTokens}
            addCustomToken={addCustomToken}
          />
        </div>
        <div className="section">
          <OrderBook
            orders={orders}
            executeOrder={executeOrder}
            cancelOrder={cancelOrder}
            loading={loading}
            account={account}
            customTokens={customTokens}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(App);
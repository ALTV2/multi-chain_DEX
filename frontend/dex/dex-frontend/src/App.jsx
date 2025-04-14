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

function App() {
  const { provider, signer, account, connectWallet, disconnectWallet } = useWallet();
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
    checkOwnership,
    checkRestrictTokens,
    checkSupportedTokens,
    toggleTokenRestriction,
    addToken,
    setError: setTokenError,
  } = useTokenManager(provider, signer, account);

  const [sellToken, setSellToken] = useState(TOKENS.ETH.address);
  const [buyToken, setBuyToken] = useState(TOKENS.TOKEN_A.address);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  const loading = ordersLoading || tokenLoading;
  const error = ordersError || tokenError;

  const handleCreateOrder = useCallback(async () => {
    if (!sellAmount || !buyAmount) {
      setOrdersError('Please enter both sell and buy amounts');
      return;
    }
    try {
      await createOrderFn(sellToken, buyToken, sellAmount, buyAmount);
      setSellAmount('');
      setBuyAmount('');
    } catch (err) {
      setOrdersError(`Failed to create order: ${err.message}`);
    }
  }, [sellToken, buyToken, sellAmount, buyAmount, createOrderFn, setOrdersError]);

  useEffect(() => {
    if (provider && account) {
      loadOrders();
      checkOwnership();
      checkRestrictTokens();
      checkSupportedTokens();
    }
  }, [provider, account, loadOrders, checkOwnership, checkRestrictTokens, checkSupportedTokens]);

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <Header
          account={account}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          loading={loading}
        />
        {error && <Message message={error} />}
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
            createOrder={handleCreateOrder}
            loading={loading}
            account={account}
            restrictTokens={restrictTokens}
            supportedTokens={supportedTokens}
          />
        </div>
        <div className="section">
          <OrderBook
            orders={orders}
            executeOrder={executeOrder}
            cancelOrder={cancelOrder}
            loading={loading}
            account={account}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
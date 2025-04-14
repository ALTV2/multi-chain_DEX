import React, { useState, useEffect } from 'react';
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
    setError: setOrdersError
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
    setError: setTokenError
  } = useTokenManager(provider, signer, account);

  const [sellToken, setSellToken] = useState(TOKENS.ETH.address);
  const [buyToken, setBuyToken] = useState(TOKENS.TOKEN_A.address);
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");

  const loading = ordersLoading || tokenLoading;
  const error = ordersError || tokenError;

  const createOrder = () => {
    createOrderFn(sellToken, buyToken, sellAmount, buyAmount)
      .then(() => {
        setSellAmount("");
        setBuyAmount("");
      });
  };

  useEffect(() => {
    if (provider && account) {
      loadOrders();
      checkOwnership();
      checkRestrictTokens();
      checkSupportedTokens();
    }
  }, [provider, account, loadOrders, checkOwnership, checkRestrictTokens, checkSupportedTokens]);

  return (
    <div className="App">
      <Header
        account={account}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        loading={loading}
      />
      <Message message={error} />
      <OwnerControls
        isOwner={isOwner}
        restrictTokens={restrictTokens}
        toggleTokenRestriction={toggleTokenRestriction}
        loading={loading}
        supportedTokens={supportedTokens}
        addToken={addToken}
      />
      <OrderCreation
        sellToken={sellToken}
        setSellToken={setSellToken}
        buyToken={buyToken}
        setBuyToken={setBuyToken}
        sellAmount={sellAmount}
        setSellAmount={setSellAmount}
        buyAmount={buyAmount}
        setBuyAmount={setBuyAmount}
        createOrder={createOrder}
        loading={loading}
        account={account}
        restrictTokens={restrictTokens}
        supportedTokens={supportedTokens}
      />
      <OrderBook
        orders={orders}
        executeOrder={executeOrder}
        cancelOrder={cancelOrder}
        loading={loading}
        account={account}
      />
    </div>
  );
}

export default App;
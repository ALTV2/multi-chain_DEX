import React from 'react';

const Header = ({ account, connectWallet, disconnectWallet, loading }) => (
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
);

export default Header;
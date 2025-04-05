import React from 'react';
import { TOKENS } from '../constants/tokens';

const OrderCreation = ({
  sellToken, setSellToken,
  buyToken, setBuyToken,
  sellAmount, setSellAmount,
  buyAmount, setBuyAmount,
  createOrder,
  loading,
  account,
  restrictTokens,
  supportedTokens
}) => (
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
);

export default OrderCreation;
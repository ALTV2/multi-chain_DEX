import React from 'react';
import { blockchains, TOKENS } from '../constants/blockchains';

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
}) => {
  const [sellBlockchain, setSellBlockchain] = React.useState('ethereum');
  const [buyBlockchain, setBuyBlockchain] = React.useState('ethereum');

  const sellTokens = Object.values(TOKENS).filter(t => t.blockchain === sellBlockchain);
  const buyTokens = Object.values(TOKENS).filter(t => t.blockchain === buyBlockchain);

  return (
    <section className="create-order">
      <h2>Create Order</h2>
      <div className="form">
        <select value={sellBlockchain} onChange={(e) => setSellBlockchain(e.target.value)} disabled={loading}>
          {blockchains.map(bc => (
            <option key={bc.id} value={bc.id}>
              {bc.name}
            </option>
          ))}
        </select>
        <select value={sellToken} onChange={(e) => setSellToken(e.target.value)} disabled={loading}>
          {sellTokens.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} {restrictTokens && !supportedTokens[token.address] ? "(Not Supported)" : ""}
            </option>
          ))}
        </select>
        {sellToken && (
          <img src={TOKENS[Object.keys(TOKENS).find(k => TOKENS[k].address === sellToken)]?.icon} alt="sell token" width="20" />
        )}
        <input
          type="number"
          placeholder="Sell Amount"
          value={sellAmount}
          onChange={(e) => setSellAmount(e.target.value)}
          disabled={loading}
          min="0"
          step="0.01"
        />
        <select value={buyBlockchain} onChange={(e) => setBuyBlockchain(e.target.value)} disabled={loading}>
          {blockchains.map(bc => (
            <option key={bc.id} value={bc.id}>
              {bc.name}
            </option>
          ))}
        </select>
        <select value={buyToken} onChange={(e) => setBuyToken(e.target.value)} disabled={loading}>
          {buyTokens.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} {restrictTokens && !supportedTokens[token.address] ? "(Not Supported)" : ""}
            </option>
          ))}
        </select>
        {buyToken && (
          <img src={TOKENS[Object.keys(TOKENS).find(k => TOKENS[k].address === buyToken)]?.icon} alt="buy token" width="20" />
        )}
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
};

export default OrderCreation;
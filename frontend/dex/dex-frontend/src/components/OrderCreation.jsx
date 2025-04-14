import React, { useState } from 'react';
import { blockchains, TOKENS } from '../constants/blockchains';
import { ArrowRight } from 'lucide-react';

const OrderCreation = ({
  sellToken,
  setSellToken,
  buyToken,
  setBuyToken,
  sellAmount,
  setSellAmount,
  buyAmount,
  setBuyAmount,
  createOrder,
  loading,
  account,
  restrictTokens,
  supportedTokens,
}) => {
  const [sellBlockchain, setSellBlockchain] = useState('ethereum');
  const [buyBlockchain, setBuyBlockchain] = useState('ethereum');

  const sellTokens = Object.values(TOKENS).filter((t) => t.blockchain === sellBlockchain);
  const buyTokens = Object.values(TOKENS).filter((t) => t.blockchain === buyBlockchain);

  return (
    <section className="card">
      <h2>Create Order</h2>
      <div className="form-grid">
        <div className="form-section">
          <div>
            <label>Sell Blockchain</label>
            <div className="select-wrapper">
              <select
                value={sellBlockchain}
                onChange={(e) => setSellBlockchain(e.target.value)}
                disabled={loading}
                className="select"
              >
                {blockchains.map((bc) => (
                  <option key={bc.id} value={bc.id}>
                    {bc.name}
                  </option>
                ))}
              </select>
              <img
                src={blockchains.find((bc) => bc.id === sellBlockchain)?.icon}
                alt="blockchain"
                className="token-icon"
              />
            </div>
          </div>
          <div>
            <label>Sell Token</label>
            <div className="select-wrapper">
              <select
                value={sellToken}
                onChange={(e) => setSellToken(e.target.value)}
                disabled={loading}
                className="select"
              >
                {sellTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                    {restrictTokens && !supportedTokens[token.address] ? ' (Not Supported)' : ''}
                  </option>
                ))}
              </select>
              {sellToken && (
                <img
                  src={TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === sellToken)]?.icon}
                  alt="sell token"
                  className="token-icon"
                />
              )}
            </div>
          </div>
          <div>
            <label>Sell Amount</label>
            <input
              type="number"
              placeholder="0.0"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              disabled={loading}
              min="0"
              step="0.01"
              className="input"
            />
          </div>
        </div>
        <div className="form-divider">
          <ArrowRight className="arrow-icon" />
        </div>
        <div className="form-section">
          <div>
            <label>Buy Blockchain</label>
            <div className="select-wrapper">
              <select
                value={buyBlockchain}
                onChange={(e) => setBuyBlockchain(e.target.value)}
                disabled={loading}
                className="select"
              >
                {blockchains.map((bc) => (
                  <option key={bc.id} value={bc.id}>
                    {bc.name}
                  </option>
                ))}
              </select>
              <img
                src={blockchains.find((bc) => bc.id === buyBlockchain)?.icon}
                alt="blockchain"
                className="token-icon"
              />
            </div>
          </div>
          <div>
            <label>Buy Token</label>
            <div className="select-wrapper">
              <select
                value={buyToken}
                onChange={(e) => setBuyToken(e.target.value)}
                disabled={loading}
                className="select"
              >
                {buyTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                    {restrictTokens && !supportedTokens[token.address] ? ' (Not Supported)' : ''}
                  </option>
                ))}
              </select>
              {buyToken && (
                <img
                  src={TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === buyToken)]?.icon}
                  alt="buy token"
                  className="token-icon"
                />
              )}
            </div>
          </div>
          <div>
            <label>Buy Amount</label>
            <input
              type="number"
              placeholder="0.0"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              disabled={loading}
              min="0"
              step="0.01"
              className="input"
            />
          </div>
        </div>
      </div>
      <button
        onClick={createOrder}
        disabled={
          !account ||
          loading ||
          !sellAmount ||
          !buyAmount ||
          (restrictTokens && (!supportedTokens[sellToken] || !supportedTokens[buyToken]))
        }
        className="button button-primary"
        style={{ marginTop: '1rem', width: '100%' }}
      >
        {loading ? (
          <>
            Processing <span className="spinner"></span>
          </>
        ) : (
          'Create Order'
        )}
        <span className="tooltip">Create a new order</span>
      </button>
    </section>
  );
};

export default OrderCreation;
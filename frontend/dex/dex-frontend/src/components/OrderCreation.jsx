import React, { useState, useCallback } from 'react';
import { blockchains, TOKENS } from '../constants/blockchains';
import { ArrowRight, Plus } from 'lucide-react';

const OrderCreation = ({
  sellToken,
  setSellToken,
  buyToken,
  setBuyToken,
  sellAmount,
  setSellAmount,
  buyAmount,
  setBuyAmount,
  sellBlockchain,
  setSellBlockchain,
  buyBlockchain,
  setBuyBlockchain,
  createOrder,
  loading,
  account,
  restrictTokens,
  supportedTokens,
  customTokens,
  addCustomToken,
}) => {
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [tokenBlockchain, setTokenBlockchain] = useState('ethereum');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenIconUrl, setTokenIconUrl] = useState('');
  const [tokenError, setTokenError] = useState('');

  const sellTokens = [
    ...Object.values(TOKENS[sellBlockchain.toUpperCase()] || {}),
    ...Object.values(customTokens[sellBlockchain.toUpperCase()] || {}),
  ];
  const buyTokens = [
    ...Object.values(TOKENS[buyBlockchain.toUpperCase()] || {}),
    ...Object.values(customTokens[buyBlockchain.toUpperCase()] || {}),
  ];

  const validateAddress = useCallback((address, blockchain) => {
    if (blockchain === 'ethereum') {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    } else if (blockchain === 'ton') {
      return /^EQ[a-zA-Z0-9_-]{46}$/.test(address);
    } else if (blockchain === 'sui') {
      return /^0x[a-f0-9]+::[a-z]+::[A-Z]+$/.test(address);
    }
    return false;
  }, []);

  const handleAddToken = useCallback(() => {
    if (!validateAddress(tokenAddress, tokenBlockchain)) {
      setTokenError(`Invalid contract address for ${tokenBlockchain}`);
      return;
    }
    if (!tokenName.trim()) {
      setTokenError('Token name is required');
      return;
    }
    if (
      TOKENS[tokenBlockchain.toUpperCase()]?.[tokenAddress] ||
      customTokens[tokenBlockchain.toUpperCase()]?.[tokenAddress]
    ) {
      setTokenError('Token already exists');
      return;
    }
    addCustomToken(tokenBlockchain.toUpperCase(), tokenAddress, tokenName.trim(), tokenIconUrl.trim() || '');
    setShowAddTokenModal(false);
    setTokenAddress('');
    setTokenName('');
    setTokenIconUrl('');
    setTokenError('');
  }, [tokenAddress, tokenName, tokenIconUrl, tokenBlockchain, validateAddress, addCustomToken, customTokens]);

  // Дефолтная иконка для токенов
  const getTokenIcon = useCallback(
    (blockchain, token) => {
      const icon =
        TOKENS[blockchain.toUpperCase()]?.[token]?.icon ||
        customTokens[blockchain.toUpperCase()]?.[token]?.icon ||
        '/icons/fallback.svg';
      if (icon === '/icons/fallback.svg') {
        console.warn(`No icon found for token: ${token} on blockchain: ${blockchain}`);
      }
      return icon;
    },
    [customTokens]
  );

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
                onChange={(e) => {
                  setSellBlockchain(e.target.value);
                  setSellToken('');
                }}
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
                src={blockchains.find((bc) => bc.id === sellBlockchain)?.icon || '/icons/fallback.svg'}
                alt="blockchain"
                className="token-icon"
                onError={(e) => {
                  console.warn('Sell blockchain icon load failed:', sellBlockchain);
                  e.target.src = '/icons/fallback.svg';
                }}
              />
            </div>
          </div>
          <div>
            <label>Sell Token</label>
            <div className="select-wrapper">
              <select
                value={sellToken}
                onChange={(e) => setSellToken(e.target.value)}
                disabled={loading || sellTokens.length === 0}
                className="select"
              >
                <option value="">Select a token</option>
                {sellTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol || token.name}
                    {restrictTokens && !supportedTokens[token.address] ? ' (Not Supported)' : ''}
                  </option>
                ))}
              </select>
              {sellToken && (
                <img
                  src={getTokenIcon(sellBlockchain, sellToken)}
                  alt="sell token"
                  className="token-icon"
                  onError={(e) => {
                    console.warn('Sell token icon load failed:', sellToken);
                    e.target.src = '/icons/fallback.svg';
                  }}
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
                onChange={(e) => {
                  setBuyBlockchain(e.target.value);
                  setBuyToken('');
                }}
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
                src={blockchains.find((bc) => bc.id === buyBlockchain)?.icon || '/icons/fallback.svg'}
                alt="blockchain"
                className="token-icon"
                onError={(e) => {
                  console.warn('Buy blockchain icon load failed:', buyBlockchain);
                  e.target.src = '/icons/fallback.svg';
                }}
              />
            </div>
          </div>
          <div>
            <label>Buy Token</label>
            <div className="select-wrapper">
              <select
                value={buyToken}
                onChange={(e) => setBuyToken(e.target.value)}
                disabled={loading || buyTokens.length === 0}
                className="select"
              >
                <option value="">Select a token</option>
                {buyTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol || token.name}
                    {restrictTokens && !supportedTokens[token.address] ? ' (Not Supported)' : ''}
                  </option>
                ))}
              </select>
              {buyToken && (
                <img
                  src={getTokenIcon(buyBlockchain, buyToken)}
                  alt="buy token"
                  className="token-icon"
                  onError={(e) => {
                    console.warn('Buy token icon load failed:', buyToken);
                    e.target.src = '/icons/fallback.svg';
                  }}
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
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          onClick={createOrder}
          disabled={
            !account ||
            loading ||
            !sellAmount ||
            !buyAmount ||
            !sellToken ||
            !buyToken ||
            (restrictTokens && (!supportedTokens[sellToken] || !supportedTokens[buyToken]))
          }
          className="button button-primary"
          style={{ flex: 1 }}
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
        <button
          onClick={() => setShowAddTokenModal(true)}
          className="button button-primary"
        >
          <Plus className="token-icon" />
          Add Token
          <span className="tooltip">Add a custom token</span>
        </button>
      </div>
      {showAddTokenModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Custom Token</h2>
            <div className="select-wrapper" style={{ marginBottom: '1rem' }}>
              <select
                value={tokenBlockchain}
                onChange={(e) => setTokenBlockchain(e.target.value)}
                className="select"
              >
                {blockchains.map((bc) => (
                  <option key={bc.id} value={bc.id}>
                    {bc.name}
                  </option>
                ))}
              </select>
              <img
                src={blockchains.find((bc) => bc.id === tokenBlockchain)?.icon || '/icons/fallback.svg'}
                alt="blockchain"
                className="token-icon"
                onError={(e) => {
                  console.warn('Token blockchain icon load failed:', tokenBlockchain);
                  e.target.src = '/icons/fallback.svg';
                }}
              />
            </div>
            <input
              type="text"
              placeholder={`Token Contract Address (${tokenBlockchain === 'ethereum' ? '0x...' : tokenBlockchain === 'ton' ? 'EQ...' : '0x...::...'})`}
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Token Name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Icon URL (optional)"
              value={tokenIconUrl}
              onChange={(e) => setTokenIconUrl(e.target.value)}
              className="input"
            />
            {tokenError && <p className="error">{tokenError}</p>}
            <button
              onClick={handleAddToken}
              className="button button-primary"
            >
              Add Token
            </button>
            <button
              onClick={() => setShowAddTokenModal(false)}
              className="button button-danger"
              style={{ marginTop: '0.5rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default React.memo(OrderCreation, (prevProps, nextProps) => {
  return (
    prevProps.sellToken === nextProps.sellToken &&
    prevProps.buyToken === nextProps.buyToken &&
    prevProps.sellAmount === nextProps.sellAmount &&
    prevProps.buyAmount === nextProps.buyAmount &&
    prevProps.sellBlockchain === nextProps.sellBlockchain &&
    prevProps.buyBlockchain === nextProps.buyBlockchain &&
    prevProps.loading === nextProps.loading &&
    prevProps.account === nextProps.account &&
    prevProps.restrictTokens === nextProps.restrictTokens &&
    prevProps.supportedTokens === nextProps.supportedTokens &&
    prevProps.customTokens === nextProps.customTokens
  );
});
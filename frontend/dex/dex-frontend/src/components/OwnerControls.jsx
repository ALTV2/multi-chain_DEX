import React, { useMemo } from 'react';
import { TOKENS } from '../constants/blockchains';

const OwnerControls = ({
  isOwner,
  restrictTokens,
  toggleTokenRestriction,
  loading,
  supportedTokens,
  addToken,
}) => {
  const allTokens = useMemo(() => {
    return Object.values(TOKENS)
      .flatMap((blockchainTokens) => Object.values(blockchainTokens))
      .filter((token) => token.address !== TOKENS.ETHEREUM.ETH.address);
  }, []);

  if (!isOwner) return null;

  return (
    <section className="owner-controls card">
      <h2>Owner Controls</h2>
      <div className="restriction-toggle">
        <p>
          Token Restriction: <span>{restrictTokens ? 'Enabled' : 'Disabled'}</span>
        </p>
        <button
          onClick={toggleTokenRestriction}
          disabled={loading}
          className="button button-primary"
        >
          {loading ? (
            <>
              Toggling <span className="spinner"></span>
            </>
          ) : restrictTokens ? 'Disable Restriction' : 'Enable Restriction'}
          <span className="tooltip">Toggle token restriction</span>
        </button>
      </div>
      <div className="token-manager">
        <h3>Manage Tokens</h3>
        <div>
          {allTokens.map((token) => (
            <div key={token.address} className="token-item">
              <div>
                <img src={token.icon} alt={token.symbol} className="token-icon" />
                <span>
                  {token.symbol}: {supportedTokens[token.address] ? 'Supported' : 'Not Supported'}
                </span>
              </div>
              {!supportedTokens[token.address] && (
                <button
                  onClick={() => addToken(token.address)}
                  disabled={loading || !restrictTokens}
                  className="button button-primary"
                >
                  {loading ? (
                    <>
                      Adding <span className="spinner"></span>
                    </>
                  ) : 'Add Token'}
                  <span className="tooltip">Add token to supported list</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OwnerControls;
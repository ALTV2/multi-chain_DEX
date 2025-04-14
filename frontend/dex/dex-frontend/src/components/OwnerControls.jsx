// src/components/OwnerControls.jsx
import React from 'react';
import { TOKENS } from '../constants/blockchains'; // Обновлённый импорт

const OwnerControls = ({
  isOwner,
  restrictTokens,
  toggleTokenRestriction,
  loading,
  supportedTokens,
  addToken
}) => {
  if (!isOwner) return null;

  return (
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
  );
};

export default OwnerControls;
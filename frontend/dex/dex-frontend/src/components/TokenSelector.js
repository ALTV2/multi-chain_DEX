// src/components/TokenSelector.js
import React, { useState } from 'react';
import { blockchains, tokens } from '../constants/blockchains';

function TokenSelector({ onSelect, label }) {
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');
  const [selectedToken, setSelectedToken] = useState('');

  const availableTokens = tokens.filter(token => token.blockchain === selectedBlockchain);

  const handleBlockchainChange = (e) => {
    setSelectedBlockchain(e.target.value);
    setSelectedToken(''); // Сбрасываем токен при смене блокчейна
  };

  const handleTokenChange = (e) => {
    const tokenId = e.target.value;
    setSelectedToken(tokenId);
    onSelect({ blockchain: selectedBlockchain, token: tokenId });
  };

  return (
    <div style={{ margin: '10px' }}>
      <label>{label}</label>
      <div>
        <select value={selectedBlockchain} onChange={handleBlockchainChange}>
          {blockchains.map(bc => (
            <option key={bc.id} value={bc.id}>
              {bc.name}
            </option>
          ))}
        </select>
        <select value={selectedToken} onChange={handleTokenChange}>
          <option value="">Выберите токен</option>
          {availableTokens.map(token => (
            <option key={token.id} value={token.id}>
              {token.name}
            </option>
          ))}
        </select>
        {selectedBlockchain && (
          <img
            src={blockchains.find(bc => bc.id === selectedBlockchain).icon}
            alt={selectedBlockchain}
            width="20"
            style={{ verticalAlign: 'middle', marginLeft: '5px' }}
          />
        )}
        {selectedToken && (
          <img
            src={tokens.find(t => t.id === selectedToken).icon}
            alt={selectedToken}
            width="20"
            style={{ verticalAlign: 'middle', marginLeft: '5px' }}
          />
        )}
      </div>
    </div>
  );
}

export default TokenSelector;
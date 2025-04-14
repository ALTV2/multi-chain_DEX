import React, { useState, useMemo, useRef, useCallback } from 'react';
import { blockchains, TOKENS } from '../constants/blockchains';
import { formatUnits } from 'ethers';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Компонент для отображения активных ордеров с фильтрацией и сортировкой
const OrderBook = ({ orders, executeOrder, cancelOrder, loading, account, customTokens }) => {
  const [filters, setFilters] = useState({
    sellBlockchain: '',
    sellToken: '',
    buyBlockchain: '',
    buyToken: '',
    sort: '',
    sortOrder: 'asc',
  });

  const tableRef = useRef(null);

  // Мемоизация отфильтрованных и отсортированных ордеров
  const filteredOrders = useMemo(() => {
    const allTokens = Object.values(TOKENS).reduce((acc, tokens) => ({ ...acc, ...tokens }), {});
    const allCustomTokens = Object.values(customTokens).reduce((acc, tokens) => ({ ...acc, ...tokens }), {});

    let result = orders.filter((order) => {
      const sellTokenInfo = allTokens[order.tokenToSell] || allCustomTokens[order.tokenToSell];
      const buyTokenInfo = allTokens[order.tokenToBuy] || allCustomTokens[order.tokenToBuy];
      return (
        (!filters.sellBlockchain || sellTokenInfo?.blockchain === filters.sellBlockchain) &&
        (!filters.sellToken || order.tokenToSell === filters.sellToken) &&
        (!filters.buyBlockchain || buyTokenInfo?.blockchain === filters.buyBlockchain) &&
        (!filters.buyToken || order.tokenToBuy === filters.buyToken)
      );
    });

    result = result.map((order) => ({
      ...order,
      isKnown: !!(allTokens[order.tokenToSell] || allCustomTokens[order.tokenToSell]) &&
                !!(allTokens[order.tokenToBuy] || allCustomTokens[order.tokenToBuy]),
      isOwnOrder: account && order.creator.toLowerCase() === account.toLowerCase(),
    }));

    if (filters.sort === 'price') {
      result.sort((a, b) => {
        const priceA = Number(a.buyAmount) / Number(a.sellAmount);
        const priceB = Number(b.buyAmount) / Number(b.sellAmount);
        if (a.isKnown && !b.isKnown) return -1;
        if (!a.isKnown && b.isKnown) return 1;
        return filters.sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    } else {
      result.sort((a, b) => (a.isKnown && !b.isKnown ? -1 : !a.isKnown && b.isKnown ? 1 : 0));
    }

    return result;
  }, [orders, filters, customTokens, account]);

  const handleSort = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      sort: 'price',
      sortOrder: prev.sort === 'price' && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Дефолтная иконка для токенов с проверкой
  const getTokenIcon = useCallback((token, blockchain) => {
    const icon =
      (blockchain && TOKENS[blockchain.toUpperCase()]?.[token]?.icon) ||
      (blockchain && customTokens[blockchain.toUpperCase()]?.[token]?.icon) ||
      '/icons/fallback.svg';
    if (icon === '/icons/fallback.svg') {
      console.warn(`No icon found for token: ${token} on blockchain: ${blockchain}`);
    }
    return icon;
  }, [customTokens]);

  // Deduplicate tokens for dropdowns
  const uniqueTokens = useMemo(() => {
    const seen = new Set();
    const tokens = [
      ...Object.values(TOKENS).flatMap((tokens) => Object.values(tokens)),
      ...Object.values(customTokens).flatMap((tokens) => Object.values(tokens)),
    ].filter((token) => {
      if (seen.has(token.address)) return false;
      seen.add(token.address);
      return true;
    });
    return tokens;
  }, [customTokens]);

  return (
    <section className="card">
      <h2>
        Active Orders {loading && <span className="spinner"></span>}
      </h2>
      <div className="filters">
        <select
          onChange={(e) => setFilters((f) => ({ ...f, sellBlockchain: e.target.value }))}
          value={filters.sellBlockchain}
          className="select"
        >
          <option value="">All Sell Blockchains</option>
          {blockchains.map((bc) => (
            <option key={bc.id} value={bc.id}>
              {bc.name}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => setFilters((f) => ({ ...f, sellToken: e.target.value }))}
          value={filters.sellToken}
          className="select"
        >
          <option value="">All Sell Tokens</option>
          {uniqueTokens.map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol || t.name}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => setFilters((f) => ({ ...f, buyBlockchain: e.target.value }))}
          value={filters.buyBlockchain}
          className="select"
        >
          <option value="">All Buy Blockchains</option>
          {blockchains.map((bc) => (
            <option key={bc.id} value={bc.id}>
              {bc.name}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => setFilters((f) => ({ ...f, buyToken: e.target.value }))}
          value={filters.buyToken}
          className="select"
        >
          <option value="">All Buy Tokens</option>
          {uniqueTokens.map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol || t.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSort}
          className="button button-primary"
        >
          Sort by Price
          {filters.sort === 'price' && (
            filters.sortOrder === 'asc' ? <ChevronUp className="token-icon" /> : <ChevronDown className="token-icon" />
          )}
          <span className="tooltip">Sort orders by price</span>
        </button>
      </div>
      {filteredOrders.length === 0 ? (
        <p>No active orders</p>
      ) : (
        <div className="table-wrapper" ref={tableRef}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Sell Blockchain</th>
                <th>Sell Token</th>
                <th>Sell Amount</th>
                <th>Buy Blockchain</th>
                <th>Buy Token</th>
                <th>Buy Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const sellTokenInfo =
                  Object.values(TOKENS).reduce((acc, tokens) => ({ ...acc, ...tokens }), {})[order.tokenToSell] ||
                  Object.values(customTokens).reduce((acc, tokens) => ({ ...acc, ...tokens }), {})[order.tokenToSell];
                const buyTokenInfo =
                  Object.values(TOKENS).reduce((acc, tokens) => ({ ...acc, ...tokens }), {})[order.tokenToBuy] ||
                  Object.values(customTokens).reduce((acc, tokens) => ({ ...acc, ...tokens }), {})[order.tokenToBuy];
                return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      <img
                        src={blockchains.find((bc) => bc.id === sellTokenInfo?.blockchain)?.icon || '/icons/fallback.svg'}
                        alt="sell blockchain"
                        className="token-icon"
                        onError={(e) => {
                          console.warn('Sell blockchain icon load failed:', sellTokenInfo?.blockchain);
                          e.target.src = '/icons/fallback.svg';
                        }}
                      />
                      {blockchains.find((bc) => bc.id === sellTokenInfo?.blockchain)?.name || 'Unknown'}
                    </td>
                    <td>
                      <img
                        src={getTokenIcon(order.tokenToSell, sellTokenInfo?.blockchain)}
                        alt="sell token"
                        className="token-icon"
                        onError={(e) => {
                          console.warn('Sell token icon load failed:', order.tokenToSell);
                          e.target.src = '/icons/fallback.svg';
                        }}
                      />
                      {sellTokenInfo?.symbol || sellTokenInfo?.name || `${order.tokenToSell.slice(0, 6)}...${order.tokenToSell.slice(-4)}`}
                    </td>
                    <td>{Number(formatUnits(order.sellAmount, sellTokenInfo?.decimals || 18)).toFixed(4)}</td>
                    <td>
                      <img
                        src={blockchains.find((bc) => bc.id === buyTokenInfo?.blockchain)?.icon || '/icons/fallback.svg'}
                        alt="buy blockchain"
                        className="token-icon"
                        onError={(e) => {
                          console.warn('Buy blockchain icon load failed:', buyTokenInfo?.blockchain);
                          e.target.src = '/icons/fallback.svg';
                        }}
                      />
                      {blockchains.find((bc) => bc.id === buyTokenInfo?.blockchain)?.name || 'Unknown'}
                    </td>
                    <td>
                      <img
                        src={getTokenIcon(order.tokenToBuy, buyTokenInfo?.blockchain)}
                        alt="buy token"
                        className="token-icon"
                        onError={(e) => {
                          console.warn('Buy token icon load failed:', order.tokenToBuy);
                          e.target.src = '/icons/fallback.svg';
                        }}
                      />
                      {buyTokenInfo?.symbol || buyTokenInfo?.name || `${order.tokenToBuy.slice(0, 6)}...${order.tokenToBuy.slice(-4)}`}
                    </td>
                    <td>{Number(formatUnits(order.buyAmount, buyTokenInfo?.decimals || 18)).toFixed(4)}</td>
                    <td>
                      <button
                        onClick={() => executeOrder(order.id)}
                        disabled={!account || loading || order.isOwnOrder}
                        className="button button-primary"
                      >
                        Execute
                        <span className="tooltip">{order.isOwnOrder ? 'Cannot execute your own order' : 'Execute this order'}</span>
                      </button>
                      {order.isOwnOrder && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          disabled={!account || loading}
                          className="button button-danger"
                        >
                          Cancel
                          <span className="tooltip">Cancel your order</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default React.memo(OrderBook, (prevProps, nextProps) => {
  return (
    prevProps.orders === nextProps.orders &&
    prevProps.loading === nextProps.loading &&
    prevProps.account === nextProps.account &&
    prevProps.customTokens === nextProps.customTokens
  );
});
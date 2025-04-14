import React, { useState, useMemo, useRef } from 'react';
import { blockchains, TOKENS } from '../constants/blockchains';
import { formatUnits } from 'ethers';
import { ChevronDown, ChevronUp } from 'lucide-react';

const OrderBook = ({ orders, executeOrder, cancelOrder, loading, account }) => {
  const [filters, setFilters] = useState({
    sellBlockchain: '',
    sellToken: '',
    buyBlockchain: '',
    buyToken: '',
    sort: '',
    sortOrder: 'asc',
  });

  const tableRef = useRef(null);

  const filteredOrders = useMemo(() => {
    let result = orders.filter((order) => {
      const sellTokenInfo = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToSell)];
      const buyTokenInfo = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToBuy)];
      return (
        (!filters.sellBlockchain || sellTokenInfo?.blockchain === filters.sellBlockchain) &&
        (!filters.sellToken || order.tokenToSell === filters.sellToken) &&
        (!filters.buyBlockchain || buyTokenInfo?.blockchain === filters.buyBlockchain) &&
        (!filters.buyToken || order.tokenToBuy === filters.buyToken)
      );
    });

    if (filters.sort === 'price') {
      result.sort((a, b) => {
        const priceA = Number(a.buyAmount) / Number(a.sellAmount);
        const priceB = Number(b.buyAmount) / Number(b.sellAmount);
        return filters.sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    }

    return result;
  }, [orders, filters]);

  const handleSort = () => {
    setFilters((prev) => ({
      ...prev,
      sort: 'price',
      sortOrder: prev.sort === 'price' && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="card">
      <h2>
        Active Orders {loading && <span className="spinner"></span>}
      </h2>
      <div className="filters">
        <select
          onChange={(e) => setFilters((f) => ({ ...f, sellBlockchain: e.target.value }))}
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
          className="select"
        >
          <option value="">All Sell Tokens</option>
          {Object.values(TOKENS).map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => setFilters((f) => ({ ...f, buyBlockchain: e.target.value }))}
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
          className="select"
        >
          <option value="">All Buy Tokens</option>
          {Object.values(TOKENS).map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol}
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
                const sellTokenInfo = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToSell)];
                const buyTokenInfo = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToBuy)];
                return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      <img
                        src={blockchains.find((bc) => bc.id === sellTokenInfo?.blockchain)?.icon}
                        alt="sell blockchain"
                        className="token-icon"
                      />
                      {blockchains.find((bc) => bc.id === sellTokenInfo?.blockchain)?.name || 'Unknown'}
                    </td>
                    <td>
                      <img src={sellTokenInfo?.icon} alt="sell token" className="token-icon" />
                      {sellTokenInfo?.symbol || 'Unknown'}
                    </td>
                    <td>{Number(formatUnits(order.sellAmount, sellTokenInfo?.decimals || 18)).toFixed(4)}</td>
                    <td>
                      <img
                        src={blockchains.find((bc) => bc.id === buyTokenInfo?.blockchain)?.icon}
                        alt="buy blockchain"
                        className="token-icon"
                      />
                      {blockchains.find((bc) => bc.id === buyTokenInfo?.blockchain)?.name || 'Unknown'}
                    </td>
                    <td>
                      <img src={buyTokenInfo?.icon} alt="buy token" className="token-icon" />
                      {buyTokenInfo?.symbol || 'Unknown'}
                    </td>
                    <td>{Number(formatUnits(order.buyAmount, buyTokenInfo?.decimals || 18)).toFixed(4)}</td>
                    <td>
                      <button
                        onClick={() => executeOrder(order.id)}
                        disabled={!account || loading || order.creator.toLowerCase() === account?.toLowerCase()}
                        className="button button-primary"
                      >
                        Execute
                        <span className="tooltip">Execute this order</span>
                      </button>
                      {order.creator.toLowerCase() === account?.toLowerCase() && (
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

export default OrderBook;
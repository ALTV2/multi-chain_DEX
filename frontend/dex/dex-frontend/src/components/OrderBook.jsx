import React, { useState } from 'react';
import { blockchains, TOKENS } from '../constants/blockchains';
import { formatUnits } from 'ethers';

const OrderBook = ({ orders, executeOrder, cancelOrder, loading, account }) => {
  const [filters, setFilters] = useState({
    sellBlockchain: '',
    sellToken: '',
    buyBlockchain: '',
    buyToken: '',
    sort: ''
  });

  const filteredOrders = orders.filter(order => (
    (!filters.sellBlockchain || TOKENS[Object.keys(TOKENS).find(k => TOKENS[k].address === order.tokenToSell)]?.blockchain === filters.sellBlockchain) &&
    (!filters.sellToken || order.tokenToSell === filters.sellToken) &&
    (!filters.buyBlockchain || TOKENS[Object.keys(TOKENS).find(k => TOKENS[k].address === order.tokenToBuy)]?.blockchain === filters.buyBlockchain) &&
    (!filters.buyToken || order.tokenToBuy === filters.buyToken)
  )).sort((a, b) => filters.sort === 'price' ? Number(a.buyAmount) / Number(a.sellAmount) - Number(b.buyAmount) / Number(b.sellAmount) : 0);

  return (
    <section className="order-book">
      <h2>Active Orders {loading && "(Loading...)"}</h2>
      <div className="filters">
        <select onChange={e => setFilters(f => ({ ...f, sellBlockchain: e.target.value }))}>
          <option value="">All Sell Blockchains</option>
          {blockchains.map(bc => <option key={bc.id} value={bc.id}>{bc.name}</option>)}
        </select>
        <select onChange={e => setFilters(f => ({ ...f, sellToken: e.target.value }))}>
          <option value="">All Sell Tokens</option>
          {Object.values(TOKENS).map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
        </select>
        <select onChange={e => setFilters(f => ({ ...f, buyBlockchain: e.target.value }))}>
          <option value="">All Buy Blockchains</option>
          {blockchains.map(bc => <option key={bc.id} value={bc.id}>{bc.name}</option>)}
        </select>
        <select onChange={e => setFilters(f => ({ ...f, buyToken: e.target.value }))}>
          <option value="">All Buy Tokens</option>
          {Object.values(TOKENS).map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
        </select>
        <button onClick={() => setFilters(f => ({ ...f, sort: 'price' }))}>Sort by Price</button>
      </div>
      {filteredOrders.length === 0 ? (
        <p>No active orders</p>
      ) : (
        <table>
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
                    <img src={blockchains.find(bc => bc.id === sellTokenInfo?.blockchain)?.icon} alt="sell blockchain" width="20" />
                    {blockchains.find(bc => bc.id === sellTokenInfo?.blockchain)?.name || "Unknown"}
                  </td>
                  <td>
                    <img src={sellTokenInfo?.icon} alt="sell token" width="20" />
                    {sellTokenInfo?.symbol || "Unknown"}
                  </td>
                  <td>{Number(formatUnits(order.sellAmount, sellTokenInfo?.decimals || 18)).toFixed(4)}</td>
                  <td>
                    <img src={blockchains.find(bc => bc.id === buyTokenInfo?.blockchain)?.icon} alt="buy blockchain" width="20" />
                    {blockchains.find(bc => bc.id === buyTokenInfo?.blockchain)?.name || "Unknown"}
                  </td>
                  <td>
                    <img src={buyTokenInfo?.icon} alt="buy token" width="20" />
                    {buyTokenInfo?.symbol || "Unknown"}
                  </td>
                  <td>{Number(formatUnits(order.buyAmount, buyTokenInfo?.decimals || 18)).toFixed(4)}</td>
                  <td>
                    <button
                      onClick={() => executeOrder(order.id)}
                      disabled={!account || loading || order.creator.toLowerCase() === account?.toLowerCase()}
                    >
                      Execute
                    </button>
                    {order.creator.toLowerCase() === account?.toLowerCase() && (
                      <button onClick={() => cancelOrder(order.id)} disabled={!account || loading} className="cancel-button">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default OrderBook;
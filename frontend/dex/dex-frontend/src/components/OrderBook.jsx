import React from 'react';
import { TOKENS } from '../constants/tokens';
import { formatUnits } from 'ethers';

const OrderBook = ({ orders, executeOrder, cancelOrder, loading, account }) => (
  <section className="order-book">
    <h2>Active Orders {loading && "(Loading...)"}</h2>
    {orders.length === 0 ? (
      <p>No active orders</p>
    ) : (
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Sell Token</th>
            <th>Sell Amount</th>
            <th>Buy Token</th>
            <th>Buy Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const sellTokenDecimals = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToSell)].decimals;
            const buyTokenDecimals = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToBuy)].decimals;
            return (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToSell)]?.symbol || "Unknown"}</td>
                <td>{Number(formatUnits(order.sellAmount, sellTokenDecimals)).toFixed(4)}</td>
                <td>{TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === order.tokenToBuy)]?.symbol || "Unknown"}</td>
                <td>{Number(formatUnits(order.buyAmount, buyTokenDecimals)).toFixed(4)}</td>
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

export default OrderBook;
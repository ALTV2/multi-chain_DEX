// src/components/OrderList.js
import React, { useState, useMemo } from 'react';
import { blockchains, tokens } from '../constants/blockchains';

function OrderList() {
  const [orders] = useState([
    { id: 1, sellBlockchain: 'ethereum', sellToken: 'eth', buyBlockchain: 'ton', buyToken: 'toncoin', price: 100 },
    { id: 2, sellBlockchain: 'ton', sellToken: 'toncoin', buyBlockchain: 'ethereum', buyToken: 'usdt', price: 150 },
    { id: 3, sellBlockchain: 'ethereum', sellToken: 'usdt', buyBlockchain: 'sui', buyToken: 'sui', price: 80 },
  ]);

  const [filters, setFilters] = useState({
    sellBlockchain: '',
    sellToken: '',
    buyBlockchain: '',
    buyToken: '',
    sort: '',
  });

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order =>
      (!filters.sellBlockchain || order.sellBlockchain === filters.sellBlockchain) &&
      (!filters.sellToken || order.sellToken === filters.sellToken) &&
      (!filters.buyBlockchain || order.buyBlockchain === filters.buyBlockchain) &&
      (!filters.buyToken || order.buyToken === filters.buyToken)
    );

    if (filters.sort === 'price') {
      result = result.sort((a, b) => a.price - b.price); // От выгодного к дорогому
    }

    return result;
  }, [orders, filters]);

  return (
    <div style={{ margin: '20px' }}>
      <h2>Список ордеров</h2>
      {/* Фильтры */}
      <div>
        <select onChange={e => setFilters(f => ({ ...f, sellBlockchain: e.target.value }))}>
          <option value="">Все блокчейны продажи</option>
          {blockchains.map(bc => <option key={bc.id} value={bc.id}>{bc.name}</option>)}
        </select>
        <select onChange={e => setFilters(f => ({ ...f, sellToken: e.target.value }))}>
          <option value="">Все токены продажи</option>
          {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select onChange={e => setFilters(f => ({ ...f, buyBlockchain: e.target.value }))}>
          <option value="">Все блокчейны покупки</option>
          {blockchains.map(bc => <option key={bc.id} value={bc.id}>{bc.name}</option>)}
        </select>
        <select onChange={e => setFilters(f => ({ ...f, buyToken: e.target.value }))}>
          <option value="">Все токены покупки</option>
          {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={() => setFilters(f => ({ ...f, sort: 'price' }))}>
          Сортировать по цене
        </button>
      </div>

      {/* Список ордеров */}
      <ul>
        {filteredOrders.map(order => (
          <li key={order.id} style={{ margin: '10px 0' }}>
            <img
              src={blockchains.find(bc => bc.id === order.sellBlockchain).icon}
              alt={order.sellBlockchain}
              width="20"
            />
            <img
              src={tokens.find(t => t.id === order.sellToken).icon}
              alt={order.sellToken}
              width="20"
            />
            →
            <img
              src={blockchains.find(bc => bc.id === order.buyBlockchain).icon}
              alt={order.buyBlockchain}
              width="20"
            />
            <img
              src={tokens.find(t => t.id === order.buyToken).icon}
              alt={order.buyToken}
              width="20"
            />
            Цена: {order.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OrderList;
// src/hooks/useOrders.js
import { useState, useCallback } from 'react';
import { parseUnits } from 'ethers';
import { TOKENS } from '../constants/blockchains';
import { useContract } from './useContract';

export const useOrders = (provider, signer, account) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { orderBook, trade, getERC20 } = useContract(provider, signer);

  const loadOrders = useCallback(async () => {
    if (!orderBook) return;
    setLoading(true);
    try {
      const orderCount = Number(await orderBook.orderCounter());
      const loadedOrders = [];
      for (let i = 1; i <= orderCount; i++) {
        const order = await orderBook.orders(i);
        if (order.active) {
          loadedOrders.push({
            id: order.id.toString(),
            creator: order.creator,
            tokenToSell: order.tokenToSell,
            tokenToBuy: order.tokenToBuy,
            sellAmount: order.sellAmount.toString(),
            buyAmount: order.buyAmount.toString(),
          });
        }
      }
      setOrders(loadedOrders);
    } catch (err) {
      setError("Failed to load orders: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [orderBook]);

  const createOrder = async (sellToken, buyToken, sellAmount, buyAmount) => {
    if (!orderBook || !sellAmount || !buyAmount) return;
    setLoading(true);
    setError(null);
    try {
      const sellTokenDecimals = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === sellToken)].decimals;
      const buyTokenDecimals = TOKENS[Object.keys(TOKENS).find((k) => TOKENS[k].address === buyToken)].decimals;
      const sellAmountWei = parseUnits(sellAmount, sellTokenDecimals);
      const buyAmountWei = parseUnits(buyAmount, buyTokenDecimals);

      let tx;
      if (sellToken === TOKENS.ETH.address) {
        tx = await orderBook.createOrder(sellToken, buyToken, sellAmountWei, buyAmountWei, {
          value: sellAmountWei.toString(),
        });
      } else {
        const tokenToSell = getERC20(sellToken);
        const allowance = await tokenToSell.allowance(account, orderBook.target);
        if (allowance < sellAmountWei) {
          const approveTx = await tokenToSell.approve(orderBook.target, sellAmountWei);
          await approveTx.wait();
        }
        tx = await orderBook.createOrder(sellToken, buyToken, sellAmountWei, buyAmountWei);
      }
      await tx.wait();
      await loadOrders();
      setError("Order created successfully!");
    } catch (err) {
      setError(`Failed to create order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeOrder = async (orderId) => {
    if (!trade || !account) return;
    setLoading(true);
    setError(null);
    try {
      const order = await orderBook.orders(orderId);
      console.log("Order:", order);
      console.log("Trade contract address:", trade.target); // Логируем адрес контракта
      if (!order.active) throw new Error("Order is not active");
      if (order.creator.toLowerCase() === account.toLowerCase()) {
        throw new Error("Cannot execute your own order");
      }
      console.log("Tests: 1"); // Логируем адрес контракта

      let tx;
      console.log("Tests: 2"); // Логируем адрес контракта
      if (order.tokenToBuy === TOKENS.ETH.address) {
      console.log("Tests: 3"); // Логируем адрес контракта
        tx = await trade.executeOrder(orderId, { value: order.buyAmount.toString() });
      } else {
            console.log("Tests: 4"); // Логируем адрес контракта
        const tokenToBuy = getERC20(order.tokenToBuy);
        const allowance = await tokenToBuy.allowance(account, trade.target);
        console.log(`Allowance: ${allowance.toString()}, Needed: ${order.buyAmount.toString()}`);
        console.log("Tests: 5"); // Логируем адрес контракта
        if (allowance < order.buyAmount) {
          console.log("Approving...");
          const approveTx = await tokenToBuy.approve(trade.target, order.buyAmount);
          await approveTx.wait(2); // Ждём 2 подтверждения для надёжности
          console.log("Approve confirmed");
          const newAllowance = await tokenToBuy.allowance(account, trade.target);
          console.log(`New allowance: ${newAllowance.toString()}`);
        }
        tx = await trade.executeOrder(orderId);
      }
      console.log("Tests: 6"); // Логируем адрес контракта
      await tx.wait();
      await loadOrders();
      setError("Order executed successfully!");
    } catch (err) {
      setError(`Failed to execute order: ${err.message}`);
      console.error("Error details:", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!orderBook || !account) return;
    setLoading(true);
    setError(null);
    try {
      const order = await orderBook.orders(orderId);
      if (!order.active) throw new Error("Order is already inactive");
      if (order.creator.toLowerCase() !== account.toLowerCase()) {
        throw new Error("You can only cancel your own orders");
      }

      const tx = await orderBook.cancelOrder(orderId);
      await tx.wait();
      await loadOrders();
      setError("Order cancelled successfully!");
    } catch (err) {
      setError(`Failed to cancel order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, error, loadOrders, createOrder, executeOrder, cancelOrder, setError };
};
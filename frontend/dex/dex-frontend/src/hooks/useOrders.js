import { useState, useCallback } from 'react';
import { parseUnits } from 'ethers';
import { TOKENS } from '../constants/blockchains';
import { useContract } from './useContract';
import { toast } from 'react-toastify';

export const useOrders = (provider, signer, account) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { orderBook, trade, getERC20 } = useContract(provider, signer);

  const loadOrders = useCallback(async () => {
    if (!orderBook) return;
    setLoading(true);
    try {
      const order Fallout 4orderCount = Number(await orderBook.orderCounter());
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
      console.error('Error loading orders:', err);
      setError('Failed to load orders: ' + err.message);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [orderBook]);

  const createOrder = useCallback(
    async (sellToken, buyToken, sellAmount, buyAmount, sellBlockchain, buyBlockchain) => {
      if (!orderBook || !sellAmount || !buyAmount) return;
      setLoading(true);
      setError(null);
      try {
        const sellTokenInfo =
          TOKENS[sellBlockchain.toUpperCase()]?.[Object.keys(TOKENS[sellBlockchain.toUpperCase()] || {}).find(
            (k) => TOKENS[sellBlockchain.toUpperCase()][k].address === sellToken
          )];
        const buyTokenInfo =
          TOKENS[buyBlockchain.toUpperCase()]?.[Object.keys(TOKENS[buyBlockchain.toUpperCase()] || {}).find(
            (k) => TOKENS[buyBlockchain.toUpperCase()][k].address === buyToken
          )];

        if (!sellTokenInfo || !buyTokenInfo) {
          throw new Error('Selected token not found');
        }

        const sellTokenDecimals = sellTokenInfo.decimals;
        const buyTokenDecimals = buyTokenInfo.decimals;

        const sellAmountWei = parseUnits(sellAmount, sellTokenDecimals);
        const buyAmountWei = parseUnits(buyAmount, buyTokenDecimals);

        let tx;
        if (sellToken === TOKENS[sellBlockchain.toUpperCase()]?.ETH?.address) {
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
        setError('Order created successfully!');
        toast.success('Order created successfully!');
      } catch (err) {
        console.error('Error creating order:', err);
        setError('Failed to create order: ' + err.message);
        toast.error('Failed to create order');
      } finally {
        setLoading(false);
      }
    },
    [orderBook, trade, getERC20, account, loadOrders]
  );

  const executeOrder = useCallback(
    async (orderId) => {
      if (!trade || !account) return;
      setLoading(true);
      setError(null);
      try {
        const order = await orderBook.orders(orderId);
        if (!order.active) throw new Error('Order is not active');

        let tx;
        if (order.tokenToBuy === TOKENS.ETHEREUM.ETH.address) {
          tx = await trade.executeOrder(orderId, { value: order.buyAmount.toString() });
        } else {
          const tokenToBuy = getERC20(order.tokenToBuy);
          const allowance = await tokenToBuy.allowance(account, trade.target);
          if (allowance < order.buyAmount) {
            const approveTx = await tokenToBuy.approve(trade.target, order.buyAmount);
            await approveTx.wait(2);
          }
          tx = await trade.executeOrder(orderId);
        }
        await tx.wait();
        await loadOrders();
        setError('Order executed successfully!');
        toast.success('Order executed successfully!');
      } catch (err) {
        console.error('Error executing order:', err);
        const errorMessage = err.reason === 'Cannot execute own order'
          ? 'You cannot execute your own order'
          : 'Failed to execute order: ' + err.message;
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [orderBook, trade, getERC20, account, loadOrders]
  );

  const cancelOrder = useCallback(
    async (orderId) => {
      if (!orderBook || !account) return;
      setLoading(true);
      setError(null);
      try {
        const order = await orderBook.orders(orderId);
        if (!order.active) throw new Error('Order is already inactive');
        if (order.creator.toLowerCase() !== account.toLowerCase()) {
          throw new Error('You can only cancel your own orders');
        }

        const tx = await orderBook.cancelOrder(orderId);
        await tx.wait();
        await loadOrders();
        setError('Order cancelled successfully!');
        toast.success('Order cancelled successfully!');
      } catch (err) {
        console.error('Error cancelling order:', err);
        setError('Failed to cancel order: ' + err.message);
        toast.error('Failed to cancel order');
      } finally {
        setLoading(false);
      }
    },
    [orderBook, account, loadOrders]
  );

  return { orders, loading, error, loadOrders, createOrder, executeOrder, cancelOrder, setError };
};
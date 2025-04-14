import { useState, useEffect, useCallback } from 'react';
import { Contract, isAddress } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants/contracts';
import { OrderBookABI, TradeABI, ERC20ABI } from '../constants/abis';

export const useContract = (provider, signer) => {
  const [orderBook, setOrderBook] = useState(null);
  const [trade, setTrade] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!provider || !signer || isInitialized || error) return;

    const initializeContracts = async () => {
      try {
        const orderBookAddress = CONTRACT_ADDRESSES.ORDERBOOK;
        const tradeAddress = CONTRACT_ADDRESSES.TRADE;

        // Проверка валидности адресов
        if (!isAddress(orderBookAddress)) {
          throw new Error(`Invalid orderBook contract address: ${orderBookAddress}`);
        }
        if (!isAddress(tradeAddress)) {
          throw new Error(`Invalid trade contract address: ${tradeAddress}`);
        }

        const orderBookContract = new Contract(orderBookAddress, OrderBookABI, signer);
        const tradeContract = new Contract(tradeAddress, TradeABI, signer);

        console.log('OrderBook contract initialized at:', orderBookAddress);
        console.log('Trade contract initialized at:', tradeAddress);

        setOrderBook(orderBookContract);
        setTrade(tradeContract);
        setError(null);
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing contracts:', err);
        setError('Failed to initialize contracts: ' + err.message);
      }
    };

    initializeContracts();
  }, [provider, signer, isInitialized, error]);

  const getERC20 = useCallback((tokenAddress) => {
    if (!signer || !isAddress(tokenAddress)) {
      console.warn('Invalid token address or no signer:', tokenAddress);
      return null;
    }
    return new Contract(tokenAddress, ERC20ABI, signer);
  }, [signer]);

  return { orderBook, trade, getERC20, error, setError };
};
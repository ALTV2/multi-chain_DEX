import { useMemo } from 'react';
import { Contract } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants/contracts';
import OrderBookABI from '../constants/abis/OrderBook.json';
import TradeABI from '../constants/abis/Trade.json';
import TokenManagerABI from '../constants/abis/TokenManager.json';
import ERC20ABI from '@openzeppelin/contracts/build/contracts/ERC20.json';

export const useContract = (provider, signer) => {
  const contracts = useMemo(() => {
    if (!provider) return {};

    const orderBook = new Contract(
      CONTRACT_ADDRESSES.ORDERBOOK,
      OrderBookABI.abi,
      signer || provider
    );
    const trade = new Contract(
      CONTRACT_ADDRESSES.TRADE,
      TradeABI.abi,
      signer || provider
    );
    const tokenManager = new Contract(
      CONTRACT_ADDRESSES.TOKENMANAGER,
      TokenManagerABI.abi,
      signer || provider
    );

    return {
      orderBook,
      trade,
      tokenManager,
      getERC20: (address) => new Contract(address, ERC20ABI.abi, signer || provider),
    };
  }, [provider, signer]);

  return contracts;
};
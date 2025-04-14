import { useState, useCallback, useEffect } from 'react';
import { Contract } from 'ethers';
import { useContract } from './useContract';
import { TokenManagerABI } from '../constants/abis';

// Хук для управления токенами и настройками контракта
export const useTokenManager = (provider, signer, account) => {
  const [isOwner, setIsOwner] = useState(false);
  const [restrictTokens, setRestrictTokens] = useState(false);
  const [supportedTokens, setSupportedTokens] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { orderBook, error: contractError } = useContract(provider, signer);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkOwnership = useCallback(async () => {
    if (!orderBook || !account) return;
    try {
      const owner = await orderBook.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error('Error checking ownership:', err);
      setError('Failed to check ownership: ' + err.message);
    }
  }, [orderBook, account]);

  const checkRestrictTokens = useCallback(async () => {
    if (!orderBook) return;
    try {
      const restrict = await orderBook.restrictTokens();
      setRestrictTokens(restrict);
    } catch (err) {
      console.error('Error checking restrictTokens:', err);
      setError('Failed to check restrictTokens: ' + err.message);
    }
  }, [orderBook]);

  const checkSupportedTokens = useCallback(async () => {
    if (!orderBook || !signer) return;
    try {
      const tokenManagerAddress = await orderBook.tokenManager();
      const tokenManager = new Contract(tokenManagerAddress, TokenManagerABI, signer);
      const tokens = await tokenManager.getSupportedTokens();
      setSupportedTokens(Object.fromEntries(tokens.map((t) => [t, true])));
    } catch (err) {
      console.error('Error checking supported tokens:', err);
      setError('Failed to check supported tokens: ' + err.message);
    }
  }, [orderBook, signer]);

  const toggleTokenRestriction = useCallback(async () => {
    if (!orderBook) return;
    setLoading(true);
    try {
      const tx = await orderBook.toggleTokenRestriction();
      await tx.wait();
      await checkRestrictTokens();
    } catch (err) {
      console.error('Error toggling token restriction:', err);
      setError('Failed to toggle token restriction: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [orderBook, checkRestrictTokens]);

  const addToken = useCallback(async (tokenAddress) => {
    if (!orderBook) return;
    setLoading(true);
    try {
      const tokenManagerAddress = await orderBook.tokenManager();
      const tokenManager = new Contract(tokenManagerAddress, TokenManagerABI, signer);
      const tx = await tokenManager.addToken(tokenAddress);
      await tx.wait();
      await checkSupportedTokens();
    } catch (err) {
      console.error('Error adding token:', err);
      setError('Failed to add token: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [orderBook, signer, checkSupportedTokens]);

  // Обработка ошибок из useContract
  useEffect(() => {
    if (contractError) {
      setError(contractError);
    }
  }, [contractError]);

  // Инициализация с контролем вызовов
  useEffect(() => {
    if (!orderBook || !account || isInitialized) return;

    setLoading(true);
    Promise.all([checkOwnership(), checkRestrictTokens(), checkSupportedTokens()])
      .then(() => setIsInitialized(true))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderBook, account, isInitialized, checkOwnership, checkRestrictTokens, checkSupportedTokens]);

  return {
    isOwner,
    restrictTokens,
    supportedTokens,
    loading,
    error,
    toggleTokenRestriction,
    addToken,
    setError,
  };
};
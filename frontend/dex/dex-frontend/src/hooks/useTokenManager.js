// src/hooks/useTokenManager.js
import { useState, useCallback } from 'react';
import { TOKENS } from '../constants/blockchains'; // Обновлённый импорт
import { useContract } from './useContract';

export const useTokenManager = (provider, signer, account) => {
  const [isOwner, setIsOwner] = useState(false);
  const [restrictTokens, setRestrictTokens] = useState(false);
  const [supportedTokens, setSupportedTokens] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { orderBook, tokenManager } = useContract(provider, signer);

  const checkOwnership = useCallback(async () => {
    if (!orderBook || !account) return;
    try {
      const owner = await orderBook.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error("Error checking ownership:", err);
    }
  }, [orderBook, account]);

  const checkRestrictTokens = useCallback(async () => {
    if (!orderBook) return;
    try {
      const restricted = await orderBook.restrictTokens();
      setRestrictTokens(restricted);
    } catch (err) {
      console.error("Error checking restrictTokens:", err);
    }
  }, [orderBook]);

  const checkSupportedTokens = useCallback(async () => {
    if (!tokenManager) return;
    try {
      const supported = {};
      for (const token of Object.values(TOKENS)) {
        if (token.address !== TOKENS.ETH.address) {
          supported[token.address] = await tokenManager.supportedTokens(token.address);
        } else {
          supported[token.address] = true;
        }
      }
      setSupportedTokens(supported);
    } catch (err) {
      console.error("Error checking supported tokens:", err);
    }
  }, [tokenManager]);

  const toggleTokenRestriction = async () => {
    if (!orderBook || !isOwner) return;
    setLoading(true);
    setError(null);
    setError(null);
    try {
      const tx = await orderBook.toggleTokenRestriction(!restrictTokens);
      await tx.wait();
      setRestrictTokens(!restrictTokens);
      setError("Token restriction toggled successfully!");
    } catch (err) {
      setError("Failed to toggle restriction: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToken = async (tokenAddress) => {
    if (!tokenManager || !isOwner || tokenAddress === TOKENS.ETH.address) return;
    setLoading(true);
    setError(null);
    try {
      const tx = await tokenManager.addToken(tokenAddress);
      await tx.wait();
      setError("Token added successfully!");
      await checkSupportedTokens();
    } catch (err) {
      setError("Failed to add token: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    isOwner,
    restrictTokens,
    supportedTokens,
    loading,
    error,
    checkOwnership,
    checkRestrictTokens,
    checkSupportedTokens,
    toggleTokenRestriction,
    addToken,
    setError
  };
};
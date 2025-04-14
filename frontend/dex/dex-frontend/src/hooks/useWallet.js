import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

// Хук для управления подключением кошелька
export const useWallet = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasAutoConnected, setHasAutoConnected] = useState(false);

  const checkNetwork = useCallback(async (provider) => {
    try {
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 11155111) { // Sepolia chain ID
        setError('Please switch to Sepolia network in MetaMask');
        return false;
      }
      return true;
    } catch (err) {
      setError('Failed to check network: ' + err.message);
      return false;
    }
  }, []);

  const connectWallet = useCallback(
    async (autoConnect = false) => {
      if (isConnecting) {
        console.log('Connection skipped: already connecting');
        return;
      }
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install it to use this app.');
        return;
      }
      setIsConnecting(true);
      setError(null);

      // Таймаут для MetaMask запросов
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('MetaMask connection timed out')), 15000); // 15 секунд
      });

      try {
        const provider = new BrowserProvider(window.ethereum);
        if (!(await checkNetwork(provider))) {
          setIsConnecting(false);
          return;
        }

        const accounts = await Promise.race([provider.send('eth_accounts', []), timeoutPromise]);

        if (accounts.length > 0 || !autoConnect) {
          if (!autoConnect) {
            try {
              await Promise.race([provider.send('eth_requestAccounts', []), timeoutPromise]);
            } catch (err) {
              if (err.code === -32002) {
                throw new Error('MetaMask request already pending. Please check MetaMask.');
              }
              throw err;
            }
          }
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setProvider(provider);
          setSigner(signer);
          setAccount(address);
          console.log('Wallet connected:', address);
          if (autoConnect) {
            setHasAutoConnected(true);
          }
        } else if (autoConnect) {
          setProvider(provider);
          console.log('Auto-connect: No accounts found, provider set');
          setHasAutoConnected(true);
        }
      } catch (err) {
        console.error('Wallet connection error:', err);
        setError(err.message || 'Failed to connect wallet');
      } finally {
        setIsConnecting(false);
      }
    },
    [isConnecting, checkNetwork]
  );

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setError(null);
    setIsConnecting(false);
    setHasAutoConnected(false);
    console.log('Wallet disconnected');
  }, []);

  useEffect(() => {
    if (!hasAutoConnected) {
      console.log('Attempting auto-connect');
      connectWallet(true);
    }
  }, [connectWallet, hasAutoConnected]);

  useEffect(() => {
    if (!window.ethereum) return;

    let timeout;
    const handleAccountsChanged = (accounts) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      }, 100);
    };

    const handleChainChanged = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log('Chain changed, resetting...');
        disconnectWallet();
      }, 100);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnectWallet]);

  return { provider, signer, account, connectWallet, disconnectWallet, error, isConnecting };
};
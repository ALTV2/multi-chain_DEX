import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

export const useWallet = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  const connectWallet = useCallback(async (autoConnect = false) => {
    try {
      if (!window.ethereum) throw new Error('Please install MetaMask!');
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length > 0 || !autoConnect) {
        if (!autoConnect) await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setProvider(provider);
        setSigner(signer);
        setAccount(address);
      } else if (autoConnect) {
        setProvider(provider);
      }
    } catch (err) {
      if (!autoConnect) throw err;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
  }, []);

  useEffect(() => {
    connectWallet(true);
  }, [connectWallet]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => setAccount(accounts[0] || null);
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return { provider, signer, account, connectWallet, disconnectWallet };
};
import React, { useState, useCallback } from 'react';
import { Wallet, Mail } from 'lucide-react';
import { toast } from 'react-toastify';

// Компонент заголовка с подключением кошелька и привязкой email
const Header = ({ account, connectWallet, disconnectWallet, loading, isConnecting }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = useCallback((email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }, []);

  const handleLinkEmail = useCallback(async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    try {
      const response = await fetch('https://future-service.com/link-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: account, email }),
      });
      if (response.ok) {
        toast.success('Email linked successfully!');
        setShowEmailModal(false);
        setEmail('');
      } else {
        setEmailError('Failed to link email. Try again.');
      }
    } catch (err) {
      setEmailError('Network error. Please try again.');
    }
  }, [email, account, validateEmail]);

  return (
    <header className="header card">
      <h1>DEX Order Book</h1>
      <div className="wallet-info">
        {!account ? (
          <>
            <button
              onClick={() => connectWallet(false)}
              disabled={loading || isConnecting}
              className="button button-primary pulse"
            >
              <Wallet className="token-icon" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              <span className="tooltip">Connect your wallet</span>
            </button>
            {isConnecting && (
              <p className="info">Connecting to MetaMask... Please confirm in your wallet</p>
            )}
          </>
        ) : (
          <>
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <button
              onClick={() => setShowEmailModal(true)}
              disabled={loading || isConnecting}
              className="button button-primary"
            >
              <Mail className="token-icon" />
              Link Email
              <span className="tooltip">Link email to wallet</span>
            </button>
            <button
              onClick={disconnectWallet}
              disabled={loading || isConnecting}
              className="button button-danger"
            >
              Disconnect
              <span className="tooltip">Disconnect wallet</span>
            </button>
          </>
        )}
      </div>
      {showEmailModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Link Email</h2>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoFocus
            />
            {emailError && <p className="error">{emailError}</p>}
            <button
              onClick={handleLinkEmail}
              className="button button-primary"
            >
              Submit
            </button>
            <button
              onClick={() => setShowEmailModal(false)}
              className="button button-danger"
              style={{ marginTop: '0.5rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default React.memo(Header, (prevProps, nextProps) => {
  return (
    prevProps.account === nextProps.account &&
    prevProps.loading === nextProps.loading &&
    prevProps.isConnecting === nextProps.isConnecting
  );
});
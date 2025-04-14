import React, { useState } from 'react';
import { Wallet, Mail } from 'lucide-react';

const Header = ({ account, connectWallet, disconnectWallet, loading }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLinkEmail = async () => {
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
        alert('Email linked successfully!');
        setShowEmailModal(false);
        setEmail('');
      } else {
        setEmailError('Failed to link email. Try again.');
      }
    } catch (err) {
      setEmailError('Network error. Please try again.');
    }
  };

  return (
    <header className="header card">
      <h1>DEX Order Book</h1>
      <div className="wallet-info">
        {!account ? (
          <button
            onClick={() => connectWallet(false)}
            disabled={loading}
            className="button button-primary pulse"
          >
            <Wallet className="token-icon" />
            {loading ? 'Connecting...' : 'Connect Wallet'}
            <span className="tooltip">Connect your wallet</span>
          </button>
        ) : (
          <>
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <button
              onClick={() => setShowEmailModal(true)}
              disabled={loading}
              className="button button-primary"
            >
              <Mail className="token-icon" />
              Link Email
              <span className="tooltip">Link email to wallet</span>
            </button>
            <button
              onClick={disconnectWallet}
              disabled={loading}
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

export default Header;
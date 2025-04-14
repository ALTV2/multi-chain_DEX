export const blockchains = [
  { id: 'ethereum', name: 'Ethereum', icon: '/icons/ethereum.svg' },
  { id: 'ton', name: 'TON', icon: '/icons/ton.svg' },
  { id: 'sui', name: 'SUI', icon: '/icons/sui.svg' },
];

export const TOKENS = {
  ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    decimals: 18,
    blockchain: 'ethereum',
    icon: '/icons/supported_tokens/ethereum/ether.svg',
  },
  TOKEN_A: {
    address: '0x3d857Fc3510246A050817C29ea7C434ab7EbA81A',
    symbol: 'TSTA',
    decimals: 18,
    blockchain: 'ethereum',
    icon: '/icons/supported_tokens/ethereum/TSTA.svg',
  },
  TOKEN_B: {
    address: '0x20E2434C1f611D3E6C1D2947061ede1A16d04d17',
    symbol: 'TSTB',
    decimals: 18,
    blockchain: 'ethereum',
    icon: '/icons/supported_tokens/ethereum/TSTB.svg',
  },
};
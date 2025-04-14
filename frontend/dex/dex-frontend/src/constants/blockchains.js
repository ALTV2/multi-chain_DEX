export const blockchains = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: '/icons/supported_tokens/ethereum/chain.svg',
  },
  {
    id: 'ton',
    name: 'TON',
    icon: '/icons/supported_tokens/ton/chain.svg',
  },
  {
    id: 'sui',
    name: 'SUI',
    icon: '/icons/supported_tokens/sui/chain.svg',
  },
];

export const TOKENS = {
  ETHEREUM: {
    ETH: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: 18,
      blockchain: 'ethereum',
      icon: '/icons/supported_tokens/ethereum/eth.svg',
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
  },
  TON: {
    TONCOIN: {
      address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
      symbol: 'TONCOIN',
      decimals: 9,
      blockchain: 'ton',
      icon: '/icons/supported_tokens/ton/toncoin.svg',
    },
  },
  SUI: {
    SUI: {
      address: '0x2::sui::SUI',
      symbol: 'SUI',
      decimals: 9,
      blockchain: 'sui',
      icon: '/icons/supported_tokens/sui/sui.svg',
    },
  },
};
export const environment = {
  production: true,
  version: process.env['NG_APP_VERSION'],
  moralis: {
    apiKey: process.env['NG_APP_MORALIS_API_KEY']
  },
  ceramic: {
    apiHost: process.env['NG_APP_CERAMIC_API_HOST']
  },
  defaultChain: 'polygon',
  availableChainsId: {
    // ETH
    '1': 'ethereum', // mainnet
    '3': 'ropsten',
    '4': 'rinkeby',
    // POLYGON
    '89': 'polygon', // mainnet
    '13881': 'mumbai',
    // BNB
    '38': 'binance smart chain', // mainnet
    '61': 'binance smart chain testnet',
  }
};

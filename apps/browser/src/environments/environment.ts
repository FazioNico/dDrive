// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  version: 'DEV',
  moralis: {
    apiKey: process.env['NG_APP_MORALIS_API_KEY']
  },
  ceramic: {
    apiHost: process.env['NG_APP_CERAMIC_API_HOST']
  },
  ipfs: {
    pinning_service_token: process.env['NG_APP_PINATA_JWT'],
    pinning_service_endpoint: process.env['NG_APP_PINATA_PINNING_ENDPOINT'],
    unpinning_service_endpoint: process.env['NG_APP_PINATA_UNPINNING_ENDPOINT'],
  },
  defaultChain: 'mumbai',
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

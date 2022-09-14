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
};

declare module 'lit-js-sdk';
declare module '@lit-protocol/sdk-browser';
declare module '@metamask/jazzicon';
declare var process: {
  env: {
    NG_APP_ENV: string;
    // Replace the line below with your environment variable for better type checking
    [key: string]: any;
  };
};

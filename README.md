# dDrive - Decentralized Drive System 

## Project Description
dDrive is a fully decentralized and open-source Storage which replace traditional storage providers having centralized governance, cumbersome infrastructure, inadequate security and privacy measures with users datasets. 

dDrive is build on top of IPFS and inherits all the features of Blockchain Technology to emerge as an immutable, censorship-resistant, tamper-proof and privacy complient with user dataset.

## Value Proposition
dDrive integrat IPFS Core powered by Filecoin to enable users to store, manage and share their files in a decentralized way. Few of the core value propositions are:

1 Increased User Adoption: 
  Providing a smooth and intuitive process with seamless user experience to store, manage and share files in a decentralized way will increase the adoption of IPFS and Filecoin.

2 Real-world utility: 
  dDrive provide a real-world utility for censorship-resistant, tamper-proof and privacy complient storage solution by providing multi services composition that allow users to store and share files with total privacy and security controls of data access by using Encryption and Decryption technologies to increase data acces security.

## 👀 Overview

## 🚀 Features

**File Management**

  - [x] Create folder
  - [x] Delete folder
  - [x] Rename folder
  - [x] Move folder
  - [x] List files from folder
  - [x] Search files in folder
  - [x] Upload files to specific folder
  - [x] Download file
  - [x] Delete file
  - [x] Rename file
  - [x] Move file
  - [x] Share file with public url link
  - [x] Share file with custom access controls
  - [x] Preview file in app

**NFTs Management**

  - [x] List NFTs from connected wallet
  - [x] Search NFTs by name
  - [x] Filter NFTs by chain

**Options**

  - [x] Dark mode support
  - [x] Multi chain support
  - [x] Shared file Notifications
  - [x] File encryption 
  - [x] File access control with wallet address

## Technology Stack

- [x] [IFPS Core](./apps/browser/src/app/services/ipfs.service.ts) as SDK to manage files storage and retrieval to IPFS network
- [x] [Ceramic](./apps/browser/src/app/services/ceramic.service.ts) as Decentralized database to manage storage metadata and user profile data
- [x] [Lit Protocol](./apps/browser/src/app/services/lit.service.ts) as Cryptography Access Control service to encrypt files and manage access control
- [x] [XMTP](./apps/browser/src/app/services/xmtp.service.ts) as Decentralized messaging service to manage notifications
- [x] [3id Connect](./apps/browser/src/app/services/did.service.ts) as Decentralized authentication service to manage user identity
- [x] [Etherjs](./apps/browser/src/app/services/did.service.ts) as Ethereum SDK to manage Web3 wallet connection and account management 
- [x] [Moralis SDK](./apps/browser/src/app/services/nft.services.ts) as SDK to manage NFTs from Evm networks
- [x] [Valist](.github/workflows/actions.yml) as Software distribution tool to manage releases and updates hosted on IPFS

## ⚙️ Installation


## Development

- Clone the dDrive repository
- Install dependencies using NodeJS and NPM
- Install Nx Workspace CLI to manage workspace project
- Run develooppment server using `nx serve` command will open the dDrive application in the browser
- This project was generated using [Nx](https://nx.dev).

## Build
- Run `nx build` to build the dDrive application for the browser as PWA. 

The build artifacts will be stored in the `dist/` directory.

## 💻 Contributing

Thanks for taking the time to help out and improve the project! 🎉

The following is a set of guidelines for contributions and may change over time. Feel free to suggest improvements to this document in a pull request!

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📃 License

See [LICENSE](LICENSE)

import { Injectable } from "@angular/core";
import LitJsSdk from 'lit-js-sdk';

@Injectable()
export class LitService {
  public readonly chain = 'mumbai';
  public readonly standardContractType = 'ERC721'
  public readonly contractAddress = '';

  private _litNodeClient: any;

  private async _connect() {
    const client: {connect: () => Promise<void>} = new LitJsSdk.LitNodeClient({debug: false});
    await client.connect()
    this._litNodeClient = client
  }

  async encrypt(file: File | Blob): Promise<{
    encryptedFile: Blob;
    encryptedSymmetricKey: string;
  }> {
    if (!this._litNodeClient) {
      await this._connect()
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: this.chain })

    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({ file: file })
    const accessControlConditions = [
      {
        chain: this.chain,
        contractAddress: this.contractAddress,
        standardContractType: this.standardContractType,
        method: 'eth_getBalance',
        parameters: [':userAddress', 'latest'],
        returnValueTest: {
          comparator: '>=',
          value: '0',  // 0.000001 ETH
        },
      },
    ];

    const encryptedSymmetricKey = await this._litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain: this.chain,
    });
    return {
      encryptedFile,
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    }
  }

  async decrypt(encryptedFile: File|Blob, encryptedSymmetricKey: string) {
    if (!this._litNodeClient) {
      await this._connect()
    }
    const accessControlConditions = [
      {
        chain: this.chain,
        contractAddress: this.contractAddress,
        standardContractType: this.standardContractType,
        method: 'eth_getBalance',
        parameters: [':userAddress', 'latest'],
        returnValueTest: {
          comparator: '>=',
          value: '0',  // 0.000001 ETH
        },
      },
    ];
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: this.chain })

    const symmetricKey = await this._litNodeClient.getEncryptionKey({
      accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain: this.chain,
      authSig
    })

    const decryptedFile = await LitJsSdk.decryptFile({
      symmetricKey: symmetricKey,
      file: encryptedFile,
    });
    return { decryptedFile }
  }
}
import { Injectable } from "@angular/core";
import LitJsSdk from 'lit-js-sdk';
import { environment } from "../../environments/environment";
import { IAccessControlConditions } from "../interfaces/mediafile.interface";

@Injectable()
export class LitService {
  public readonly chain = environment.defaultChain;
  public readonly standardContractType = ''
  public readonly contractAddress = '';
  public defaultAccessControls: IAccessControlConditions[] = [
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

  private _litNodeClient: any;

  constructor() {
    console.log('[INFO] ALL_LIT_CHAINS: ', LitJsSdk.ALL_LIT_CHAINS);
    console.log('[INFO] LIT_AUTH_SIG_CHAIN_KEYS: ', LitJsSdk.LIT_AUTH_SIG_CHAIN_KEYS);
    
  }

  private async _connect() {
    const client: {connect: () => Promise<void>} = new LitJsSdk.LitNodeClient({debug: false});
    await client.connect();
    console.log('[INFO] LitNode connected');    
    this._litNodeClient = client;
  }

  public async connect(){
    await this._connect();
  }

  async encrypt(file: File | Blob, accessControlConditions: IAccessControlConditions[]): Promise<{
    encryptedFile: Blob;
    encryptedSymmetricKey: string;
  }> {
    if (!this._litNodeClient) {
      await this._connect()
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: this.chain })

    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({ file: file });
    console.log('>>>> encrypt rules: ', accessControlConditions);
    
    // [
    //   {
    //     chain: this.chain,
    //     contractAddress: this.contractAddress,
    //     standardContractType: this.standardContractType,
    //     method: 'eth_getBalance',
    //     parameters: [':userAddress', 'latest'],
    //     returnValueTest: {
    //       comparator: '>=',
    //       value: '0',  // 0.000001 ETH
    //     },
    //   },
    // ];

    const encryptedSymmetricKey = await this._litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain: this.chain,
      permanent: false,
    });
    return {
      encryptedFile,
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    }
  }

  async decrypt(encryptedFile: File|Blob, encryptedSymmetricKey: string, accessControlConditions: IAccessControlConditions[]): Promise<{decryptedArrayBuffer: ArrayBuffer}> {
    if (!this._litNodeClient) {
      await this._connect()
    }
    console.log('>>>> decrypt rules: ', accessControlConditions);
    
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: this.chain })
    console.log('[INFO] Message signed, try to get encryption key from LitNode');    
    const symmetricKey = await this._litNodeClient.getEncryptionKey({
      accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain: this.chain,
      authSig
    })
    console.log('[INFO] Encryption key retrieved, try to decrypt file');
    const decryptedArrayBuffer:ArrayBuffer = await LitJsSdk.decryptFile({
      symmetricKey: symmetricKey,
      file: encryptedFile,
    });
    return { decryptedArrayBuffer }
  }

  async disconnect() {
    if (!this._litNodeClient) {
      return;
    }
    await LitJsSdk.disconnectWeb3()
    console.log('[INFO] LitNode disconnected');    
  }
}
import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import LitJsSdk from 'lit-js-sdk';
import { environment } from '../../environments/environment';
import { IAccessControlConditions } from '../interfaces/mediafile.interface';

@Injectable()
export class LitService {
  private readonly _chain = environment.defaultChain;
  private _litNodeClient: any;
  private _authSig!: any;
  public readonly standardContractType = '';
  public readonly contractAddress = '';
  public defaultAccessControls: IAccessControlConditions[] = [
    {
      chain: this._chain,
      contractAddress: this.contractAddress,
      standardContractType: this.standardContractType,
      method: 'eth_getBalance',
      parameters: [':userAddress', 'latest'],
      returnValueTest: {
        comparator: '>=',
        value: '0', // 0.000001 ETH
      },
    },
  ];

  constructor(private readonly _loadingCtrl: LoadingController) {
    // console.log('[INFO] ALL_LIT_CHAINS: ', LitJsSdk.ALL_LIT_CHAINS);
  }

  private async _connect() {
    const client: { connect: () => Promise<void> } = new LitJsSdk.LitNodeClient(
      { debug: false }
    );
    await client.connect();
    console.log('[INFO] LitNode connected');
    this._litNodeClient = client;
  }

  public async connect() {
    await this._connect();
  }

  async encrypt(
    file: File | Blob,
    accessControlConditions: IAccessControlConditions[],
    chain = this._chain
  ): Promise<{
    encryptedFile: Blob;
    encryptedSymmetricKey: string;
  }> {
    if (!this._litNodeClient) {
      await this._connect();
    }
    if (!this._authSig) {
      this._authSig = await this._getAuthSig(chain);
    }
    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptFile({
      file: file,
    });

    const encryptedSymmetricKey = await this._litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig: this._authSig,
      chain,
      permanent: false,
    });
    return {
      encryptedFile,
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(
        encryptedSymmetricKey,
        'base16'
      ),
    };
  }

  async decrypt(
    encryptedFile: File | Blob,
    encryptedSymmetricKey: string,
    accessControlConditions: IAccessControlConditions[],
    chain = this._chain
  ): Promise<{ decryptedArrayBuffer: ArrayBuffer }> {
    if (!this._litNodeClient) {
      await this._connect();
    }
    console.log('>>>> decrypt rules: ', accessControlConditions);

    if (!this._authSig) {
      this._authSig = await this._getAuthSig(chain);
    }
    console.log(
      '[INFO] Message signed, try to get encryption key from LitNode'
    );
    const symmetricKey = await this._litNodeClient.getEncryptionKey({
      accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain,
      authSig: this._authSig,
    });
    console.log('[INFO] Encryption key retrieved, try to decrypt file');
    const decryptedArrayBuffer: ArrayBuffer = await LitJsSdk.decryptFile({
      symmetricKey: symmetricKey,
      file: encryptedFile,
    });
    return { decryptedArrayBuffer };
  }

  async disconnect() {
    if (!this._litNodeClient) {
      return;
    }
    await LitJsSdk.disconnectWeb3();
    console.log('[INFO] LitNode disconnected');
  }

  private async _getAuthSig(chain: string) {
    // display loader for a better UX
    const loading = await this._loadingCtrl.create({
      message: `
        Please connect your wallet to LitNode and sign message to continue.
      `,
      translucent: true,
      animated: false,
      spinner: null,
      cssClass: 'ion-text-center',
    });
    await loading.present();
    console.log('befor sign auth message');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const authSig = await LitJsSdk.checkAndSignAuthMessage({
      chain,
    });
    console.log('after sign auth message');
    loading.dismiss();
    return authSig;
  }
}

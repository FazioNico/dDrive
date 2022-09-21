import { Inject, Injectable } from '@angular/core';
import { create, IPFS } from 'ipfs-core';
import { IPFSPinningService } from '../interfaces/ipfs-pinning-service.interface';

@Injectable()
export class IPFSService {
  private _ipfsNode!: IPFS;

  constructor(
    @Inject('APP_IPFS_PINNING_SERVICE')
    private readonly _pinningService: IPFSPinningService
  ) {}

  async disconect() {
    if (this._ipfsNode) {
      await this._ipfsNode.stop();
    }
  }

  async add(file: File | Blob) {
    if (!this._ipfsNode) {
      this._ipfsNode = await create({
        config: {},
      });
    }
    const nodeIsOnline = this._ipfsNode.isOnline();
    if (!nodeIsOnline) {
      throw new Error('IPFS node is not online');
    }
    const { cid } = await this._ipfsNode.add(file, {
      timeout: 10000,
      preload: true,
      progress: (prog) => console.log(`received: ${prog}`),
    });
    await this.pin(cid.toString());
    return {
      cid: cid.toString(),
    };
  }

  async pin(cid: string) {
    await this._pinningService.pin(cid);
  }

  async unpin(cid: string) {
    await this._pinningService.unpin(cid);
  }

  async getFromCID(cid: string, type?: string): Promise<File> {
    if (!this._ipfsNode) {
      this._ipfsNode = await create();
    }
    const nodeIsOnline = this._ipfsNode.isOnline();
    if (!nodeIsOnline) {
      throw new Error('IPFS node is not online');
    }
    const asyncUint8Array = this._ipfsNode.cat(cid, {
      timeout: 10000,
      preload: true,
    });
    const blobsPart = [];
    for await (const chunk of asyncUint8Array) {
      blobsPart.push(chunk);
    }
    const file = new File(blobsPart, cid, { type });
    return file;
  }
}

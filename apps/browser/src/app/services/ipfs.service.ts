import { Injectable } from '@angular/core';
import { create, IPFS } from 'ipfs-core';

@Injectable()
export class IPFSService {
  private _ipfsNode!: IPFS;

  async add(file: File | Blob) {
    if (!this._ipfsNode) {
      this._ipfsNode = await create();
    }
    const nodeIsOnline = this._ipfsNode.isOnline();
    if (!nodeIsOnline) {
      throw new Error('IPFS node is not online');
    }
    const { cid } = await this._ipfsNode.add(file, {
      timeout: 10000,
      preload: true,
    });
    await this.pin(cid.toString());
    return {
      cid: cid.toString(),
    };
  }

  async pin(cid: string) {
    if (!this._ipfsNode) {
      this._ipfsNode = await create();
    }
    const nodeIsOnline = this._ipfsNode.isOnline();
    if (!nodeIsOnline) {
      throw new Error('IPFS node is not online');
    }
    await this._ipfsNode.pin.add(cid, {
      timeout: 10000,
    });
  }

  async unpin(cid: string) {
    if (!this._ipfsNode) {
      this._ipfsNode = await create();
    }
    const nodeIsOnline = this._ipfsNode.isOnline();
    if (!nodeIsOnline) {
      throw new Error('IPFS node is not online');
    }
    await this._ipfsNode.pin.rm(cid, {
      timeout: 10000,
    });
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

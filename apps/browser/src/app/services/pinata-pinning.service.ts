import { Inject, Injectable } from "@angular/core";
import { IPFSPinningService } from "../interfaces/ipfs-pinning-service.interface";

@Injectable()
export class PinataPinningService implements IPFSPinningService {

  constructor(
    @Inject('APP_PINNING_SERVICE_CONFIG') private _pinningServiceConfig: {
      pinning_endpoint: string;
      unpinning_endpoint: string;
      token: string;
    }
  ) {
  }

  async pin(cid: string) {
    const url = this._pinningServiceConfig.pinning_endpoint;
    const token = this._pinningServiceConfig.token;
    if (!url || !token) {
      throw new Error('IPFS pinning service is not configured');
    }
    const body = JSON.stringify({
      "hashToPin": cid
    });
    const config: RequestInit = {
      method: 'POST',
      body,
      headers: new Headers({ 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json'
      })
    };
    await fetch(url, config)
      .then(res => res.json())
      .catch(err => {
        throw err;
      });   
  }

  async unpin(cid: string) {
    const url = `${this._pinningServiceConfig.unpinning_endpoint}/${cid}`;
    const token = this._pinningServiceConfig.token;
    if (!url || !token) {
      throw new Error('IPFS pinning service is not configured');
    }
    const config: RequestInit = {
      method: 'DELETE',
      headers: new Headers({ 
        'Authorization': `Bearer ${token}`, 
      })
    };
    await fetch(url, config)
      .catch(err => {
        throw err;
      });
  }
}
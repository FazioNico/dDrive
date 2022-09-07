import { Injectable } from "@angular/core";
import { CeramicService } from "./ceramic.service";
import { DIDService } from "./did.service";
import { XMTPService } from "./xmtp.service";

@Injectable()
export class AuthService {

  constructor(
    private readonly _did: DIDService,
    private readonly _ceramic: CeramicService,
    private readonly _xmtp: XMTPService
  ) {}

  async connectServices() {
    // Authenticate with DID    
    const ethereum = (window as any)?.ethereum;
    const did = await this._did.init(ethereum);
    if (!did) {
      return false;
    }
    // Connect ceramic
    const {dDrive} = await this._ceramic.authWithDID(did)||{};
    if (!dDrive) {
      return false;
    }
    // Connect xmtp
    await this._xmtp.init(this._did.web3Provider);
    return true;
  }
}
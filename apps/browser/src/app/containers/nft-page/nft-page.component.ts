import { Component, OnInit } from '@angular/core';
import { DIDService } from '../../services/did.service';
import { NFTService } from '../../services/nft.services';

@Component({
  selector: 'd-drive-nft-page',
  templateUrl: './nft-page.component.html',
  styleUrls: ['./nft-page.component.scss'],
})
export class NFTPageComponent implements OnInit {
  public readonly nfts$ = this._nftService.nfts$;
  constructor(
    private readonly _nftService: NFTService,
    private readonly _did: DIDService
  ) {}

  async ngOnInit() {
    const account = await this._did.accountId$.value;
    await this._nftService.getWalletNFTsFromAllChain(account);
  }

  async actions(type: string, payload?: any) {
    console.log('actions(): ', type, payload);
  }
}

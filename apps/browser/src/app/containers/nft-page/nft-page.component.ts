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
    switch (true) {
      case type === 'openUri': {
        const {tokenUri = null} = payload;
        if (tokenUri) {
          window.open(tokenUri, '_blank');
        }
        break;
      }
      case type === 'searchByName': {
        const {detail: {value = null}} = payload;
        this._nftService.searchByName(value);
        break;
      }
    }
  }
}

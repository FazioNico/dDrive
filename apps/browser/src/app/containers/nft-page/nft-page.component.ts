import { Component, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, firstValueFrom, map, of } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { DIDService } from '../../services/did.service';
import { LoaderService } from '../../services/loader.service';
import { NFTService } from '../../services/nft.services';

@Component({
  selector: 'd-drive-nft-page',
  templateUrl: './nft-page.component.html',
  styleUrls: ['./nft-page.component.scss'],
})
export class NFTPageComponent implements OnInit {
  @ViewChild(HeaderComponent, {static: false}) public readonly header!: HeaderComponent;
  private readonly _chainNames = [
    'all', 
    ...this._nftService.chainNames
  ]
  .map((chain, i) => ({
    name: chain,
    selected: i === 0 ? true : false,
  }))
  .sort((a,b) => a.name.localeCompare(b.name));
  public readonly maxItemToDisplay$ = new BehaviorSubject(27);
  public readonly chainNames$ = new BehaviorSubject(this._chainNames)
  public readonly nfts$ = combineLatest([
    this._nftService.nfts$,
    this.chainNames$,
  ]).pipe(
    map(([nfts, chainNames]) => {
      
      // only show nfts from selected chains
      const selectedChainNames = chainNames.filter((chain) => chain.selected).map((chain) => chain.name?.toLowerCase());
      console.log('>>', selectedChainNames);
      if (selectedChainNames.length === 0 || selectedChainNames[0] === 'all') {
        return nfts;
      } else {
        return nfts.filter((nft) => selectedChainNames.includes(nft.chain.name?.toLowerCase()|| 'unknown'));
      }
    })
  );
  constructor(
    private readonly _nftService: NFTService,
    private readonly _did: DIDService,
    private readonly _loaderService: LoaderService,
  ) {}

  async ngOnInit() {
    this._loaderService.setStatus(true);
    const account = await this._did.accountId$.value;
    await this._nftService.getWalletNFTsFromAllChain(account);
    this._loaderService.setStatus(false);
  }

  async actions(type: string, payload?: any) {
    console.log('actions(): ', type, payload);
    switch (true) {
      case type === 'openUri': {
        const {tokenUri = null} = payload;
        if (!tokenUri) {
          return;
        }
        this.header.searchbarElement.nativeElement.value = '';
        window.open(tokenUri, '_blank');
        break;
      }
      case type === 'searchByName': {
        const {detail: {value = null}} = payload;
        this._nftService.searchByName(value);
        break;
      }
      case type === 'toogleChain': {
        this.header.searchbarElement.nativeElement.value = '';
        const chains = [...this._chainNames];          
        chains.forEach((chain) => {
          chain.selected = false;
        });
        if (payload === 0) {
          chains[0].selected = true;
        } else {
          chains[payload].selected = !chains[payload].selected;
        }
        this.chainNames$.next(chains);
        this.maxItemToDisplay$.next(27);
        break;
      }
      case type === 'displayMoreItem': {
        console.log('displayMoreItem');        
        const totalItem = await firstValueFrom(this.nfts$).then(items => items.length)
        const max = this.maxItemToDisplay$.value;
        const t = setTimeout(async () => {
          console.log('Done');
          payload.target.complete();
          this.maxItemToDisplay$.next(this.maxItemToDisplay$.value + 9);
          // App logic to determine if all data is loaded
          // and disable the infinite scroll
          if (max >= totalItem) {
            payload.target.disabled = true;
          }
          clearTimeout(t);
        }, 500);
        break;
      }
    }
  }

  trackByfn(index: number, item: { tokenHash: string|undefined }) {
    return item.tokenHash||index;
  }
}

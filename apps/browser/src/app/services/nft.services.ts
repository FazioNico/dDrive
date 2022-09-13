import { Injectable } from '@angular/core';
import Moralis from 'moralis';
import { EvmChain, EvmNft } from '@moralisweb3/evm-utils';
import { MoralisCore } from '@moralisweb3/core';
import { MoralisEvmApi } from '@moralisweb3/evm-api';
import { BehaviorSubject, combineLatest, filter, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class NFTService {
  private readonly _nfts$ = new BehaviorSubject([] as EvmNft[]);
  private readonly _queryFilterBy$: BehaviorSubject<string | null> =
  new BehaviorSubject(null as any);
  private _core!: MoralisCore;
  private _evmApi!: MoralisEvmApi;
  private readonly _chains = environment.production 
    ? [EvmChain.POLYGON, EvmChain.BSC, EvmChain.ETHEREUM, EvmChain.CRONOS]
    : [EvmChain.MUMBAI, EvmChain.BSC_TESTNET, EvmChain.RINKEBY, EvmChain.CRONOS_TESTNET]
  public readonly nfts$ = combineLatest([
    this._nfts$.pipe(filter(Boolean)),
    this._queryFilterBy$,
  ]).pipe(
    map(([nfts, queryFilterBy]) => {
      if (!queryFilterBy) {
        return nfts;
      }
      return nfts.filter((nft) => nft.name ? nft.name.toLowerCase().includes(queryFilterBy.toLowerCase()) : false);
    })
  );
  public get chainNames() {
    return this._chains.map(chain => chain.name);
  }

  async connect() {
    this._core = MoralisCore.create();
    this._evmApi = MoralisEvmApi.create(this._core);
    this._core.registerModules([this._evmApi]);
    await this._core.start({
      apiKey: environment.moralis.apiKey,
    });
    console.log('[INFO] connected');
  }

  async getWalletNFTs(address: string, chain: EvmChain = EvmChain.MUMBAI) {
    Moralis.start({
      apiKey: environment.moralis.apiKey
    });
    // const evmApi = this._core.getModule<MoralisEvmApi>(MoralisEvmApi.name);
    // const module = this._provider.getModule<MoralisEvmApi>(MoralisEvmApi.name);
    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain,
    });    
    return response.result;
    // .filter((nft) => nft.ownerOf?.checksum?.toString() === address.toString());
  }

  async getWalletNFTsFromAllChain(address: string) {
    // await this.connect();
    const chains = this._chains;
    const nfts = await Promise.all(
      chains.map(async (chain) => this.getWalletNFTs(address, chain))
    ).then((nfts) => nfts.flat());
    this._nfts$.next(nfts);
    console.log('[INFO] nfts', nfts);    
    return nfts;
  }

  searchByName(name: string) {
    this._queryFilterBy$.next(name);
  }
}

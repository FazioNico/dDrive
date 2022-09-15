import { Component, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { DIDService } from '../../services/did.service';

@Component({
  selector: 'd-drive-shared-page',
  templateUrl: './shared-page.component.html',
  styleUrls: ['./shared-page.component.scss'],
})
export class SharedPageComponent {
  @ViewChild(HeaderComponent, {static: false}) public readonly header!: HeaderComponent;
  public readonly maxItemToDisplay$ = new BehaviorSubject(25);
  public readonly medias$: Observable<any[]> = combineLatest([]);
  public account$ = this._didService.accountId$;

  constructor(
    private readonly _didService: DIDService
  ) {}

  actions(type: string, payload?: any) {
    console.log('actions(): ', type);        
    switch (true) {
      case type === 'open':
        break;
      case type === 'searchByName': {
        const {detail: {value = null}} = payload;
        console.log('searchByName(): ', value);        
        break;
      }
      case type === 'preview': {
        break;
      }
      case type === 'openOptions': {
        break;
      }
      case type === 'displayMoreItem': {
        break;
      }
    }
  }

  trackByfn(index: number) {
    return index;
  }
}

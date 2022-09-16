import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { ItemPreviewComponent } from '../../components/item-preview/item-preview.component';
import { ISharedMediaFile } from '../../interfaces/shared-mediafile.interface';
import { PreviewFilePipe } from '../../pipes/preview-file.pipe';
import { DIDService } from '../../services/did.service';
import { LoaderService } from '../../services/loader.service';
import { SharedMediaService } from '../../services/shared-media.service';

@Component({
  selector: 'd-drive-shared-page',
  templateUrl: './shared-page.component.html',
  styleUrls: ['./shared-page.component.scss'],
})
export class SharedPageComponent {
  @ViewChild(HeaderComponent, {static: false}) public readonly header!: HeaderComponent;
  public readonly maxItemToDisplay$ = new BehaviorSubject(25);
  public readonly medias$: Observable<ISharedMediaFile[]> = combineLatest([
    this._sharedMediaService.media$,
  ]).pipe(
    map(([medias]) => medias)
  );
  public account$ = this._didService.accountId$;

  constructor(
    private readonly _didService: DIDService,
    private readonly _sharedMediaService: SharedMediaService,
    private readonly _modalCtrl: ModalController,
    private readonly _loaderService: LoaderService,
  ) {
  }
  
  async ionViewWillEnter() {
    await this._sharedMediaService.getMedias();
  }

  async actions(type: string, payload?: any) {
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
        const { item } = payload;
        const ionModal = await this._modalCtrl.create({
          component: ItemPreviewComponent,
          componentProps: {
            item: item.metadata,
            account: this._didService.accountId$.value,
            senderAddress: item.senderAddress,
            createdISODateTime: item.createdISODateTime
          },
          cssClass: 'ion-modal-preview-file',
        });
        await ionModal.present();
        const { data, role = 'cancel' } = await ionModal.onDidDismiss();
        this.actions(role, { item: data });
        break;
      }
      case type === 'download': {
        const { item } = payload;
        if (!item?._id) {
          throw new Error('download(): payload is invalid');
        }
        this._loaderService.setStatus(true);
        await this._sharedMediaService.downloadFile(item);
        this._loaderService.setStatus(false);
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

import { Component, OnInit } from '@angular/core';
import { AlertController, PopoverController, ToastController } from '@ionic/angular';
import { BehaviorSubject, of } from 'rxjs';
import { FilesOptionsListComponent } from '../../components/files-options-list/files-options-list.component';

@Component({
  selector: 'd-drive-drive-page',
  templateUrl: './drive-page.component.html',
  styleUrls: ['./drive-page.component.scss'],
})
export class DrivePageComponent  {

  public breadcrumbs$ = of();
  public items$ = new BehaviorSubject([
    {_id: 'xxx', isFolder: false, name: 'xxx.txt', size: 9000},
    {_id: 'demo', isFolder: false, name: 'demo.txt', size: 1000},
  ]).asObservable();
  public currentPath$ = new BehaviorSubject('root').asObservable();
  public options = {
    maxBreadcrumbs: 3,
  }

  constructor(
    private readonly _popCtrl: PopoverController,
    private readonly _toastCtrl: ToastController,
    private readonly _alertCtrl: AlertController,
  ) {}

  async actions(type: string, payload?: any) {
    console.log('actions(): ', type);
    switch (true) {
      case type === 'onFileChange':
        break;
      case type === 'navToFolderName':
        break;
      case type === 'reload':
        break;
      case type === 'newFolder':   
        break;
      case type === 'openOptions': {
        const {event = undefined, item = undefined} = payload;
        if (!event || !item) {
          throw new Error('openOptions(): payload is invalid');
        }
        await this.openOptions(event, item);
      }
    }
  }

  async openOptions($event: MouseEvent, item: any) {
    const ionPopover = await this._popCtrl.create({
      component: FilesOptionsListComponent,
      componentProps: {isFolder: item.isFolder},
      event: $event,
      translucent: true
    });
    await ionPopover.present();
    // handle close event
    const { data: type, role } = await ionPopover.onDidDismiss();
    if (role === 'close') {
      return;
    }
    await this.actions(type, item);
  }

  trackByfn(index: number, item: {_id: string}) {
    return item._id;
  }
}

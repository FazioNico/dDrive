import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  AlertController,
  IonSearchbar,
  PopoverController,
  ToastController,
  ToastOptions,
} from '@ionic/angular';
import { OverlayBaseController } from '@ionic/angular/util/overlay';
import { BehaviorSubject, map, tap } from 'rxjs';
import { FilesOptionsListComponent } from '../../components/files-options-list/files-options-list.component';
import { LoaderService } from '../../services/loader.service';
import { MediaFileService } from '../../services/mediafile.service';

@Component({
  selector: 'd-drive-files-page',
  templateUrl: './files-page.component.html',
  styleUrls: ['./files-page.component.scss'],
})
export class FilesPageComponent {
  @ViewChild(IonSearchbar, {static: true, read: ElementRef}) public readonly searchbarElement!: ElementRef<IonSearchbar>;
  public breadcrumbs$ = this._mediaFileService.breadcrumbs$.pipe(
    map((breadcrumbs) => {
      const maxBreadcrumbs = this.options.maxBreadcrumbs;
      if (breadcrumbs.length > maxBreadcrumbs) {
        breadcrumbs.splice(0, breadcrumbs.length - maxBreadcrumbs);
      }
      return breadcrumbs;
    })
  );
  public items$ = this._mediaFileService.items$;
  public options = {
    maxBreadcrumbs: 3,
  };

  constructor(
    private readonly _popCtrl: PopoverController,
    private readonly _toastCtrl: ToastController,
    private readonly _alertCtrl: AlertController,
    private readonly _loaderService: LoaderService,
    private readonly _mediaFileService: MediaFileService
  ) {}

  async ionViewDidEnter() {
    this._loaderService.setStatus(true);
    await this._mediaFileService.getFiles();
    this._loaderService.setStatus(false);
  }

  async actions(type: string, payload?: any) {
    console.log('actions(): ', type, payload);
    switch (true) {
      case type === 'onFileChange': {
        this.searchbarElement.nativeElement.value = '';
        const files = [...payload.target.files];
        if (!files[0]) {
          return;
        }
        // ask for encryption
        const { role } = await this._displayMessage(this._alertCtrl,{
          header: 'Encryption',
          message: `Do you want to encrypt file${files.length > 1 ? 's' : ''}?`,
          buttons: [
            { text: 'No', role: 'cancel'},
            { text: 'Yes', role: 'encrypt' },
          ],
        })
        const encrypt = role === 'encrypt';
        this._loaderService.setStatus(true);
        let i = 0
        while (i !== files.length) {
          await this._mediaFileService.upload(files[i], encrypt);
          ++i;
        }
        this._loaderService.setStatus(false);
        // notify user that file was uploaded successfully
        const opts: ToastOptions = {
          message: `File${files.length > 1 ? 's' : ''} uploaded successfully`,
          duration: 2000,
          position: 'bottom',
          color: 'primary',
          buttons: [
            {
              text: 'ok',
              side: 'end',
              handler: async () => await this._toastCtrl.dismiss(),
            },
          ],
          keyboardClose: true,
        };
        await this._displayMessage(this._toastCtrl, opts);
        break;
      }
      case type === 'searchByName': {
        const {detail: {value = null}} = payload;
        this._mediaFileService.searchByName(value);
        break;
      }
      case type === 'navTo': {
        const { _id } = payload;
        this._mediaFileService.navToFolderId(_id);
        this.searchbarElement.nativeElement.value = '';
        break;
      }
      case type === 'reload':
        this.searchbarElement.nativeElement.value = '';
        await this.ionViewDidEnter();
        break;
      case type === 'newFolder': {
        this.searchbarElement.nativeElement.value = '';
        // ask for folder name
        const opts = {
          header: 'New Folder',
          inputs: [
            {
              name: 'folderName',
              type: 'text',
              placeholder: 'Folder Name',
            },
          ],
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Create',
              role: 'ok',
            },
          ],
        };
        const { data, role } = await this._displayMessage(
          this._alertCtrl,
          opts
        );
        if (role !== 'ok' || !data.values.folderName) {
          return;
        }
        this._loaderService.setStatus(true);
        await this._mediaFileService.createFolder(data.values.folderName);
        this._loaderService.setStatus(false);
        // notify user that folder was successfully created
        const notifOpts: ToastOptions = {
          message: 'Folder successfully created',
          duration: 2000,
          position: 'bottom',
          color: 'primary',
          buttons: [
            {
              text: 'ok',
              side: 'end',
              handler: async () => await this._toastCtrl.dismiss(),
            },
          ],
          keyboardClose: true,
        };
        await this._displayMessage(this._toastCtrl, notifOpts);
        break;
      }
      case type === 'openOptions': {
        const { event = undefined, item = undefined } = payload;
        if (!event || !item) {
          throw new Error('openOptions(): payload is invalid');
        }
        await this.openOptions(event, item);
        break;
      }
      case type === 'preview': {
        console.log('preview(): ', payload);

        const { cid = undefined } = payload;
        break;
      }
      case type === 'delete': {
        const { _id = null, isFolder = false } = payload;
        if (!_id) {
          throw new Error('delete(): payload is invalid');
        }
        // prompt to confirm delete if is a folder
        if (isFolder) {
          const opts = {
            header: 'Delete Folder',
            message: `
              <p>Are you sure you want to delete this folder? All files and subfolders will be deleted.</p>
            `,
            buttons: [
              {
                text: 'Cancel',
                role: 'cancel',
              },
              {
                text: 'Delete',
                role: 'confirm',
              },
            ],
          };
          const { role } = await this._displayMessage(this._alertCtrl, opts);
          if (role !== 'confirm') {
            return;
          }
        }
        this._loaderService.setStatus(true);
        await this._mediaFileService.delete(_id);
        this._loaderService.setStatus(false);
        // notify user that file was uploaded successfully
        const opts: ToastOptions = {
          message: `${isFolder ? 'Folder' : 'File'} deleted successfully`,
          duration: 2000,
          position: 'bottom',
          color: 'primary',
          buttons: [
            {
              text: 'ok',
              side: 'end',
              handler: async () => await this._toastCtrl.dismiss(),
            },
          ],
          keyboardClose: true,
        };
        await this._displayMessage(this._toastCtrl, opts);
        break;
      }
      case type === 'download': {
        const { _id = null, isFolder = false } = payload;
        if (!_id || isFolder) {
          throw new Error('download(): payload is invalid');
        }
        this._loaderService.setStatus(true);
        await this._mediaFileService.downloadFile(_id);
        this._loaderService.setStatus(false);
        break;
      }
    }
  }

  async openOptions($event: MouseEvent, item: any) {
    const ionPopover = await this._popCtrl.create({
      component: FilesOptionsListComponent,
      componentProps: { isFolder: item.isFolder },
      event: $event,
      translucent: true,
    });
    await ionPopover.present();
    // handle close event
    const { data: type, role } = await ionPopover.onDidDismiss();
    if (role === 'close') {
      return;
    }
    await this.actions(type, item);
  }

  trackByfn(index: number, item: { _id: string }) {
    return item._id;
  }

  private async _displayMessage(
    ctrl: OverlayBaseController<any, any>,
    opts: any
  ) {
    const ctrlInstance = await ctrl.create(opts);
    await ctrlInstance.present();
    const { data, role } = await ctrlInstance.onDidDismiss();
    return { data, role };
  }
}

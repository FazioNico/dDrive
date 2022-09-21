import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IMediaFile } from '../../interfaces/mediafile.interface';

@Component({
  selector: 'd-drive-item-preview',
  templateUrl: './item-preview.component.html',
  styleUrls: ['./item-preview.component.scss'],
})
export class ItemPreviewComponent {
  @Input() item!: IMediaFile;
  @Input() account!: string;

  constructor(
    public readonly modalCtrl: ModalController
  ) {}
}

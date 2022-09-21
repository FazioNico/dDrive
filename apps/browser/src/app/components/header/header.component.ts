import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { IonSearchbar } from '@ionic/angular';

@Component({
  selector: 'd-drive-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Output() public readonly actions:EventEmitter<{type: string; payload?: any}> = new EventEmitter();
  @ViewChild(IonSearchbar, {static: false, read: ElementRef}) public readonly searchbarElement!: ElementRef<IonSearchbar>;


}

import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'd-drive-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Output() public readonly actions:EventEmitter<{type: string; payload?: any}> = new EventEmitter();


}

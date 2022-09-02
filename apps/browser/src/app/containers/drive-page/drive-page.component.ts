import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'd-drive-drive-page',
  templateUrl: './drive-page.component.html',
  styleUrls: ['./drive-page.component.scss'],
})
export class DrivePageComponent {
  isProduction: boolean = environment.production;
 
}

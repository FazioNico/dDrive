import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { LoaderService } from './services/loader.service';

@Component({
  selector: 'd-drive-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'browser';
  isProduction: boolean = environment.production;

  constructor(
    public loaderService: LoaderService
  ) {}
}

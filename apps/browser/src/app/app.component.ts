import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { LoaderService } from './services/loader.service';

@Component({
  selector: 'd-drive-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'browser';
  isProduction: boolean = environment.production;

  constructor(
    public loaderService: LoaderService
  ) {}
  ngOnInit() {
    console.log('Hello from Angular!');
  }
}

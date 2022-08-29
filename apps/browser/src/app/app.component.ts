import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'd-drive-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'browser';

  ngOnInit() {
    console.log('Hello from Angular!');    
  }
}

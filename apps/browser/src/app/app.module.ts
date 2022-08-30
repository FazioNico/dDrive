import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';

import { AppComponent } from './app.component';
import { IPFSService } from './services/ipfs.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot()
  ],
  providers: [
    IPFSService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

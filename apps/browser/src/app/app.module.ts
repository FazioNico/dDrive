import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';

import { AppComponent } from './app.component';
import { IPFSService } from './services/ipfs.service';
import { DrivePageComponent } from './containers/drive-page/drive-page.component';
import { NotfoundPageComponent } from './containers/notfound-page/notfound-page.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AppComponent, DrivePageComponent, NotfoundPageComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    RouterModule.forRoot([
      { path: 'drive', component: DrivePageComponent },
      { path: '404', component: NotfoundPageComponent },
      { path: '', redirectTo: '/drive', pathMatch: 'full' },
      { path: '**', redirectTo: '/404', pathMatch: 'full' },
    ]),
  ],
  providers: [IPFSService],
  bootstrap: [AppComponent],
})
export class AppModule {}

import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { FilesOptionsListComponent } from './components/files-options-list/files-options-list.component';
import { DrivePageComponent } from './containers/drive-page/drive-page.component';
import { NotfoundPageComponent } from './containers/notfound-page/notfound-page.component';
import { TablelandService } from './services/tableland.service';
import { IPFSService } from './services/ipfs.service';
import { CeramicService } from './services/ceramic.service';
import { MediaFileService } from './services/mediafile.service';
import { LoaderService } from './services/loader.service';
import { GlobalErrorHandlerService } from './services/global-error-handler.service';
import { LitService } from './services/lit.service';
import { BytesToSizePipe } from './pipes/bytes-to-size.pipe';

@NgModule({
  declarations: [
    AppComponent, 
    DrivePageComponent, 
    NotfoundPageComponent,
    FilesOptionsListComponent,
    BytesToSizePipe
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: "ios"
    }),
    RouterModule.forRoot([
      { path: 'drive', component: DrivePageComponent },
      { path: '404', component: NotfoundPageComponent },
      { path: '', redirectTo: '/drive', pathMatch: 'full' },
      { path: '**', redirectTo: '/404', pathMatch: 'full' },
    ]),
  ],
  providers: [
    IPFSService,
    TablelandService,
    CeramicService,
    MediaFileService,
    LoaderService,
    LitService,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandlerService,
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

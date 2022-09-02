import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AlertController, IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';

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
import { SetupPageComponent } from './containers/setup-page/setup-page.component';
import { LoginPageComponent } from './containers/login-page/login-page.component';
import { AuthGuard } from './guards/auth.guard';
import { DIDService } from './services/did.service';
import { FilesPageComponent } from './containers/files-page/files-page.component';

const getProviderFactory =
  (_alertCtrl: AlertController, _router: Router) => async () => {
    console.log('APP_INITIALIZER', _alertCtrl, _router);
    if (!(window as any).ethereum) {
      const ionAlert = await _alertCtrl.create({
        header: 'No Ethereum Provider',
        message:
          'Please install MetaMask or similar Ethereum browser extension.',
        buttons: [{ text: 'ok' }],
      });
      await ionAlert.present();
      await ionAlert.onDidDismiss();
      _router.navigate(['/setup']);
    }
  };

@NgModule({
  declarations: [
    AppComponent,
    DrivePageComponent,
    NotfoundPageComponent,
    FilesOptionsListComponent,
    BytesToSizePipe,
    SetupPageComponent,
    LoginPageComponent,
    FilesPageComponent,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'ios',
    }),
    RouterModule.forRoot([
      {
        path: 'drive',
        component: DrivePageComponent,
        canActivate: [AuthGuard],
        children: [
          { path: 'files', component: FilesPageComponent },
          { path: '', redirectTo: 'files', pathMatch: 'full' },
        ]
      },
      {
        path: 'login',
        component: LoginPageComponent,
      },
      { path: '404', component: NotfoundPageComponent },
      { path: 'setup', component: SetupPageComponent },
      { path: '', redirectTo: '/login', pathMatch: 'full' },
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
    AuthGuard,
    DIDService,
    AuthGuard,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandlerService,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: getProviderFactory,
      multi: true,
      deps: [AlertController, Router],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

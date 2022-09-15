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
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AddressToAvatarPipe } from './pipes/address-to-avatar.pipe';
import { SliceAddressPipe } from './pipes/slice-address.pipe';
import { SetupEncryptionComponent } from './components/setup-encryption/setup-encryption.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NetwokNamePipe } from './pipes/network-name.pipe';
import { SelectFolderComponent } from './components/select-folder/select-folder.component';
import { TotalStoragePipe } from './pipes/total-storage.pipe';
import { ItemPreviewComponent } from './components/item-preview/item-preview.component';
import { PreviewFilePipe } from './pipes/preview-file.pipe';
import { SafePipe } from './pipes/safe.pipe';
import MetaMaskOnboarding from '@metamask/onboarding';
import { AuthService } from './services/auth.service';
import { XMTPService } from './services/xmtp.service';
import { UserProfilService } from './services/user-profil.service';
import { NotificationService } from './services/notification.service';
import { AlertService } from './services/alert.service';
import { HeaderComponent } from './components/header/header.component';
import { NFTPageComponent } from './containers/nft-page/nft-page.component';
import { NFTService } from './services/nft.services';
import { NgxEnvModule } from '@ngx-env/core';
import { IsSharePipe } from './pipes/is-shared.pipe';
import { DropableDirective } from './directives/dropable.directive';
import { SharedPageComponent } from './containers/shared-page/shared-page.component';

const getProviderFactory =
  (_alertCtrl: AlertController, _router: Router) => async () => {
    const onboarding = new MetaMaskOnboarding();
    if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
      const ionAlert = await _alertCtrl.create({
        header: 'No Ethereum Provider',
        message:
          'Please install MetaMask or similar Ethereum browser extension.',
        buttons: [{ text: 'ok' }],
      });
      await ionAlert.present();
      await ionAlert.onDidDismiss();
      onboarding.startOnboarding();
    } else {
      onboarding.stopOnboarding();
    }
    console.log('[INFO] dDrive version: ');
    // manage console.log(); in production
    if (environment.production) {
      console.log = function (arg) {
        // do nothing
      };
    }
  };

@NgModule({
  declarations: [
    AppComponent,
    DrivePageComponent,
    NotfoundPageComponent,
    FilesOptionsListComponent,
    SetupPageComponent,
    LoginPageComponent,
    FilesPageComponent,
    SetupEncryptionComponent,
    SelectFolderComponent,
    SharedPageComponent,
    ItemPreviewComponent,
    BytesToSizePipe,
    AddressToAvatarPipe,
    SliceAddressPipe,
    NetwokNamePipe,
    TotalStoragePipe,
    PreviewFilePipe,
    SafePipe,
    IsSharePipe,
    NFTPageComponent,
    HeaderComponent,
    DropableDirective,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    NgxEnvModule,
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
          { path: 'nfts', component: NFTPageComponent },
          { path: 'shared', component: SharedPageComponent },
          { path: '', redirectTo: 'files', pathMatch: 'full' },
        ],
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
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
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
    AuthService,
    XMTPService,
    UserProfilService,
    NotificationService,
    AlertService,
    NFTService,
    // {
    //   provide: ErrorHandler,
    //   useClass: GlobalErrorHandlerService,
    // },
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

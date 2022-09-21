import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DIDService } from '../../services/did.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'd-drive-drive-page',
  templateUrl: './drive-page.component.html',
  styleUrls: ['./drive-page.component.scss'],
})
export class DrivePageComponent implements OnInit, OnDestroy {
  public darkMode!: boolean;
  public readonly isProduction: boolean = environment.production;
  public readonly accountId$ = this._didService.accountId$.asObservable();
  public readonly chainId$ = this._didService.chainId$.asObservable();
  public readonly isConnected$ = this._notificationService.isConnected$; 
  private readonly _subs: Subscription[] = [];
  constructor(
    private readonly _didService: DIDService,
    private readonly _notificationService: NotificationService,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {}

  ngOnInit(): void {
    this.darkMode = this._document.body.classList.contains('dark');
    const sub = this._notificationService.notifications$.subscribe(
      async (messages) => {
        if (messages.length === 1) {
          await this._notificationService.displayNotification(messages[0]);
        } else if (messages.length > 1) {
          const content = `You have ${messages.length} new notifications`;
          await this._notificationService.displayNotification(content);
        }
      }
    );
    this._subs.push(sub);
  }

  ngOnDestroy(): void {
    this._subs.forEach((sub) => sub.unsubscribe());
  }

  async toggleDarkMode() {
    this._document.defaultView?.localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false');
    this._document.body.classList.toggle('dark');
  }
}

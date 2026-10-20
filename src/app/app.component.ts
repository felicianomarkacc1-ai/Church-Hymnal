import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { HymnStorageService } from './services/hymn-storage.service';
import { AppColorTheme } from './models/hymn.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, RouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
      <router-outlet></router-outlet>
    </ion-app>
  `,
  styles: [],
})
export class AppComponent implements OnInit, OnDestroy {
  private settingsSub: Subscription | null = null;

  constructor(private hymnStorage: HymnStorageService) {}

  async ngOnInit() {
    await this.hymnStorage.initialize();
    this.settingsSub = this.hymnStorage.settings$.subscribe((settings) => {
      this.applyTheme(settings.theme);
      this.applyColorTheme(settings.colorTheme || 'original');
    });

    // Dev helper: call `clearUserHymns()` from browser console to remove
    // all user-added hymns (keeps built-ins). Prompts for confirmation.
    (window as any).clearUserHymns = async () => {
      // eslint-disable-next-line no-alert
      if (confirm('Clear ALL user hymns from storage? This cannot be undone.')) {
        await this.hymnStorage.clearUserHymns();
        // eslint-disable-next-line no-alert
        alert('User hymns cleared. Reloading.');
        window.location.reload();
      }
    };
  }

  ngOnDestroy() {
    this.settingsSub?.unsubscribe();
  }

  private applyTheme(theme: 'dark' | 'light') {
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme === 'light');
  }

  private applyColorTheme(colorTheme: AppColorTheme) {
    document.body.dataset['colorTheme'] = colorTheme;
  }
}

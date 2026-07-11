import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { HymnStorageService } from './services/hymn-storage.service';

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
    });
  }

  ngOnDestroy() {
    this.settingsSub?.unsubscribe();
  }

  private applyTheme(theme: 'dark' | 'light') {
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme === 'light');
  }
}

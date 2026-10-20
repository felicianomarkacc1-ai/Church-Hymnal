import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonToggle,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSelect,
  IonSelectOption,
  IonRange,
} from '@ionic/angular/standalone';
import { HymnStorageService } from '../../services/hymn-storage.service';
import { AppColorTheme, AppSettings } from '../../models/hymn.model';

const FONT_SIZE_CLASS_MAP: { [key: number]: string } = {
  1: 'font-xs',
  2: 'font-sm',
  3: 'font-md',
  4: 'font-lg',
  5: 'font-xl',
};

const FONT_SIZE_LABEL_MAP: { [key: number]: string } = {
  1: 'Small',
  2: 'Medium',
  3: 'Large',
  4: 'Extra large',
  5: 'Maximum',
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonToggle,
    IonButton,
    IonButtons,
    IonBackButton,
    IonSelect,
    IonSelectOption,
    IonRange,
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  settings: AppSettings = {
    id: 'app-settings',
    theme: 'dark',
    colorTheme: 'original',
    fontSize: 3,
    keepScreenAwake: false,
  };

  constructor(
    private hymnStorage: HymnStorageService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.hymnStorage.initialize();

    this.hymnStorage.settings$.subscribe((settings) => {
      this.settings = settings;
    });
  }

  async updateTheme(theme: 'dark' | 'light') {
    await this.hymnStorage.updateSettings({ theme });
  }

  async updateColorTheme(colorTheme: AppColorTheme) {
    await this.hymnStorage.updateSettings({ colorTheme });
  }

  async updateFontSize(fontSize: number) {
    await this.hymnStorage.updateSettings({ fontSize });
  }

  async updateKeepScreenAwake(keepAwake: boolean) {
    await this.hymnStorage.updateSettings({ keepScreenAwake: keepAwake });
  }

  /**
   * CSS class for the live specimen preview, mirrors the mapping used on
   * the presentation page so the preview matches what presenting looks like.
   */
  getFontSizeClass(): string {
    return FONT_SIZE_CLASS_MAP[this.settings.fontSize] || 'font-md';
  }

  /**
   * Human-readable label for the current default text size.
   */
  getFontSizeLabel(): string {
    return FONT_SIZE_LABEL_MAP[this.settings.fontSize] || 'Large';
  }

  goBack() {
    this.router.navigate(['/library']);
  }
}
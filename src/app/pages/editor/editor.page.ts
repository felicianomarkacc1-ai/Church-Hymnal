import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonTextarea,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBack, checkmark } from 'ionicons/icons';
import { HymnStorageService } from '../../services/hymn-storage.service';
import { Hymn } from '../../models/hymn.model';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonTextarea,
    IonButton,
    IonButtons,
    IonBackButton,
    IonIcon,
  ],
  templateUrl: './editor.page.html',
  styleUrls: ['./editor.page.scss'],
})
export class EditorPage implements OnInit {
  hymnNumber = '';
  hymnTitle = '';
  hymnLyrics = '';
  hymnLanguage: 'english' | 'tagalog' = 'english';
  editingId: number | null = null;
  isNew = true;
  isBuiltIn = false;

  constructor(
    private hymnStorage: HymnStorageService,
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ chevronBack, checkmark });
  }

  async ngOnInit() {
    await this.hymnStorage.initialize();

    this.route.params.subscribe(async (params) => {
      if (params['id']) {
        this.editingId = +params['id'];
        this.isNew = false;
        const hymn = await this.hymnStorage.getHymnById(this.editingId);
        if (hymn) {
          this.isBuiltIn = Boolean(hymn.isBuiltIn);
          this.hymnNumber = hymn.number.toString();
          this.hymnTitle = hymn.title;
          this.hymnLyrics = this.reconstructLyrics(hymn);
          this.hymnLanguage = hymn.language ?? 'english';
        }
      }
    });
  }

  /**
   * Number of sections detected in the lyrics box, based on [Tag] markers.
   * Untagged but non-empty lyrics count as a single implicit section.
   * Drives the live "N sections" badge above the textarea.
   */
  get sectionCount(): number {
    if (!this.hymnLyrics?.trim()) {
      return 0;
    }
    const matches = this.hymnLyrics.match(/\[[^\]]+\]/g);
    return matches ? matches.length : 1;
  }

  /**
   * Reconstruct lyrics from sections
   */
  private reconstructLyrics(hymn: Hymn): string {
    return hymn.sections
      .map((section) => {
        const label = section.label ? `[${section.label}]\n` : '';
        return label + section.text;
      })
      .join('\n\n');
  }

  async saveHymn() {
    if (!this.hymnNumber || !this.hymnTitle || !this.hymnLyrics) {
      await this.showSaveConfirmation('Please fill in all fields');
      return;
    }

    try {
      const number = parseInt(this.hymnNumber, 10);

      if (this.isNew) {
        await this.hymnStorage.addHymn(
          number,
          this.hymnTitle,
          this.hymnLyrics,
          this.hymnLanguage
        );
        await this.showSaveConfirmation('Hymn saved on this device');
      } else {
        await this.hymnStorage.updateHymn(
          this.editingId!,
          number,
          this.hymnTitle,
          this.hymnLyrics,
          this.hymnLanguage
        );
        await this.showSaveConfirmation(
          this.isBuiltIn
            ? 'Saved on this device only'
            : 'Hymn changes saved'
        );
      }

      this.router.navigate(['/library']);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error saving hymn';
      console.error(error);
      await this.showSaveConfirmation(message);
    }
  }

  cancel() {
    this.router.navigate(['/library']);
  }

  hasLocalChanges(): boolean {
    return this.editingId !== null &&
      this.hymnStorage.isBuiltInCustomized(this.editingId);
  }

  async restoreOriginal() {
    if (this.editingId === null || !this.hasLocalChanges()) {
      return;
    }

    const confirmation = await this.alertController.create({
      header: 'Restore original hymn?',
      message: 'This will discard the edits saved on this device.',
      buttons: [
        { text: 'Keep edits', role: 'cancel' },
        { text: 'Restore', role: 'restore' },
      ],
      cssClass: 'hymn-action-alert',
      animated: true,
    });
    await confirmation.present();
    const { role } = await confirmation.onDidDismiss();
    if (role !== 'restore') {
      return;
    }

    try {
      await this.hymnStorage.restoreBuiltInHymn(this.editingId);
      await this.showSaveConfirmation('Original hymn restored');
      this.router.navigate(['/library']);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not restore the hymn';
      console.error(error);
      await this.showSaveConfirmation(message);
    }
  }

  private async showSaveConfirmation(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'top',
      cssClass: 'hymn-save-toast',
      animated: true,
    });
    await toast.present();
  }
}
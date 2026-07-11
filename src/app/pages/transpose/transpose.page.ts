import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { addIcons } from 'ionicons';
import { checkmark, arrowBack } from 'ionicons/icons';
import { HymnStorageService } from '../../services/hymn-storage.service';
import { SavedTranspose } from '../../models/hymn.model';

@Component({
  selector: 'app-transpose',
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
  templateUrl: './transpose.page.html',
  styleUrls: ['./transpose.page.scss'],
})
export class TransposePage implements OnInit {
  transposeTitle = '';
  transposeInput = '';
  transposeSteps = 0;
  savedTransposes: SavedTranspose[] = [];

  constructor(
    private hymnStorage: HymnStorageService,
    private router: Router
  ) {
    addIcons({ checkmark, arrowBack });
  }

  async ngOnInit() {
    await this.hymnStorage.initialize();
    this.hymnStorage.savedTransposes$.subscribe((savedTransposes) => {
      this.savedTransposes = savedTransposes;
    });
  }

  get transposeOutput(): string {
    return this.transposeChords(this.transposeInput, this.transposeSteps);
  }

  get transposeLabel(): string {
    if (this.transposeSteps === 0) {
      return 'Original';
    }
    return this.transposeSteps > 0
      ? `+${this.transposeSteps}`
      : `${this.transposeSteps}`;
  }

  increaseTranspose() {
    if (this.transposeSteps < 11) {
      this.transposeSteps++;
    }
  }

  decreaseTranspose() {
    if (this.transposeSteps > -11) {
      this.transposeSteps--;
    }
  }

  resetTranspose() {
    this.transposeSteps = 0;
  }

  saveTranspose() {
    if (!this.transposeTitle.trim()) {
      alert('Please provide a title for the transpose entry.');
      return;
    }

    const output = this.transposeOutput;
    this.hymnStorage.addSavedTranspose(
      this.transposeTitle.trim(),
      this.transposeInput,
      this.transposeSteps,
      output
    );

    this.transposeTitle = '';
    this.transposeInput = '';
    this.transposeSteps = 0;
  }

  loadSavedTranspose(entry: SavedTranspose) {
    this.transposeTitle = entry.title;
    this.transposeInput = entry.input;
    this.transposeSteps = entry.steps;
  }

  deleteSavedTranspose(id: number) {
    this.hymnStorage.deleteSavedTranspose(id);
  }

  goBack() {
    this.router.navigate(['/library']);
  }

  private transposeChords(text: string, steps: number): string {
    if (!text) {
      return '';
    }

    const chordRegex = /^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?)(.*))?$/;
    const order = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ];
    const normalize = (note: string) => {
      const map: Record<string, string> = {
        A: 'A',
        'A#': 'A#',
        Bb: 'A#',
        B: 'B',
        C: 'C',
        'C#': 'C#',
        Db: 'C#',
        D: 'D',
        'D#': 'D#',
        Eb: 'D#',
        E: 'E',
        F: 'F',
        'F#': 'F#',
        Gb: 'F#',
        G: 'G',
        'G#': 'G#',
        Ab: 'G#',
      };
      return map[note] || note;
    };

    const transposeNote = (note: string): string => {
      const normalized = normalize(note);
      const index = order.indexOf(normalized);
      if (index === -1) {
        return note;
      }
      const next = (index + steps + 12) % 12;
      return order[next];
    };

    return text
      .split(/(\s+)/)
      .map((token) => {
        const prefixMatch = token.match(/^[\(\[\{]+/);
        const suffixMatch = token.match(/[\)\]\}\.,;!]+$/);
        const prefix = prefixMatch ? prefixMatch[0] : '';
        const suffix = suffixMatch ? suffixMatch[0] : '';
        const core = token.slice(prefix.length, token.length - suffix.length);

        const match = core.match(chordRegex);
        if (!match) {
          return token;
        }

        const root = match[1] + (match[2] || '');
        const quality = match[3] || '';
        const bassRoot = match[4] ? match[4] + (match[5] || '') : '';
        const transposedRoot = transposeNote(root);
        const transposedBass = bassRoot ? '/' + transposeNote(bassRoot) : '';
        return `${prefix}${transposedRoot}${quality}${transposedBass}${suffix}`;
      })
      .join('');
  }
}

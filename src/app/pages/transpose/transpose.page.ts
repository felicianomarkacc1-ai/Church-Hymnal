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

  // ---- chord-quality whitelist (used to decide if a token is *really* a chord) ----
  private static readonly QUALITY_REGEX =
    /^(?:maj7|maj9|maj13|maj|min7|min9|min|m7b5|m7#5|mmaj7|m6|m7|m9|m11|m13|m|sus2|sus4|sus|dim7|dim|aug|add2|add4|add9|add11|add13|[0-9]{1,2}|[#b][0-9]{1,2}|\+|-)*$/;

  // Tokens that are allowed on a "chord line" without being chords themselves
  // (bar lines, repeat markers, section punctuation etc.)
  private static readonly NON_CHORD_ALLOWED = /^(?:[\|\-–—%\.]+|x\d+|\(.*\)|N\.?C\.?)$/i;

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

  // ---------------------------------------------------------------
  // Transposition — now line-aware.
  //
  // A line is only transposed if EVERY meaningful token on it is a
  // valid chord (root note A-G plus a whitelisted quality suffix
  // like m, maj7, sus4, dim, add9, etc). Lyric lines almost always
  // contain at least one word that fails that check (e.g. "Amazing",
  // "grace", "how"), so the whole line is left completely untouched
  // — even if a single word on it happens to also be a valid chord
  // spelling, like the letter "D" or "Am" appearing in a sentence.
  // ---------------------------------------------------------------
  private transposeChords(text: string, steps: number): string {
    if (!text) {
      return '';
    }

    return text
      .split('\n')
      .map((line) => this.transposeLineIfChords(line, steps))
      .join('\n');
  }

  private transposeLineIfChords(line: string, steps: number): string {
    const tokens = line.split(/(\s+)/); // keep whitespace so spacing is preserved
    const meaningfulTokens = tokens.filter((t) => t.trim().length > 0);

    if (meaningfulTokens.length === 0) {
      return line; // blank line
    }

    const isChordLine = meaningfulTokens.every(
      (t) =>
        this.stripPunctuation(t).isChord ||
        TransposePage.NON_CHORD_ALLOWED.test(t)
    );

    if (!isChordLine) {
      return line; // treat as lyrics — do not touch
    }

    return tokens
      .map((token) => {
        if (token.trim().length === 0) {
          return token; // whitespace, unchanged
        }
        if (TransposePage.NON_CHORD_ALLOWED.test(token)) {
          return token; // bar lines, repeat markers, etc.
        }
        return this.transposeToken(token, steps);
      })
      .join('');
  }

  private stripPunctuation(token: string): { core: string; isChord: boolean } {
    const prefixMatch = token.match(/^[\(\[\{]+/);
    const suffixMatch = token.match(/[\)\]\}\.,;!]+$/);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    const suffix = suffixMatch ? suffixMatch[0] : '';
    const core = token.slice(prefix.length, token.length - suffix.length);
    return { core, isChord: this.isValidChordToken(core) };
  }

  private isValidChordToken(core: string): boolean {
    if (!core) return false;
    const chordRegex = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?)([^/]*))?$/;
    const match = core.match(chordRegex);
    if (!match) return false;

    const quality = match[3] || '';
    const bassQuality = match[6] || '';
    return (
      TransposePage.QUALITY_REGEX.test(quality) &&
      TransposePage.QUALITY_REGEX.test(bassQuality)
    );
  }

  private transposeToken(token: string, steps: number): string {
    const prefixMatch = token.match(/^[\(\[\{]+/);
    const suffixMatch = token.match(/[\)\]\}\.,;!]+$/);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    const suffix = suffixMatch ? suffixMatch[0] : '';
    const core = token.slice(prefix.length, token.length - suffix.length);

    if (!this.isValidChordToken(core)) {
      return token; // safety net — leave unrecognized tokens untouched
    }

    const chordRegex = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?)([^/]*))?$/;
    const match = core.match(chordRegex)!;

    const root = match[1] + (match[2] || '');
    const quality = match[3] || '';
    const bassRoot = match[4] ? match[4] + (match[5] || '') : '';
    const bassQuality = match[6] || '';

    const transposedRoot = this.transposeNote(root, steps);
    const transposedBass = bassRoot
      ? '/' + this.transposeNote(bassRoot, steps) + bassQuality
      : '';

    return `${prefix}${transposedRoot}${quality}${transposedBass}${suffix}`;
  }

  private transposeNote(note: string, steps: number): string {
    const order = [
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    ];
    const map: Record<string, string> = {
      A: 'A', 'A#': 'A#', Bb: 'A#',
      B: 'B',
      C: 'C', 'C#': 'C#', Db: 'C#',
      D: 'D', 'D#': 'D#', Eb: 'D#',
      E: 'E',
      F: 'F', 'F#': 'F#', Gb: 'F#',
      G: 'G', 'G#': 'G#', Ab: 'G#',
    };
    const normalized = map[note] || note;
    const index = order.indexOf(normalized);
    if (index === -1) {
      return note;
    }
    const next = (index + steps + 12) % 12;
    return order[next];
  }
}
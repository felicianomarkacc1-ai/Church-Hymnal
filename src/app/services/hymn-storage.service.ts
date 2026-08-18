import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Hymn, HymnSection, AppSettings, SavedTranspose } from '../models/hymn.model';
import { sampleHymns } from '../data/sample-hymns';
import { Storage } from '@ionic/storage-angular';

/** ID offset for built-in hymns so they never collide with user-added hymn IDs */
const BUILT_IN_ID_BASE = 1_000_000;

@Injectable({
  providedIn: 'root',
})
export class HymnStorageService {
  /** Hardcoded hymns from data/sample-hymns.ts. Computed once, never persisted. */
  private readonly builtInHymns: Hymn[] = this.buildBuiltInHymns();

  /** Only hymns the user has added/imported themselves, persisted to local storage. */
  private userHymnsSubject = new BehaviorSubject<Hymn[]>([]);

  /** Combined view: built-in + user hymns, sorted by number. This is what the app reads from. */
  private hymnsSubject = new BehaviorSubject<Hymn[]>(this.builtInHymns);

  private savedTransposesSubject = new BehaviorSubject<SavedTranspose[]>([]);
  private settingsSubject = new BehaviorSubject<AppSettings>({
    id: 'app-settings',
    theme: 'dark',
    colorTheme: 'purple',
    fontSize: 3,
    keepScreenAwake: false,
  });

  hymns$ = this.hymnsSubject.asObservable();
  savedTransposes$ = this.savedTransposesSubject.asObservable();
  settings$ = this.settingsSubject.asObservable();

  private initialized = false;

  constructor(private storage: Storage) {
    // Whenever the user's stored hymns change, recombine with the built-ins.
    this.userHymnsSubject.subscribe((userHymns) => {
      const combined = [...this.builtInHymns, ...userHymns].sort(
        (a, b) => a.number - b.number
      );
      this.hymnsSubject.next(combined);
    });
  }

  /**
   * Initialize storage and load all data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.storage.create();
    await this.loadHymns();
    await this.loadSavedTransposes();
    await this.loadSettings();
    this.initialized = true;
  }

  /**
   * Load all saved transpose entries from storage
   */
  private async loadSavedTransposes(): Promise<void> {
    const saved = await this.storage.get('saved-transposes');
    this.savedTransposesSubject.next(saved || []);
  }

  getSavedTransposesSync(): SavedTranspose[] {
    return this.savedTransposesSubject.value;
  }

  async addSavedTranspose(
    title: string,
    input: string,
    steps: number,
    output: string
  ): Promise<SavedTranspose> {
    const saved = this.savedTransposesSubject.value;
    const newId = Math.max(0, ...saved.map((item) => item.id)) + 1;
    const now = Date.now();
    const record: SavedTranspose = {
      id: newId,
      title,
      input,
      steps,
      output,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [record, ...saved];
    await this.storage.set('saved-transposes', updated);
    this.savedTransposesSubject.next(updated);
    return record;
  }

  async deleteSavedTranspose(id: number): Promise<void> {
    const updated = this.savedTransposesSubject.value.filter(
      (item) => item.id !== id
    );
    await this.storage.set('saved-transposes', updated);
    this.savedTransposesSubject.next(updated);
  }

  /**
   * Load user-added hymns from storage. Any stored hymn whose number matches
   * a built-in hymn is dropped automatically — this cleans up old installs
   * where sample hymns had previously been seeded directly into storage.
   */
  private async loadHymns(): Promise<void> {
    const stored: Hymn[] = (await this.storage.get('hymns')) || [];
    const builtInNumbers = new Set(this.builtInHymns.map((h) => h.number));
    const userOnly = stored.filter((h) => !builtInNumbers.has(h.number));
    this.userHymnsSubject.next(userOnly);
  }

  /**
   * Load app settings from storage
   */
  private async loadSettings(): Promise<void> {
    const settings = await this.storage.get('app-settings');
    if (settings) {
      this.settingsSubject.next(settings);
    }
  }

  /**
   * Get all hymns synchronously (built-in + user, combined)
   */
  getHymnsSync(): Hymn[] {
    return this.hymnsSubject.value;
  }

  /**
   * Get a hymn by ID (built-in or user-added)
   */
  async getHymnById(id: number): Promise<Hymn | undefined> {
    return this.hymnsSubject.value.find((h) => h.id === id);
  }

  /**
   * Get a hymn by hymn number (built-in or user-added)
   */
  async getHymnByNumber(number: number): Promise<Hymn | undefined> {
    return this.hymnsSubject.value.find((h) => h.number === number);
  }

  /**
   * Search hymns by title or number (built-in + user)
   */
  search(query: string): Hymn[] {
    const hymns = this.hymnsSubject.value;
    const lower = query.toLowerCase();
    return hymns.filter(
      (h) =>
        h.title.toLowerCase().includes(lower) ||
        h.number.toString().includes(lower)
    );
  }

  /**
   * Checks whether a hymn number is already used by another hymn in the
   * same language (built-in or user-added). The same number is allowed to
   * exist once per language (e.g. #132 in English and #132 in Tagalog),
   * but not twice within the same language.
   *
   * @param excludeId optional hymn id to ignore (used when updating a hymn,
   * so it doesn't collide with itself)
   */
  private isNumberTakenInLanguage(
    number: number,
    language: 'english' | 'tagalog',
    excludeId?: number
  ): boolean {
    return this.hymnsSubject.value.some(
      (h) =>
        h.number === number &&
        (h.language ?? 'english') === language &&
        h.id !== excludeId
    );
  }

  /**
   * Builds a friendly error message for a duplicate hymn number within a language.
   */
  private duplicateNumberMessage(
    number: number,
    language: 'english' | 'tagalog'
  ): string {
    const languageLabel = language === 'english' ? 'English' : 'Tagalog';
    return `Hymn #${number} already exists in ${languageLabel}. Please choose a different number.`;
  }

  /**
   * Add a new user hymn. Always saved to local storage; never touches built-ins.
   * Throws if a hymn with the same number already exists in the same language.
   */
  async addHymn(
    number: number,
    title: string,
    lyricsText: string,
    language: 'english' | 'tagalog' = 'english'
  ): Promise<Hymn> {
    if (this.isNumberTakenInLanguage(number, language)) {
      throw new Error(this.duplicateNumberMessage(number, language));
    }

    const userHymns = this.userHymnsSubject.value;
    const newId = Math.max(0, ...userHymns.map((h) => h.id)) + 1;
    const sections = this.parseHymnText(lyricsText);

    const hymn: Hymn = {
      id: newId,
      number,
      title,
      language,
      sections,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...userHymns, hymn].sort((a, b) => a.number - b.number);
    await this.storage.set('hymns', updated);
    this.userHymnsSubject.next(updated);

    return hymn;
  }

  /**
   * Update an existing user hymn. Throws if the target is a built-in hymn,
   * or if the new number/language combo collides with a different hymn.
   */
  async updateHymn(
    id: number,
    number: number,
    title: string,
    lyricsText: string,
    language: 'english' | 'tagalog' = 'english'
  ): Promise<Hymn | undefined> {
    if (id >= BUILT_IN_ID_BASE) {
      throw new Error('Built-in hymns cannot be edited.');
    }

    if (this.isNumberTakenInLanguage(number, language, id)) {
      throw new Error(this.duplicateNumberMessage(number, language));
    }

    const userHymns = this.userHymnsSubject.value;
    const index = userHymns.findIndex((h) => h.id === id);

    if (index === -1) return undefined;

    const sections = this.parseHymnText(lyricsText);
    userHymns[index] = {
      ...userHymns[index],
      number,
      title,
      language,
      sections,
      updatedAt: Date.now(),
    };

    const updated = [...userHymns].sort((a, b) => a.number - b.number);
    await this.storage.set('hymns', updated);
    this.userHymnsSubject.next(updated);

    return userHymns[index];
  }

  /**
   * Delete a user hymn. Throws if the target is a built-in hymn.
   */
  async deleteHymn(id: number): Promise<void> {
    if (id >= BUILT_IN_ID_BASE) {
      throw new Error('Built-in hymns cannot be deleted.');
    }

    const userHymns = this.userHymnsSubject.value.filter((h) => h.id !== id);
    await this.storage.set('hymns', userHymns);
    this.userHymnsSubject.next(userHymns);
  }

  /**
   * Remove all user-added hymns from storage and reset the in-memory list.
   * This does not touch built-in hymns defined in `sample-hymns.ts`.
   */
  async clearUserHymns(): Promise<void> {
    await this.storage.remove('hymns');
    this.userHymnsSubject.next([]);
  }

  /**
   * Parse hymn lyrics text into sections.
   * Supports tags like [Verse 1], [Chorus], [Bridge], and also blank-line separation.
   */
  private parseHymnText(text: string): HymnSection[] {
    const normalized = text.replace(/\r\n/g, '\n').trim();

    if (!normalized) {
      return [
        {
          type: 'verse',
          text: 'No lyrics',
        },
      ];
    }

    const tagMatches = Array.from(normalized.matchAll(/\[(.+?)\]/g));

    if (tagMatches.length > 0) {
      const sections: HymnSection[] = [];
      const firstTagIndex = tagMatches[0].index ?? 0;
      const preludeText = normalized.slice(0, firstTagIndex).trim();

      if (preludeText) {
        sections.push({
          type: 'verse',
          label: 'Verse 1',
          text: preludeText,
        });
      }

      for (let i = 0; i < tagMatches.length; i++) {
        const match = tagMatches[i];
        const label = match[1].trim();
        const sectionStart = (match.index ?? 0) + match[0].length;
        const sectionEnd = tagMatches[i + 1]?.index ?? normalized.length;
        const sectionText = normalized.slice(sectionStart, sectionEnd).trim();

        if (sectionText) {
          sections.push({
            type: this.inferSectionType(label),
            label,
            text: sectionText,
          });
        }
      }

      return sections.length > 0 ? sections : [{ type: 'verse', text: normalized }];
    }

    const paragraphs = normalized.split(/\n\s*\n/).filter((p) => p.trim());

    if (paragraphs.length > 1) {
      return paragraphs.map((paragraph, index) => ({
        type: index % 2 === 0 ? 'verse' : 'chorus',
        text: paragraph.trim(),
      }));
    }

    return [
      {
        type: 'verse',
        text: normalized,
      },
    ];
  }

  private inferSectionType(label: string): HymnSection['type'] {
    const normalized = label.toLowerCase();
    if (normalized.includes('chorus')) return 'chorus';
    if (normalized.includes('bridge')) return 'bridge';
    return 'verse';
  }

  /**
   * Update app settings
   */
  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = this.settingsSubject.value;
    const updated = { ...current, ...settings };
    await this.storage.set('app-settings', updated);
    this.settingsSubject.next(updated);
  }

  /**
   * Export all hymns as JSON. Includes built-ins for a full backup;
   * on import, built-in numbers are skipped automatically (see loadHymns).
   */
  exportToJSON(): string {
    return JSON.stringify(this.hymnsSubject.value, null, 2);
  }

  /**
   * Import hymns from JSON as user hymns. Skips any whose number
   * matches a built-in hymn, since those already exist.
   * Also skips any that would collide with an existing hymn in the
   * same language (number + language already taken).
   */
  async importFromJSON(jsonText: string): Promise<Hymn[]> {
    try {
      const parsed = JSON.parse(jsonText) as Hymn[];
      const builtInNumbers = new Set(this.builtInHymns.map((h) => h.number));

      const existing = this.userHymnsSubject.value;
      const maxId = Math.max(0, ...existing.map((h) => h.id));

      const imported: Hymn[] = [];
      let nextId = maxId + 1;

      for (const h of parsed) {
        if (builtInNumbers.has(h.number)) continue;

        const language = h.language ?? 'english';
        const alreadyTaken = this.isNumberTakenInLanguage(h.number, language);
        const alreadyQueued = imported.some(
          (q) => q.number === h.number && (q.language ?? 'english') === language
        );

        if (alreadyTaken || alreadyQueued) continue;

        imported.push({
          ...h,
          id: nextId++,
          isBuiltIn: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      const merged = [...existing, ...imported].sort(
        (a, b) => a.number - b.number
      );
      await this.storage.set('hymns', merged);
      this.userHymnsSubject.next(merged);

      return imported;
    } catch (error) {
      console.error('Failed to import hymns:', error);
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Build the permanent, hardcoded hymn list from data/sample-hymns.ts.
   * These are computed fresh on every app load and never written to storage,
   * so adding a new entry to sample-hymns.ts always shows up immediately.
   */
  private buildBuiltInHymns(): Hymn[] {
    return sampleHymns.map((entry, index) => ({
      id: BUILT_IN_ID_BASE + index,
      number: entry.number,
      title: entry.title,
      language: entry.language ?? 'english',
      sections: this.parseHymnText(entry.lyrics),
      isBuiltIn: true,
      createdAt: 0,
      updatedAt: 0,
    }));
  }
}
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Hymn, HymnSection, AppSettings, SavedTranspose } from '../models/hymn.model';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class HymnStorageService {
  private hymnsSubject = new BehaviorSubject<Hymn[]>([]);
  private savedTransposesSubject = new BehaviorSubject<SavedTranspose[]>([]);
  private settingsSubject = new BehaviorSubject<AppSettings>({
    id: 'app-settings',
    theme: 'dark',
    fontSize: 3,
    keepScreenAwake: false,
  });

  hymns$ = this.hymnsSubject.asObservable();
  savedTransposes$ = this.savedTransposesSubject.asObservable();
  settings$ = this.settingsSubject.asObservable();

  private initialized = false;

  constructor(private storage: Storage) {}

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
   * Load all hymns from storage
   */
  private async loadHymns(): Promise<void> {
    const hymns = await this.storage.get('hymns');
    this.hymnsSubject.next(hymns || []);
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
   * Get all hymns synchronously (for subscriptions)
   */
  getHymnsSync(): Hymn[] {
    return this.hymnsSubject.value;
  }

  /**
   * Get a hymn by ID
   */
  async getHymnById(id: number): Promise<Hymn | undefined> {
    const hymns = this.hymnsSubject.value;
    return hymns.find((h) => h.id === id);
  }

  /**
   * Get a hymn by hymn number
   */
  async getHymnByNumber(number: number): Promise<Hymn | undefined> {
    const hymns = this.hymnsSubject.value;
    return hymns.find((h) => h.number === number);
  }

  /**
   * Search hymns by title or number
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
   * Add a new hymn
   */
  async addHymn(
    number: number,
    title: string,
    lyricsText: string,
    language: 'english' | 'tagalog' = 'english'
  ): Promise<Hymn> {
    const hymns = this.hymnsSubject.value;
    const newId = Math.max(0, ...hymns.map((h) => h.id)) + 1;
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

    const updated = [...hymns, hymn].sort((a, b) => a.number - b.number);
    await this.storage.set('hymns', updated);
    this.hymnsSubject.next(updated);

    return hymn;
  }

  /**
   * Update an existing hymn
   */
  async updateHymn(
    id: number,
    number: number,
    title: string,
    lyricsText: string,
    language: 'english' | 'tagalog' = 'english'
  ): Promise<Hymn | undefined> {
    const hymns = this.hymnsSubject.value;
    const index = hymns.findIndex((h) => h.id === id);

    if (index === -1) return undefined;

    const sections = this.parseHymnText(lyricsText);
    hymns[index] = {
      ...hymns[index],
      number,
      title,
      language,
      sections,
      updatedAt: Date.now(),
    };

    const updated = [...hymns].sort((a, b) => a.number - b.number);
    await this.storage.set('hymns', updated);
    this.hymnsSubject.next(updated);

    return hymns[index];
  }

  /**
   * Delete a hymn
   */
  async deleteHymn(id: number): Promise<void> {
    const hymns = this.hymnsSubject.value.filter((h) => h.id !== id);
    await this.storage.set('hymns', hymns);
    this.hymnsSubject.next(hymns);
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
   * Export all hymns as JSON
   */
  exportToJSON(): string {
    const hymns = this.hymnsSubject.value;
    return JSON.stringify(hymns, null, 2);
  }

  /**
   * Import hymns from JSON
   */
  async importFromJSON(jsonText: string): Promise<Hymn[]> {
    try {
      const hymns = JSON.parse(jsonText) as Hymn[];
      // Ensure IDs don't conflict
      const existing = this.hymnsSubject.value;
      const maxId = Math.max(0, ...existing.map((h) => h.id));

      const imported = hymns.map((h, idx) => ({
        ...h,
        id: maxId + idx + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      const merged = [...existing, ...imported].sort(
        (a, b) => a.number - b.number
      );
      await this.storage.set('hymns', merged);
      this.hymnsSubject.next(merged);

      return imported;
    } catch (error) {
      console.error('Failed to import hymns:', error);
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Seed database with sample hymns (development only)
   */
  async seedSampleData(): Promise<void> {
    const existing = this.hymnsSubject.value;
    if (existing.length > 0) return; // Don't seed if data exists

    const sampleHymns = [
      {
        number: 1,
        title: 'O Come All Ye Faithful',
        lyrics: `[Verse 1]
O come, all ye faithful,
Joyful and triumphant!
O come ye, O come ye,
To Bethlehem;
Come and behold Him
Born the King of Angels:

[Chorus]
O come, let us adore Him,
O come, let us adore Him,
O come, let us adore Him,
Christ the Lord!`,
      },
      {
        number: 132,
        title: 'Amazing Grace',
        lyrics: `[Verse 1]
Amazing grace, how sweet the sound,
That saved a wretch like me!
I once was lost, but now am found,
Was blind, but now I see.

[Verse 2]
'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed!

[Chorus]
Through many dangers, toils and snares,
I have already come;
'Tis grace has brought me safe thus far,
And grace will lead me home.`,
      },
      {
        number: 256,
        title: 'It Is Well with My Soul',
        lyrics: `[Verse 1]
When peace like a river attendeth my way,
When sorrows like sea billows roll;
Whatever my lot, Thou hast taught me to say,
"It is well, it is well with my soul."

[Chorus]
It is well (it is well)
With my soul (with my soul),
It is well, it is well with my soul.

[Verse 2]
Though Satan should buffet, though trials should come,
Let this blessed assurance control,
That Christ has regarded my helpless estate,
And hath shed His own blood for my soul.`,
      },
      {
        number: 347,
        title: 'Jesus Loves Me',
        lyrics: `[Verse 1]
Jesus loves me, this I know,
For the Bible tells me so.
Little ones to Him belong;
They are weak, but He is strong.

[Chorus]
Yes, Jesus loves me,
Yes, Jesus loves me,
Yes, Jesus loves me,
The Bible tells me so.

[Verse 2]
Jesus loves me, loves me still,
Though I'm very weak and ill.
From His shining throne on high,
Comes to watch me where I lie.`,
      },
      {
        number: 449,
        title: 'Great Is Thy Faithfulness',
        lyrics: `[Verse 1]
Great is Thy faithfulness,
O God my Father!
There is no shadow of turning with Thee;
Thou changest not, Thy compassions they fail not,
As Thou hast been Thou forever will be.

[Chorus]
Great is Thy faithfulness!
Great is Thy faithfulness!
Morning by morning new mercies I see;
All I have needed Thy hand hath provided;
Great is Thy faithfulness, Lord, unto me!`,
      },
      {
        number: 71,
        title: 'Holy, Holy, Holy',
        lyrics: `[Verse 1]
Holy, holy, holy!
Lord God Almighty!
Early in the morning my song shall rise to Thee;
Holy, holy, holy, merciful and mighty,
God in three Persons, blessed Trinity.

[Verse 2]
Holy, holy, holy! All the saints adore Thee,
Casting down their golden crowns around the glassy sea;
Cherubim and seraphim falling down before Thee,
Who wert and art and evermore shalt be.

[Chorus]
Holy, holy, holy!
Though the darkness hide Thee,
Though the eye of sinful man Thy glory may not see;
Only Thou art holy, there is none beside Thee,
Perfect in power, in love, and purity.`,
      },
      {
        number: 293,
        title: 'Blessed Assurance',
        lyrics: `[Verse 1]
Blessed assurance, Jesus is mine!
O what a foretaste of glory divine!
Heir of salvation, purchase of God,
Born of His Spirit, washed in His blood.

[Chorus]
This is my story, this is my song,
Praising my Savior all the day long;
This is my story, this is my song,
Praising my Savior all the day long.

[Verse 2]
Perfect submission, perfect delight,
Visions of rapture now burst on my sight;
Angels descending bring from above
Echoes of mercy, whispers of love.`,
      },
      {
        number: 147,
        title: 'How Great Thou Art',
        lyrics: `[Verse 1]
O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made,
I see the stars, I hear the rolling thunder,
Thy power throughout the universe displayed.

[Chorus]
Then sings my soul, my Savior God, to Thee,
How great Thou art, how great Thou art!
Then sings my soul, my Savior God, to Thee,
How great Thou art, how great Thou art!

[Verse 2]
When through the woods and forest glades I wander
And hear the birds sing sweetly in the trees;
When I look down from lofty mountain grandeur
And hear the brook, and feel the gentle breeze.`,
      },
    ];

    for (const hymn of sampleHymns) {
      await this.addHymn(hymn.number, hymn.title, hymn.lyrics);
    }
  }
}

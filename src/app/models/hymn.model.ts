/** Hymn data model */
export interface Hymn {
  id: number;
  number: number; // hymn number (e.g., 132)
  title: string;
  language?: 'english' | 'tagalog';
  sections: HymnSection[];
  createdAt: number;
  updatedAt: number;
  /**
   * True for hymns that ship hardcoded with the app (from data/sample-hymns.ts).
   * Their source records remain unchanged; edits are saved as device-local
   * overrides. Built-in hymns cannot be deleted.
   * User-added hymns omit this (or set it false).
   */
  isBuiltIn?: boolean;
}

export interface SavedTranspose {
  id: number;
  title: string;
  input: string;
  steps: number;
  output: string;
  createdAt: number;
  updatedAt: number;
}

/** Individual section (verse, chorus, bridge) within a hymn */
export interface HymnSection {
  type: 'verse' | 'chorus' | 'bridge';
  label?: string; // e.g., "Verse 1", "Chorus"
  text: string;
}

export type AppColorTheme =
  | 'original'
  | 'purple'
  | 'blue'
  | 'green'
  | 'rose'
  | 'sunny'
  | 'winter'
  | 'rainy'
  | 'autumn'
  | 'graphite'
  | 'midnight'
  | 'mandarin'
  | 'cyan-navy';

/** Settings for presentation mode and app */
export interface AppSettings {
  id: string; // always 'app-settings'
  theme: 'dark' | 'light';
  colorTheme: AppColorTheme;
  fontSize: number; // 1-5 scale
  keepScreenAwake: boolean;
  lastPresentedHymnId?: number;
}
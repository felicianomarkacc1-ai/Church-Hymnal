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
   * These are never persisted to storage and cannot be edited or deleted.
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

export type AppColorTheme = 'purple' | 'blue' | 'green' | 'rose';

/** Settings for presentation mode and app */
export interface AppSettings {
  id: string; // always 'app-settings'
  theme: 'dark' | 'light';
  colorTheme: AppColorTheme;
  fontSize: number; // 1-5 scale
  keepScreenAwake: boolean;
  lastPresentedHymnId?: number;
}
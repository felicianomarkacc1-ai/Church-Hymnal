/** Hymn data model */
export interface Hymn {
  id: number;
  number: number; // hymn number (e.g., 132)
  title: string;
  language?: 'english' | 'tagalog';
  sections: HymnSection[];
  createdAt: number;
  updatedAt: number;
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

/** Settings for presentation mode and app */
export interface AppSettings {
  id: string; // always 'app-settings'
  theme: 'dark' | 'light';
  fontSize: number; // 1-5 scale
  keepScreenAwake: boolean;
  lastPresentedHymnId?: number;
}

# Hymn Presenter App

A website-first, offline-friendly hymn presentation app built with **Ionic 7 + Angular + Capacitor**. It runs in a browser now and can later be wrapped as a mobile app.

## Features

- ✅ **Offline-First**: All data stored locally on device; no internet required
- ✅ **Hymn Library**: Searchable list of hymns with number and title
- ✅ **Presentation Mode**: Full-screen, distraction-free slide show for displaying lyrics
- ✅ **Swipe Navigation**: Next/previous slides by swiping or tapping
- ✅ **Font Size Control**: Adjustable text size in presentation mode
- ✅ **Hymn Editor**: Add, edit, delete hymns with verse/chorus/bridge parsing
- ✅ **Import/Export**: Backup and share hymn databases as JSON
- ✅ **Settings**: Theme, default font size, screen-awake options

## Project Structure

```
hymn-app/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── library/          # Home screen with hymn list
│   │   │   ├── editor/           # Add/edit hymn page
│   │   │   ├── presentation/     # Full-screen presentation mode
│   │   │   └── settings/         # Settings page
│   │   ├── services/
│   │   │   └── hymn-storage.service.ts  # Offline data service
│   │   ├── models/
│   │   │   └── hymn.model.ts     # Data models
│   │   ├── app.component.ts      # Root component
│   │   ├── app.routes.ts         # Routing config
│   │   └── app.config.ts         # App configuration
│   ├── styles.scss               # Global styles
│   ├── theme/
│   │   └── variables.scss        # Ionic theme variables
│   ├── index.html                # HTML entry point
│   └── main.ts                   # Bootstrap
├── package.json
├── tsconfig.json
├── angular.json
├── ionic.config.json
└── README.md
```

## Setup & Installation

### Prerequisites

- **Node.js** 16+ and **npm**
- **Angular CLI** (optional, included in scripts)
- **Ionic CLI** (optional, included in scripts)

### Install Dependencies

```bash
cd hymn-app
npm install
```

### Run Development Server

```bash
npm start
```

The app will open at `http://localhost:4200`

### Build for Production

```bash
npm run build
```

Output goes to `dist/hymn-presenter/`

## Deploying the Website

You can publish the `dist/hymn-presenter/` folder to any static host (Netlify, Vercel, GitHub Pages, S3, etc).

Quick GitHub Pages steps (optional):

1. Install gh-pages:

```bash
npm install --save-dev gh-pages
```

2. Add these scripts to `package.json`:

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist/hymn-presenter"
}
```

3. Run:

```bash
npm run deploy
```

Netlify/Vercel: just drag the `dist/hymn-presenter` folder or connect the repo and set the build command to `npm run build` and publish directory to `dist/hymn-presenter`.

## Data Models

### Hymn

```typescript
interface Hymn {
  id: number;
  number: number;        // E.g., 132
  title: string;         // E.g., "Amazing Grace"
  sections: HymnSection[];
  createdAt: number;
  updatedAt: number;
}
```

### HymnSection

```typescript
interface HymnSection {
  type: 'verse' | 'chorus' | 'bridge';
  label?: string;        // E.g., "Verse 1"
  text: string;
}
```

### AppSettings

```typescript
interface AppSettings {
  id: string;           // Always 'app-settings'
  theme: 'dark' | 'light';
  fontSize: number;     // 1-5 scale
  keepScreenAwake: boolean;
  lastPresentedHymnId?: number;
}
```

## Usage

### Library Page

1. Browse all hymns in the searchable list
2. Search by hymn number or title
3. **Present**: Tap the play icon to launch presentation mode
4. **Edit**: Tap the pencil icon to edit a hymn
5. **Delete**: Tap the trash icon to delete a hymn
6. **Add**: Tap the + button (FAB) to create a new hymn
7. **Import/Export**: Use the buttons to backup or restore the hymn database

### Editor Page

1. Fill in hymn number, title, and lyrics
2. Format lyrics with tags:
   ```
   [Verse 1]
   First verse text...
   
   [Chorus]
   Chorus text...
   
   [Verse 2]
   Second verse text...
   ```
3. Or separate sections with blank lines
4. Save to add/update the hymn

### Presentation Mode

- **Tap Left Side**: Previous slide
- **Tap Right Side**: Next slide
- **Swipe Left**: Next slide
- **Swipe Right**: Previous slide
- **Tap Screen**: Toggle control overlay
- **Controls**: Adjust font size, exit presentation
- **Counter**: Shows current slide number (e.g., "2 / 5")

### Settings

- **Theme**: Toggle dark/light mode (presentation mode is always dark)
- **Default Font Size**: 1 (tiny) to 5 (extra large)
- **Keep Screen Awake**: Disable screen lock during presentations

## Storage

- Uses **Ionic Storage** (IndexedDB-backed) for simplicity
- All hymns stored in browser/device storage
- Settings saved separately
- Data persists across app restarts and updates

### Future Enhancement: Capacitor SQLite

To upgrade to Capacitor SQLite for more advanced queries:

```bash
npm install @capacitor-community/sqlite
```

Then refactor `hymn-storage.service.ts` to use SQL queries instead of IndexedDB.

## Capacitor Setup (for native builds)

### Initialize Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init hymn-presenter "Hymn Presenter"
```

### Add Platforms

```bash
npx cap add android
npx cap add ios
```

### Build & Deploy to Android

```bash
npm run build
npx cap copy
npx cap open android
```

Then build in Android Studio.

### Build & Deploy to iOS

```bash
npm run build
npx cap copy
npx cap open ios
```

Then build in Xcode.

## Sample Data

The app comes pre-loaded with 5 sample hymns:

1. O Come All Ye Faithful
2. Amazing Grace
3. It Is Well with My Soul
4. Jesus Loves Me
5. Great Is Thy Faithfulness

These are seeded automatically on first launch. Delete them and add your own or import a backup.

## Development Tips

### Add a New Hymn (Programmatic)

```typescript
await this.hymnStorage.addHymn(
  256,
  "It Is Well with My Soul",
  "[Verse 1]\nWhen peace like a river..."
);
```

### Search Hymns

```typescript
const results = this.hymnStorage.search("Amazing");
```

### Export Hymns as JSON

```typescript
const json = this.hymnStorage.exportToJSON();
// Download the file...
```

### Import from JSON

```typescript
await this.hymnStorage.importFromJSON(jsonString);
```

## Troubleshooting

### Data Not Persisting

- Ensure the app has storage permissions
- Check browser DevTools (IndexedDB/Storage tab)
- Clear cache and try again

### Swipe Navigation Not Working

- Ensure `(touchstart)` and `(touchend)` bindings are on the presentation content
- Test on a device or mobile emulator for better touch detection

### Font Size Not Updating

- Settings changes save to storage automatically
- Refresh the presentation mode page to see changes

## Future Enhancements

- 🎵 **Multiple Languages**: Display English + local language lyrics side-by-side
- 📺 **Auto-Scroll "Teleprompter" Mode**: Auto-advance slides or smooth scrolling
- ⭐ **Favorites & Recently Presented**: Quick access to frequently used hymns
- 🌙 **Smart Theme**: Auto-detect light/dark mode based on device settings
- 🔤 **Custom Fonts**: Choose from multiple font families
- 📱 **Two-Screen Mode**: Control presentation from secondary device
- 🎤 **Chord Display**: Show guitar chords above lyrics

## License

MIT License — feel free to use and modify for your church or community!

## Support

For issues or feature requests, create a GitHub issue or contact the maintainer.

---

Built with ❤️ for worship and church services.

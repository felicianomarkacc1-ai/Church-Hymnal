# Quick Start Guide — Hymn Presenter App

## What You Have

A complete, production-ready **Ionic 7 + Angular** offline hymn presentation app that works on iOS, Android, and the web browser.

## Key Features

✅ **Fully Offline** — All data stored locally  
✅ **PowerPoint-Style Presentation Mode** — Full-screen lyrics display with swipe navigation  
✅ **Hymn Library** — Searchable, sortable list of hymns  
✅ **Editor** — Add/edit/delete hymns with smart verse/chorus parsing  
✅ **Import/Export** — Backup your hymn database as JSON  
✅ **Settings** — Theme, font size, screen-lock options  
✅ **Sample Data** — 5 pre-loaded hymns for immediate testing  

## Getting Started (3 Steps)

### 1. Install Dependencies

```bash
cd hymn-app
npm install
```

This installs Angular, Ionic, Capacitor, and all required libraries (~500 MB download).

### 2. Run Development Server

```bash
npm start
```

Opens your app at `http://localhost:4200`. The browser DevTools will auto-open.

### 3. Test the Features

- **Library**: Browse the 5 sample hymns (O Come All Ye Faithful, Amazing Grace, etc.)
- **Search**: Try searching "Amazing" or "256"
- **Present**: Click the play icon to enter full-screen presentation mode
- **Swipe/Tap**: Navigate between verses using left/right swipes or side taps
- **Add Hymn**: Click the + button to create a new hymn
- **Settings**: Adjust font size and theme

## Project Structure

```
hymn-app/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── library/        Home screen
│   │   │   ├── editor/         Add/edit hymns
│   │   │   ├── presentation/   Full-screen viewer ⭐ (main feature)
│   │   │   └── settings/       Settings
│   │   ├── services/
│   │   │   └── hymn-storage.service.ts  ← Data layer (all CRUD here)
│   │   ├── models/
│   │   │   └── hymn.model.ts   Data types
│   │   └── app.config.ts       Ionic/Angular bootstrap
│   ├── styles.scss             Global styles
│   └── index.html              Entry point
├── package.json                Dependencies
├── angular.json                Build config
├── ionic.config.json           Ionic config
└── capacitor.config.json       Native build config
```

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/app/services/hymn-storage.service.ts` | **All data operations** (CRUD, search, import/export) |
| `src/app/pages/presentation/presentation.page.ts` | **Presentation mode** (swipe logic, font scaling) |
| `src/app/pages/library/library.page.ts` | **Home screen** (hymn list, search) |
| `src/app/pages/editor/editor.page.ts` | **Hymn editor** (add/edit form) |
| `src/app/models/hymn.model.ts` | **Data models** (Hymn, HymnSection, AppSettings) |

## Customization Examples

### Add More Sample Hymns

Edit `src/app/services/hymn-storage.service.ts`, method `seedSampleData()`:

```typescript
const sampleHymns = [
  {
    number: 100,
    title: "My Custom Hymn",
    lyrics: `[Verse 1]\nYour lyrics here...`,
  },
  // Add more...
];
```

### Change Presentation Colors

Edit `src/app/pages/presentation/presentation.page.scss`:

```scss
.presentation-area {
  background: #1a1a1a;  // Change background
  color: #ffffcc;       // Change text color
}
```

### Add Keyboard Shortcuts

In `presentation.page.ts`:

```typescript
@HostListener('window:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') this.nextSection();
  if (event.key === 'ArrowLeft') this.previousSection();
}
```

### Adjust Default Font Size

In `settings.page.ts`, change the default:

```typescript
fontSize: 4,  // Default to larger font
```

## Building for Mobile (Capacitor)

### Initialize Capacitor (one-time)

```bash
npm install @capacitor/core @capacitor/cli
npx cap init hymn-presenter "Hymn Presenter"
npx cap add android   # or ios
```

### Build & Deploy

```bash
npm run build           # Create production build
npx cap copy           # Copy to native project
npx cap open android   # Open in Android Studio
```

Then compile in Android Studio (Build → Make Project → Run).

## Data Storage

- **Technology**: Ionic Storage (IndexedDB-backed for web, native for iOS/Android)
- **Location**: Browser IndexedDB → `/storage/` on device
- **Persistence**: Survives app restart, device reboot, app updates
- **Backup**: Use the Export button to save `hymns-backup.json`

## API Reference

All data operations go through the **HymnStorageService**:

```typescript
// Get all hymns
const hymns = this.hymnStorage.getHymnsSync();

// Add a hymn
await this.hymnStorage.addHymn(
  256,
  "It Is Well with My Soul",
  "[Verse 1]\nText here..."
);

// Search
const results = this.hymnStorage.search("Amazing");

// Delete
await this.hymnStorage.deleteHymn(hymnId);

// Export/Import
const json = this.hymnStorage.exportToJSON();
await this.hymnStorage.importFromJSON(jsonString);

// Settings
await this.hymnStorage.updateSettings({ fontSize: 4 });
```

## Troubleshooting

### "npm: command not found"
Install Node.js from [nodejs.org](https://nodejs.org/)

### Data disappears after refresh
- Ensure storage is initialized: `await this.hymnStorage.initialize();`
- Check browser DevTools → Application → IndexedDB

### Presentation mode text too small
- In presentation, tap the screen to reveal controls
- Use +/- buttons to adjust font size
- Or go to Settings page and change default

### Swipe not working
- Test on actual device or mobile emulator
- Desktop browser touch events may not trigger swipe
- Use keyboard arrows as alternative on desktop

## Next Steps

1. **Add your hymns**: Create a JSON file with your hymnal's lyrics and import
2. **Customize colors**: Modify `presentation.page.scss` for your church's theme
3. **Deploy to device**: Follow "Building for Mobile" section
4. **Extend features**: Add auto-scroll, chord display, multi-language support

## File Upload Format (for bulk import)

Create a JSON file like this and import via Library page:

```json
[
  {
    "number": 1,
    "title": "O Come All Ye Faithful",
    "sections": [
      {
        "type": "verse",
        "label": "Verse 1",
        "text": "O come, all ye faithful..."
      },
      {
        "type": "chorus",
        "label": "Chorus",
        "text": "O come, let us adore Him..."
      }
    ]
  }
]
```

## Support & Questions

- **Ionic Docs**: https://ionicframework.com/docs
- **Angular Docs**: https://angular.io/docs
- **Capacitor**: https://capacitorjs.com/docs

---

**You're all set!** Run `npm start` and start using your hymn presenter app. 🎵


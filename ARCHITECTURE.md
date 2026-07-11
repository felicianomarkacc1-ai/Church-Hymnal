# 🎵 Hymn Presenter App — Architecture & Component Map

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYMN PRESENTER APP                           │
│                    (Ionic 7 + Angular 17)                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     ROUTING & NAVIGATION                         │
│                      (app.routes.ts)                             │
│  / → /library (default)                                          │
│  /library → Home page (hymn list)                                │
│  /editor → Add new hymn                                          │
│  /editor/:id → Edit hymn                                         │
│  /present/:id → Full-screen presentation ⭐                      │
│  /settings → App settings                                        │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      PAGES (View Layer)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   LIBRARY PAGE       │  │    PRESENTATION      │            │
│  │  (library/)          │  │    (presentation/)   │⭐ MAIN      │
│  │                      │  │                      │            │
│  │ • Hymn list          │  │ • Full-screen view   │            │
│  │ • Search bar         │  │ • Swipe navigation   │            │
│  │ • Play, Edit, Del    │  │ • Font size adjust   │            │
│  │ • Add button (FAB)   │  │ • Controls overlay   │            │
│  │ • Import/Export      │  │ • Slide counter      │            │
│  │ • Settings button    │  │                      │            │
│  └──────────────────────┘  └──────────────────────┘            │
│         ↓                            ↓                          │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │    EDITOR PAGE       │  │   SETTINGS PAGE      │            │
│  │   (editor/)          │  │   (settings/)        │            │
│  │                      │  │                      │            │
│  │ • Hymn number field  │  │ • Theme toggle       │            │
│  │ • Title field        │  │ • Font size slider   │            │
│  │ • Lyrics textarea    │  │ • Keep screen awake  │            │
│  │ • Parse help text    │  │ • Back button        │            │
│  │ • Save/Cancel        │  │                      │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         ↓↓↓
         ║ All pages import HymnStorageService
         ║
┌─────────────────────────────────────────────────────────────────┐
│               SERVICES (Business Logic Layer)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│        HymnStorageService (hymn-storage.service.ts)             │
│        ═══════════════════════════════════════════              │
│                                                                  │
│  Public Methods:                                                │
│  ├─ initialize()              → Load storage & data             │
│  ├─ addHymn(num, title, lyric)     → Create hymn              │
│  ├─ updateHymn(id, num, title, lyric) → Modify hymn           │
│  ├─ deleteHymn(id)            → Remove hymn                    │
│  ├─ getHymnById(id)            → Fetch by ID                   │
│  ├─ getHymnByNumber(number)    → Fetch by hymn number          │
│  ├─ search(query)              → Search by title/number        │
│  ├─ exportToJSON()             → Download backup               │
│  ├─ importFromJSON(json)       → Restore from backup           │
│  ├─ updateSettings(partial)    → Save app settings             │
│  ├─ seedSampleData()           → Load 5 default hymns          │
│  ├─ getHymnsSync()             → Get current hymns             │
│  └─ parseHymnText(text)        → Parse verses/chorus           │
│                                                                  │
│  Observable Streams (RxJS):                                     │
│  ├─ hymns$ : BehaviorSubject<Hymn[]>  → All hymns              │
│  └─ settings$ : BehaviorSubject<AppSettings> → Settings        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         ↓↓↓
         ║ Uses
         ║
┌─────────────────────────────────────────────────────────────────┐
│                  STORAGE & PERSISTENCE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Ionic Storage API (@ionic/storage-angular)                    │
│  ├─ Web Browser: IndexedDB                                     │
│  ├─ iOS: File System + SQLite (via Capacitor)                  │
│  └─ Android: Device Storage (via Capacitor)                    │
│                                                                  │
│  Data Keys:                                                     │
│  ├─ 'hymns'           → Array<Hymn>     (all hymns)            │
│  └─ 'app-settings'    → AppSettings     (preferences)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         ↓↓↓
         ║ Persisted on
         ║
┌─────────────────────────────────────────────────────────────────┐
│              LOCAL DEVICE / BROWSER STORAGE                     │
│  • IndexedDB (desktop browser)                                  │
│  • SQLite (iOS/Android via Capacitor)                           │
│  • Survives: app restart, device reboot, app updates           │
│  • Accessible: only when app is offline-capable                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model Hierarchy

```
AppState
├── Hymns[] (stored in IndexedDB)
│   └── Hymn (individual hymn)
│       ├── id: number (auto-generated, unique)
│       ├── number: number (hymn number, e.g., 132)
│       ├── title: string (hymn title, e.g., "Amazing Grace")
│       ├── sections: HymnSection[] (verses/chorus/bridge)
│       │   └── HymnSection
│       │       ├── type: 'verse' | 'chorus' | 'bridge'
│       │       ├── label: string (e.g., "Verse 1")
│       │       └── text: string (actual lyrics)
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
└── AppSettings (stored in IndexedDB)
    ├── id: 'app-settings' (constant key)
    ├── theme: 'dark' | 'light'
    ├── fontSize: 1-5 (scale)
    ├── keepScreenAwake: boolean
    └── lastPresentedHymnId?: number (optional)
```

---

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ START: User opens app                                           │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ├─→ HymnStorageService.initialize()
       │   └─→ Load hymns + settings from IndexedDB
       │   └─→ If empty, seed 5 sample hymns
       │
       ├─→ Route to /library (default)
       │
┌──────▼──────────────────────────────────────────────────────────┐
│ LIBRARY PAGE: Browse & Search Hymns                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ [Search Box]  Filter by title/number                            │
│              ↓ hymnStorage.search(query)                         │
│                                                                  │
│ Hymn List:                                                       │
│  1. No. 1 — O Come All Ye Faithful    [Play] [Edit] [Delete]  │
│  2. No. 132 — Amazing Grace           [Play] [Edit] [Delete]  │
│  3. No. 256 — It Is Well...           [Play] [Edit] [Delete]  │
│  [Add] [Settings] [Export] [Import]                             │
│                                                                  │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ├─→ Tap [Play] → navigate to /present/:id
       │   │
       │   ├─→ Load hymn by ID
       │   │
       │   └──▶ PRESENTATION MODE (see next section)
       │
       ├─→ Tap [Edit] → navigate to /editor/:id
       │   │
       │   ├─→ Load hymn, populate form
       │   │
       │   ├─→ User modifies lyrics
       │   │
       │   └─→ Save → hymnStorage.updateHymn()
       │
       ├─→ Tap [Delete] → hymnStorage.deleteHymn()
       │
       ├─→ Tap [Add] → navigate to /editor (no :id)
       │   │
       │   ├─→ Empty form
       │   │
       │   ├─→ User enters number, title, lyrics
       │   │
       │   └─→ Save → hymnStorage.addHymn()
       │
       ├─→ Tap [Settings] → navigate to /settings
       │   │
       │   ├─→ Change theme, font size, screen lock
       │   │
       │   └─→ hymnStorage.updateSettings()
       │
       ├─→ Tap [Export] → hymnStorage.exportToJSON()
       │   │
       │   └─→ Download hymns-backup.json to device
       │
       └─→ Tap [Import] → Select hymns-backup.json
           │
           └─→ hymnStorage.importFromJSON()
               └─→ Restore all hymns from backup
```

---

## Presentation Mode Deep Dive

```
┌────────────────────────────────────────────────────────────────┐
│         PRESENTATION MODE (/present/:id)                       │
│         Full-Screen, Black Background, Large Text              │
└───────┬────────────────────────────────────────────────────────┘
        │
        ├─→ Load hymn sections
        │   └─→ currentSectionIndex = 0
        │   └─→ Fetch first section (verse, chorus, etc.)
        │
        ├─→ Render full-screen view:
        │   ├─ Header: "Hymn No. 132 — Amazing Grace"
        │   ├─ Main: Large white text of current section
        │   └─ Footer: "1 / 4" (current / total sections)
        │
┌───────▼────────────────────────────────────────────────────────┐
│ User Interaction:                                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ INPUT:                  ACTION:                               │
│ ═════════════════════════════════════════════════════════════ │
│                                                                │
│ Swipe LEFT              currentSectionIndex++                │
│ (touchstart → touchend) nextSection()                        │
│                         Display next verse/chorus            │
│                         Update slide counter                 │
│                                                                │
│ ─────────────────────────────────────────────────────────────│
│                                                                │
│ Swipe RIGHT             currentSectionIndex--                │
│ (touchstart → touchend) previousSection()                    │
│                         Display prev verse/chorus            │
│                         Update slide counter                 │
│                                                                │
│ ─────────────────────────────────────────────────────────────│
│                                                                │
│ Tap LEFT SIDE           previousSection()                    │
│ (onLeftSideTap)         Same as swipe right                  │
│                                                                │
│ ─────────────────────────────────────────────────────────────│
│                                                                │
│ Tap RIGHT SIDE          nextSection()                        │
│ (onRightSideTap)        Same as swipe left                   │
│                                                                │
│ ─────────────────────────────────────────────────────────────│
│                                                                │
│ Tap SCREEN              toggleControls()                     │
│ (anywhere)              Show/hide control overlay            │
│                         If shown, auto-hide after 3s         │
│                                                                │
│ ─────────────────────────────────────────────────────────────│
│                                                                │
│ When Controls Visible:                                        │
│                                                                │
│  [Close ✕]  Top-right corner                                 │
│      │ exitPresentation() → navigate to /library             │
│                                                                │
│  [◀] [Font Control] [▶]  Middle row                          │
│   ↓       │        ↓                                           │
│   │    +/- / Slider    │                                      │
│   │    Update fontSize │                                      │
│   │    (1-5 scale)     │                                      │
│   prev                next                                    │
│   section             section                                │
│                                                                │
│  Hint: "Tap to toggle • Swipe to navigate"  Bottom           │
│                                                                │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Font Size Scaling:                                           │
├──────────────────────────────────────────────────────────────┤
│ fontSize = 1  →  20px   (very small)                        │
│ fontSize = 2  →  32px   (small)                             │
│ fontSize = 3  →  48px   (medium) ← DEFAULT                  │
│ fontSize = 4  →  64px   (large)                             │
│ fontSize = 5  →  80px   (extra large)                       │
│                                                               │
│ On mobile (< 768px):                                         │
│ fontSize = 1  →  16px                                        │
│ fontSize = 2  →  24px                                        │
│ fontSize = 3  →  32px                                        │
│ fontSize = 4  →  48px                                        │
│ fontSize = 5  →  64px                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Tree

```
AppComponent
│
└─ AppRouter outlet
   │
   ├─ LibraryPage (/)
   │  ├─ IonHeader
   │  ├─ IonSearchbar
   │  ├─ IonList
   │  │  └─ IonItem x N (for each hymn)
   │  └─ IonFab (add button)
   │
   ├─ EditorPage (/editor, /editor/:id)
   │  ├─ IonHeader
   │  ├─ IonItem (hymn number)
   │  ├─ IonItem (hymn title)
   │  ├─ IonItem (lyrics textarea)
   │  ├─ IonButton (save)
   │  └─ IonButton (cancel)
   │
   ├─ PresentationPage (/present/:id)
   │  ├─ IonContent
   │  ├─ .presentation-area
   │  │  ├─ .tap-zone (left)
   │  │  ├─ .tap-zone (right)
   │  │  ├─ .presentation-header
   │  │  ├─ .presentation-main (lyrics)
   │  │  ├─ .presentation-footer (counter)
   │  │  └─ .controls-overlay (on tap)
   │  │     ├─ Close button
   │  │     ├─ Prev button
   │  │     ├─ Font controls
   │  │     └─ Next button
   │  │
   │  └─ Touch event handlers
   │     ├─ (touchstart)
   │     └─ (touchend)
   │
   └─ SettingsPage (/settings)
      ├─ IonHeader
      ├─ IonItem (theme select)
      ├─ IonItem (font size range)
      ├─ IonItem (keep screen awake toggle)
      └─ IonButton (back)
```

---

## Service Methods Call Graph

```
HymnStorageService
│
├─ INITIALIZATION
│  ├─ initialize() ← Called once on app boot
│  │  └─ Calls: storage.create()
│  │  └─ Calls: loadHymns()
│  │  └─ Calls: loadSettings()
│  │
│  └─ seedSampleData() ← Fills DB on first launch
│     └─ Calls: addHymn() x 5
│
├─ READ
│  ├─ getHymnsSync() → Returns current hymns immediately
│  │
│  ├─ getHymnById(id) → Fetch by internal ID
│  │  └─ Used by: presentation page, editor page
│  │
│  ├─ getHymnByNumber(number) → Fetch by hymn number
│  │  └─ Used by: (for quick lookup)
│  │
│  └─ search(query) → Filter by title or number
│     └─ Used by: library page search
│
├─ CREATE
│  └─ addHymn(number, title, lyrics) → Create new hymn
│     └─ Calls: parseHymnText() to split into sections
│     └─ Calls: storage.set('hymns', updated)
│     └─ Calls: hymnsSubject.next() to notify subscribers
│     └─ Used by: editor page (new hymn)
│
├─ UPDATE
│  └─ updateHymn(id, number, title, lyrics) → Modify hymn
│     └─ Calls: parseHymnText()
│     └─ Calls: storage.set()
│     └─ Calls: hymnsSubject.next()
│     └─ Used by: editor page (edit existing)
│
├─ DELETE
│  └─ deleteHymn(id) → Remove hymn
│     └─ Calls: storage.set()
│     └─ Calls: hymnsSubject.next()
│     └─ Used by: library page
│
├─ IMPORT/EXPORT
│  ├─ exportToJSON() → Serialize hymns to JSON string
│  │  └─ Returns: JSON string ready for download
│  │  └─ Used by: library page export button
│  │
│  └─ importFromJSON(json) → Deserialize and load hymns
│     └─ Calls: JSON.parse()
│     └─ Calls: storage.set()
│     └─ Calls: hymnsSubject.next()
│     └─ Used by: library page import button
│
├─ PARSING
│  └─ parseHymnText(text) → Split lyrics into sections
│     └─ Detects: [Verse 1], [Chorus], [Bridge] tags
│     └─ Fallback: Split by blank lines
│     └─ Returns: Array<HymnSection>
│     └─ Used by: addHymn(), updateHymn()
│
└─ SETTINGS
   ├─ updateSettings(partial) → Save app preferences
   │  └─ Calls: storage.set('app-settings', merged)
   │  └─ Calls: settingsSubject.next()
   │  └─ Used by: settings page, presentation page
   │
   └─ Observables (RxJS)
      ├─ hymns$ → BehaviorSubject<Hymn[]>
      │  └─ Emits: whenever hymn list changes
      │  └─ Subscribed by: library page, (any hymn-dependent UI)
      │
      └─ settings$ → BehaviorSubject<AppSettings>
         └─ Emits: whenever settings change
         └─ Subscribed by: presentation page, settings page
```

---

## Presentation Swipe/Tap Logic

```
USER INPUT                              HANDLER
═══════════════════════════════════════════════════════════════

Touch Sequence:
  User touches screen
  │
  ├─→ @HostListener (touchstart)
  │   │
  │   └─→ onSwipe($event)
  │       └─ Store: touchStartX = $event.changedTouches[0].screenX
  │
  [User moves finger]
  │
  └─→ @HostListener (touchend)
      │
      ├─→ onSwipe($event)
      │   │
      │   ├─ Store: touchEndX = $event.changedTouches[0].screenX
      │   │
      │   ├─ Calculate: diff = touchStartX - touchEndX
      │   │
      │   └─ If abs(diff) > 50px (threshold):
      │       ├─ If diff > 0: SWIPE LEFT
      │       │  └─→ nextSection()
      │       │      └─ currentSectionIndex++
      │       │      └─ Re-render with next verse/chorus
      │       │
      │       └─ If diff < 0: SWIPE RIGHT
      │          └─→ previousSection()
      │             └─ currentSectionIndex--
      │             └─ Re-render with prev verse/chorus
      │
      └─ If abs(diff) < 50px: TAP ONLY
         └─→ Click on control (see below)


TAP ZONES:
         ┌─────────────────────────┐
         │                         │
         │     TAP RIGHT ZONE      │
         │    (50% right side)     │ ──→ nextSection()
         │                         │
   TAP   │     TAP LEFT ZONE       │    (same as swipe left)
   ANYWHERE
   ──→ toggleControls()
         │     (50% left side)     │
         │                         │ ──→ previousSection()
         │                         │
         │                         │    (same as swipe right)
         └─────────────────────────┘

CONTROL BUTTONS:
  [Close ✕]        → exitPresentation()
  [◀ Previous]     → previousSection()
  [▶ Next]         → nextSection()
  [+/- Font Size]  → increaseFontSize() / decreaseFontSize()
  [Slider]         → onFontSizeChange($event)
```

---

## Storage Persistence Flow

```
APP STARTUP
     │
     ├─→ HymnStorageService.initialize()
     │   │
     │   ├─→ storage.create()  [Initialize Ionic Storage]
     │   │
     │   └─→ loadHymns()
     │       │
     │       ├─→ storage.get('hymns')
     │       │   │
     │       │   └─ Check IndexedDB for hymns key
     │       │
     │       └─→ If found: hymnsSubject.next(hymns)
     │           If empty: hymnsSubject.next([])
     │
     └─→ loadSettings()
         │
         ├─→ storage.get('app-settings')
         │   │
         │   └─ Check IndexedDB for settings key
         │
         └─→ If found: settingsSubject.next(settings)
             If not found: use defaults


WHEN USER ADDS HYMN:
     │
     ├─→ EditorPage: user clicks "Save"
     │
     ├─→ HymnStorageService.addHymn()
     │   │
     │   ├─→ Generate new ID
     │   ├─→ Parse lyrics into sections
     │   ├─→ Create Hymn object
     │   │
     │   ├─→ Add to array: hymns.push(newHymn)
     │   │
     │   ├─→ Sort by hymn number
     │   │
     │   ├─→ storage.set('hymns', updatedArray)  ← PERSIST
     │   │   │
     │   │   └─ Save to IndexedDB
     │   │
     │   └─→ hymnsSubject.next(updatedArray)  ← NOTIFY
     │       │
     │       └─ All subscribers (library page) receive update


WHEN USER EXPORTS:
     │
     ├─→ HymnStorageService.exportToJSON()
     │   │
     │   ├─→ Serialize hymns: JSON.stringify(hymns)
     │   │
     │   └─→ Return JSON string
     │
     └─→ LibraryPage: Download as hymns-backup.json
         │
         └─ File saved to device/browser downloads folder


WHEN USER IMPORTS:
     │
     ├─→ File selected: hymns-backup.json
     │
     ├─→ HymnStorageService.importFromJSON(jsonText)
     │   │
     │   ├─→ JSON.parse(jsonText)
     │   │
     │   ├─→ Assign new IDs to imported hymns
     │   │
     │   ├─→ Merge with existing hymns
     │   │
     │   ├─→ storage.set('hymns', merged)  ← PERSIST
     │   │
     │   └─→ hymnsSubject.next(merged)  ← NOTIFY
     │
     └─→ All hymns now available in library


APP BACKGROUND / CLOSE:
     │
     └─→ IndexedDB persists automatically
         (data survives app restart, device reboot)


APP RESTART:
     │
     └─→ initialize() called again
         │
         ├─→ Load hymns from IndexedDB  ← Previously saved data
         │
         └─→ Load settings from IndexedDB
```

---

## Key Components Interaction

```
LIBRARY PAGE ←─ HymnStorageService
     │               │
     ├─ hymns$ observable subscription
     │                                      ┌─────────────────┐
     ├─ search(query)                       │   IndexedDB     │
     │  ├─ When user types in search box    │   ═════════════ │
     │  └─ Filters: hymn.title or number    │ Key: 'hymns'    │
     │                                      │ Value: Hymn[]   │
     ├─ addHymn() ← When user saves        │                 │
     │  └─ Routes to editor page            └────────┬────────┘
     │                                                │
     ├─ updateHymn() ← Editor page save               │
     │  └─ Sorts hymns by number again              │
     │                                                │
     └─ deleteHymn() ← User deletes item             │
        └─ Removes from IndexedDB                    │
                                                      │
PRESENTATION PAGE ←─ Settings$ observable            │
     │                                                │
     ├─ Subscribes to settings$                      │
     │  ├─ fontSize changes                          │
     │  ├─ theme changes                             │
     │  └─ keepScreenAwake changes                   │
     │                                                │
     └─ Calls updateSettings() on change             │
        └─ Persists to IndexedDB ─────────────────────
```

---

## Testing Scenarios

```
✅ FEATURE TEST MATRIX

Feature                  Test Case                Result
═══════════════════════════════════════════════════════════════

Library Page
  Browse                 Open app                 5 hymns visible
  Search                 Type "Amazing"           Filtered to 1 hymn
  Play                   Click play icon          Presentation opens
  Edit                   Click pencil             Editor loads hymn
  Delete                 Click trash              Hymn removed
  Add                    Click + button           Editor (empty form)
  Export                 Click export             hymns-backup.json
  Import                 Click import, select     Hymns loaded

Presentation Mode
  Swipe Left             Drag left 100px          Next section
  Swipe Right            Drag right 100px         Prev section
  Tap Left               Click left side          Prev section
  Tap Right              Click right side         Next section
  Tap Screen             Tap anywhere             Controls toggle
  Font +                 Click + button           Font size ++
  Font -                 Click - button           Font size --
  Font Slider            Move slider              Font updates live
  Exit                   Click close              Back to library
  Auto-hide              Tap once, wait 3s        Controls disappear
  Counter                Look at footer           Shows "N / Total"
  Navigation             Swipe multiple           All sections visible

Editor Page
  New Hymn               Click + button           Empty form
  Edit Hymn              Click pencil             Form populated
  Parse Tags             Paste with [Verse 1]    Parsed correctly
  Parse Blanks           Paste separated by gaps  Split into sections
  Save                   Click save               Hymn in library
  Cancel                 Click cancel             Back to library

Settings Page
  Theme Dark             Select dark              Colors change
  Theme Light            Select light             Colors change
  Font Size              Move slider              Default changes
  Keep Awake             Toggle                   Setting persists

Data Persistence
  Refresh                Browser F5               Data survives
  Close App              Close browser            Data persists
  Import                 Import JSON              Data loads
  Export                 Export JSON              Can re-import
  Merge                  Import while data       All hymns present
                         exists
```

---

## Performance Notes

- **Initial Load**: ~100ms (load hymns + settings from IndexedDB)
- **Search**: ~5ms (JavaScript array filter)
- **Navigation**: Instant (route change, no network call)
- **Storage Size**: ~100KB for 1000 hymns (text-based)
- **Memory**: ~1-2 MB (small hymn database)
- **Battery**: Very efficient (no network, minimal GPU)

---

## Security & Privacy

✅ **No Internet**: 100% offline, no data leaves device  
✅ **No Cloud**: Data stored locally only  
✅ **No Auth**: No login/password needed  
✅ **No Tracking**: No analytics, no ads  
✅ **GDPR Compliant**: No personal data collection  
✅ **Open Source Ready**: All code visible, auditable  

---

*Architecture Document — Hymn Presenter App*  
*Last Updated: July 10, 2026*

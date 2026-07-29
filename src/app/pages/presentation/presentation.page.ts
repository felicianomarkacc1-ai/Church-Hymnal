import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  chevronForward,
  arrowBack,
  removeOutline,
  addOutline,
} from 'ionicons/icons';
import { HymnStorageService } from '../../services/hymn-storage.service';
import { Hymn, HymnSection, AppSettings } from '../../models/hymn.model';

@Component({
  selector: 'app-presentation',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon],
  templateUrl: './presentation.page.html',
  styleUrls: ['./presentation.page.scss'],
})
export class PresentationPage implements OnInit, OnDestroy {
  hymn: Hymn | undefined = undefined;
  currentSectionIndex = 0;
  settings: AppSettings | null = null;
  touchStartX = 0;
  touchEndX = 0;
  fontSize = 3; // Scale 1-5

  private stateStorageKey = 'hymn-presenter-state';
  private currentHymnId: number | null = null;

  get quickJumpLabels(): string[] {
    if (!this.hymn) {
      return [];
    }

    const seen = new Set<string>();
    return this.hymn.sections
      .map((section) => section.label?.trim())
      .filter((label): label is string => Boolean(label))
      .filter((label) => {
        if (seen.has(label)) {
          return false;
        }
        seen.add(label);
        return true;
      });
  }

  constructor(
    private hymnStorage: HymnStorageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({
      chevronBack,
      chevronForward,
      arrowBack,
      removeOutline,
      addOutline,
    });
  }

  async ngOnInit() {
    await this.hymnStorage.initialize();

    // Subscribe to settings
    this.hymnStorage.settings$.subscribe((settings) => {
      this.settings = settings;
      this.fontSize = settings.fontSize || 3;
      this.applyScreenSettings();
    });

    // Load hymn from route parameter
    this.route.params.subscribe(async (params) => {
      if (params['id']) {
        this.currentHymnId = +params['id'];
        this.hymn = await this.hymnStorage.getHymnById(this.currentHymnId);
        this.restorePresenterState();
        this.currentSectionIndex = this.currentSectionIndex ?? 0;
        this.persistPresenterState();
      }
    });
  }

  ngOnDestroy() {
    // Nothing special to clean up for the hymnal view.
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const interactiveElement = target?.tagName;

    if (
      interactiveElement === 'INPUT' ||
      interactiveElement === 'TEXTAREA' ||
      interactiveElement === 'SELECT' ||
      interactiveElement === 'BUTTON'
    ) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.nextSection();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.previousSection();
    }
  }

  /**
   * Get current section being displayed
   */
  getCurrentSection(): HymnSection | null {
    if (!this.hymn || this.currentSectionIndex >= this.hymn.sections.length) {
      return null;
    }
    return this.hymn.sections[this.currentSectionIndex];
  }

  // Projector and duplicate screen support removed to keep the page a simple hymnal.

  getNextSection(): HymnSection | null {
    if (!this.hymn || this.currentSectionIndex >= this.hymn.sections.length - 1) {
      return null;
    }

    return this.hymn.sections[this.currentSectionIndex + 1];
  }

  /**
   * Go to next section.
   */
  nextSection() {
    if (this.hymn && this.currentSectionIndex < this.hymn.sections.length - 1) {
      this.currentSectionIndex++;
      this.persistPresenterState();
    }
  }

  /**
   * Go to previous section
   */
  previousSection() {
    if (this.currentSectionIndex > 0) {
      this.currentSectionIndex--;
      this.persistPresenterState();
    }
  }

  /**
   * Jump directly to a section by index (clamped to valid range).
   */
  jumpToSection(index: number) {
    if (!this.hymn) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(index, this.hymn.sections.length - 1));
    this.currentSectionIndex = clampedIndex;
    this.persistPresenterState();
  }

  /**
   * Jump to the first section whose label contains the given text
   * (case-insensitive). Used by the quick-jump chips.
   */
  jumpToLabel(label: string) {
    if (!this.hymn) {
      return;
    }

    const normalized = label.toLowerCase();
    const targetIndex = this.hymn.sections.findIndex((section) =>
      section.label?.toLowerCase().includes(normalized)
    );

    if (targetIndex !== -1) {
      this.jumpToSection(targetIndex);
    }
  }

  /**
   * Whether the current hymn has a section matching the given label.
   * Used to only render quick-jump chips that are actually usable.
   */
  hasSectionLabel(label: string): boolean {
    if (!this.hymn) {
      return false;
    }

    return this.quickJumpLabels.includes(label);
  }

  /**
   * Handle a tap on the stage area. Only side-region taps navigate.
   * Interactive controls are excluded so buttons remain usable.
   */
  onStageTap(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (
      target.closest('ion-button, button, .quick-jump-chip, .nav-btn, ion-icon, .presentation-header, .presentation-footer')
    ) {
      return;
    }

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const edgeWidth = rect.width * 0.28;

    if (x <= edgeWidth) {
      this.previousSection();
    } else if (x >= rect.width - edgeWidth) {
      this.nextSection();
    }
  }

  /**
   * Handle swipe gestures
   */
  onSwipe(event: TouchEvent) {
    if (event.type === 'touchstart') {
      this.touchStartX = event.changedTouches[0].screenX;
    } else if (event.type === 'touchend') {
      this.touchEndX = event.changedTouches[0].screenX;
      this.handleSwipe();
    }
  }

  private handleSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left → next
        this.nextSection();
      } else {
        // Swiped right → previous
        this.previousSection();
      }
    }
  }

  /**
   * Toggle controls visibility. Tapping the center of the stage (outside
   * the left/right nav zones) calls this.
   */

  /**
   * Increase font size
   */
  increaseFontSize() {
    if (this.fontSize < 5) {
      this.fontSize++;
      this.hymnStorage.updateSettings({ fontSize: this.fontSize });
      this.persistPresenterState();
    }
  }

  /**
   * Decrease font size
   */
  decreaseFontSize() {
    if (this.fontSize > 1) {
      this.fontSize--;
      this.hymnStorage.updateSettings({ fontSize: this.fontSize });
      this.persistPresenterState();
    }
  }

  /**
   * Change font size via slider
   */
  onFontSizeChange(event: CustomEvent) {
    this.fontSize = event.detail.value;
    this.hymnStorage.updateSettings({ fontSize: this.fontSize });
    this.persistPresenterState();
  }

  /**
   * Get font size in pixels
   */
  getFontSizeClass(): string {
    const sizeMap: { [key: number]: string } = {
      1: 'font-xs',
      2: 'font-sm',
      3: 'font-md',
      4: 'font-lg',
      5: 'font-xl',
    };
    return sizeMap[this.fontSize] || 'font-md';
  }

  /**
   * Apply screen settings (keep awake, theme)
   */
  private applyScreenSettings() {
    if (this.settings?.keepScreenAwake) {
      // Could use Capacitor ScreenBrightness plugin here
      // For now, just a placeholder
    }
  }

  /**
   * Get slide counter text
   */
  getSlideCounter(): string {
    return `${this.currentSectionIndex + 1} / ${
      this.hymn?.sections.length || 0
    }`;
  }

  /**
   * Exit presentation and return to library
   */
  exitPresentation() {
    this.router.navigate(['/library']);
  }

  private restorePresenterState() {
    try {
      const savedState = localStorage.getItem(this.stateStorageKey);
      if (!savedState) {
        return;
      }

      const parsedState = JSON.parse(savedState);
      if (parsedState.hymnId === this.currentHymnId) {
        this.currentSectionIndex = parsedState.currentSectionIndex ?? 0;
        this.fontSize = parsedState.fontSize ?? this.fontSize;
      }
    } catch (error) {
      console.warn('Unable to restore presenter state', error);
    }
  }

  private persistPresenterState() {
    if (!this.currentHymnId) {
      return;
    }

    const state = {
      hymnId: this.currentHymnId,
      currentSectionIndex: this.currentSectionIndex,
      fontSize: this.fontSize,
    };

    localStorage.setItem(this.stateStorageKey, JSON.stringify(state));
  }

  /**
   * Get section label for display
   */
  getSectionLabel(): string {
    const section = this.getCurrentSection();
    return section?.label || `Section ${this.currentSectionIndex + 1}`;
  }
}
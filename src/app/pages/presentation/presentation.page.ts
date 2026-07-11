import { Component, OnInit } from '@angular/core';
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
  close,
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
export class PresentationPage implements OnInit {
  hymn: Hymn | undefined = undefined;
  currentSectionIndex = 0;
  settings: AppSettings | null = null;
  touchStartX = 0;
  touchEndX = 0;
  fontSize = 3; // Scale 1-5

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
      close,
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
        this.hymn = await this.hymnStorage.getHymnById(+params['id']);
        this.currentSectionIndex = 0;
      }
    });
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

  /**
   * Go to next section.
   */
  nextSection() {
    if (this.hymn && this.currentSectionIndex < this.hymn.sections.length - 1) {
      this.currentSectionIndex++;
    }
  }

  /**
   * Go to previous section
   */
  previousSection() {
    if (this.currentSectionIndex > 0) {
      this.currentSectionIndex--;
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
   * Handle left side tap (previous). Stops propagation so it doesn't also
   * bubble up to the background tap handler and toggle the controls overlay.
   */
  onLeftSideTap(event: Event) {
    event.stopPropagation();
    this.previousSection();
  }

  /**
   * Handle right side tap (next)
   */
  onRightSideTap(event: Event) {
    event.stopPropagation();
    this.nextSection();
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
    }
  }

  /**
   * Decrease font size
   */
  decreaseFontSize() {
    if (this.fontSize > 1) {
      this.fontSize--;
      this.hymnStorage.updateSettings({ fontSize: this.fontSize });
    }
  }

  /**
   * Change font size via slider
   */
  onFontSizeChange(event: CustomEvent) {
    this.fontSize = event.detail.value;
    this.hymnStorage.updateSettings({ fontSize: this.fontSize });
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

  /**
   * Get section label for display
   */
  getSectionLabel(): string {
    const section = this.getCurrentSection();
    return section?.label || `Section ${this.currentSectionIndex + 1}`;
  }
}
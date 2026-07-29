import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  pencil,
  trash,
  settings,
  download,
  cloudUpload,
} from 'ionicons/icons';
import { HymnStorageService } from '../../services/hymn-storage.service';
import { Hymn } from '../../models/hymn.model';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonButtons,
  ],
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
})
export class LibraryPage implements OnInit {
  hymns: Hymn[] = [];
  filteredHymns: Hymn[] = [];
  searchQuery = '';
  selectedLanguage: 'english' | 'tagalog' = 'english';

  constructor(
    private hymnStorage: HymnStorageService,
    private router: Router
  ) {
    addIcons({
      add,
      pencil,
      trash,
      settings,
      download,
      cloudUpload,
    });
  }

  async ngOnInit() {
    await this.hymnStorage.initialize();

    // Subscribe to hymns
    this.hymnStorage.hymns$.subscribe((hymns) => {
      this.hymns = hymns;
      this.filterHymns();
    });
  }

  private isEnglishHymn(hymn: Hymn): boolean {
    return hymn.language === 'english' || hymn.language === undefined;
  }

  filterHymns() {
    const hasQuery = this.searchQuery.trim();
    const matching = hasQuery
      ? this.hymnStorage.search(this.searchQuery)
      : this.hymns;

    this.filteredHymns = matching.filter((h) => {
      if (this.selectedLanguage === 'english') {
        return this.isEnglishHymn(h);
      }
      return h.language === 'tagalog';
    });
  }

  setLanguage(language: 'english' | 'tagalog') {
    this.selectedLanguage = language;
    this.filterHymns();
  }


  onSearchChange(event: CustomEvent) {
    this.searchQuery = (event.detail?.value ?? '') as string;
    this.filterHymns();
  }

  async deleteHymn(id: number) {
    if (confirm('Delete this hymn?')) {
      await this.hymnStorage.deleteHymn(id);
    }
  }

  editHymn(id: number) {
    this.router.navigate(['/editor', id]);
  }

  goToTranspose() {
    this.router.navigate(['/transpose']);
  }

  presentHymn(id: number) {
    this.router.navigate(['/present', id]);
  }

  addNewHymn() {
    this.router.navigate(['/editor']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  exportHymns() {
    const json = this.hymnStorage.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hymns-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private getNextHymnNumber(): number {
    if (!this.hymns.length) {
      return 1;
    }
    return Math.max(...this.hymns.map((h) => h.number)) + 1;
  }

  async importHymns() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        try {
          if (file.name.toLowerCase().endsWith('.json')) {
            await this.hymnStorage.importFromJSON(text);
            alert('Hymns imported successfully!');
          } else if (file.name.toLowerCase().endsWith('.txt')) {
            const fileName = file.name.replace(/\.txt$/i, '').trim();
            const title = fileName || `Imported hymn ${this.getNextHymnNumber()}`;
            const number = this.getNextHymnNumber();
            await this.hymnStorage.addHymn(number, title, text, 'english');
            alert(`Imported hymn "${title}" successfully.`);
          } else {
            alert('Please select a .json or .txt file.');
          }
        } catch (error) {
          console.error(error);
          alert('Failed to import hymns');
        }
      }
    };
    input.click();
  }
}
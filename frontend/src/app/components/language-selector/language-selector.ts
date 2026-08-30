import { Component, inject, PLATFORM_ID, signal, HostListener, ElementRef } from '@angular/core';
import { isPlatformBrowser, UpperCasePipe } from '@angular/common';

export interface LanguageType {
  value: string;
  name: string;
}

const SUPPORTED_LANGUAGES: LanguageType[] = [
  { value: 'it', name: '🇮🇹 Italiano' },
  { value: 'en', name: '🇬🇧 English' },
  { value: 'es', name: '🇪🇸 Español' },
  { value: 'fr', name: '🇫🇷 Français' },
  { value: 'de', name: '🇩🇪 Deutsch' },
  { value: 'pt', name: '🇵🇹 Português' },
];

// Lingua originale del sito: è quella da cui Google Translate parte per tradurre
const SOURCE_LANG = 'it';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './language-selector.html',
  styleUrl: './language-selector.css',
})
export class LanguageSelector {
  private platformId = inject(PLATFORM_ID);
  private elementRef = inject(ElementRef);

  readonly languages = SUPPORTED_LANGUAGES;

  isOpen = signal(false);
  currentLang = signal<string>(SOURCE_LANG);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Legge il cookie di Google per capire in che lingua siamo già
      const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
      if (match && match[2]) {
        const parts = match[2].split('/'); // es. "" "it" "en" -> ['', 'it', 'en']
        const target = parts[2];
        if (target && this.languages.some((l) => l.value === target)) {
          this.currentLang.set(target);
        }
      }
    }
  }

  toggleDropdown() {
    this.isOpen.update((open) => !open);
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  // Chiude il menu se si clicca fuori dal componente
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  selectLanguage(lang: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    if (lang === this.currentLang()) {
      this.closeDropdown();
      return;
    }

    if (lang === SOURCE_LANG) {
      // Torna alla lingua originale: rimuove il cookie di traduzione
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${location.hostname}; path=/;`;
    } else {
      document.cookie = `googtrans=/${SOURCE_LANG}/${lang}; path=/;`;
      document.cookie = `googtrans=/${SOURCE_LANG}/${lang}; domain=${location.hostname}; path=/;`;
    }

    document.body.classList.remove('page-ready');
    setTimeout(() => window.location.reload(), 1000);
  }
}

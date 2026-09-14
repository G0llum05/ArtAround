import { Component, inject, PLATFORM_ID, signal, HostListener, ElementRef } from '@angular/core';
import { isPlatformBrowser, UpperCasePipe } from '@angular/common';

export interface LanguageType {
  value: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: LanguageType[] = [
  { value: 'it', name: '🇮🇹 Italiano' },
  { value: 'en', name: '🇬🇧 English' },
  { value: 'es', name: '🇪🇸 Español' },
  { value: 'fr', name: '🇫🇷 Français' },
  { value: 'de', name: '🇩🇪 Deutsch' },
  { value: 'pt', name: '🇵🇹 Português' },
];

export function getActiveLanguage(): string {
  const supported = ['it', 'en', 'es', 'fr', 'de', 'pt'];
  if (typeof document !== 'undefined') {
    try {
      const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
      if (match && match[2]) {
        const parts = match[2].split('/');
        const target = parts[2] ? parts[2].toLowerCase() : '';
        if (supported.includes(target)) {
          return target;
        }
      }
    } catch (e) {}

    try {
      const htmlLang = (document.documentElement.lang || '').toLowerCase().slice(0, 2);
      if (supported.includes(htmlLang)) {
        return htmlLang;
      }
    } catch (e) {}
  }
  return 'it';
}

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
      this.currentLang.set(getActiveLanguage());
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

  private hasGoogleTranslateCookie(): boolean {
    return document.cookie
      .split(';')
      .some((item) => {
        const name = item.split('=')[0].trim();
        return name.toLowerCase().includes('googtrans');
      });
  }

  private deleteGoogleTranslateCookie() {
    const cookieNames = ['googtrans'];
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      if (name.toLowerCase().includes('googtrans') && !cookieNames.includes(name)) {
        cookieNames.push(name);
      }
    }

    const host = window.location.hostname;
    const hostParts = host.split('.');
    const domains: string[] = ['', host, `.${host}`];

    // Se l'host ha sottodomini (es. site252623.tw.cs.unibo.it), include anche i domini superiori
    for (let i = 0; i < hostParts.length - 1; i++) {
      const d = hostParts.slice(i).join('.');
      domains.push(d);
      domains.push(`.${d}`);
    }

    const paths = ['/', ''];

    for (const name of cookieNames) {
      for (const domain of domains) {
        for (const path of paths) {
          const domainAttr = domain ? `domain=${domain};` : '';
          const pathAttr = path ? `path=${path};` : '';
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; ${pathAttr} ${domainAttr}`;
        }
      }
    }
  }

  selectLanguage(lang: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    if (lang === this.currentLang()) {
      this.closeDropdown();
      return;
    }

    // Se è già presente un cookie del tipo Google Translate, viene eliminato
    if (this.hasGoogleTranslateCookie()) {
      this.deleteGoogleTranslateCookie();
    }

    if (lang === SOURCE_LANG) {
      // Torna alla lingua originale: assicura la completa rimozione del cookie
      this.deleteGoogleTranslateCookie();
      this.currentLang.set(SOURCE_LANG);
    } else {
      document.cookie = `googtrans=/${SOURCE_LANG}/${lang}; path=/;`;
      document.cookie = `googtrans=/${SOURCE_LANG}/${lang}; domain=${location.hostname}; path=/;`;
      this.currentLang.set(lang);
    }

    this.closeDropdown();
    document.body.classList.remove('page-ready');
    setTimeout(() => window.location.reload(), 1000);
  }
}

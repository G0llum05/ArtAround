import { Component, input, output, signal, computed, HostListener, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MuseumHomePresentationResponse } from '../../models/museum.model';

@Component({
  selector: 'app-input-field-search-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-field-search-text.html',
  styleUrl: './input-field-search-text.css'
})
export class InputFieldSearchText {
  private elementRef = inject(ElementRef);

  museums = input.required<MuseumHomePresentationResponse[]>();
  selectedMuseumId = input<string | null>(null);

  museumSelected = output<string>();
  cleared = output<void>();

  isDropdownOpen = signal<boolean>(false);
  searchTerm = signal<string>('');

  // RICERCA AVANZATA PAROLE
  filteredMuseums = computed(() => {
    // Normalizziamo il testo: toglie gli accenti e converte tutto in minuscolo
    const normalize = (str: string) =>
      str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); //replace sostituisce tutti gli accenti o simboli grafici generici "smontati da normalize (ad esempio è diventa e + `)

    const term = normalize(this.searchTerm().trim());
    if (!term) return [...this.museums()].sort((a, b) => a.name.localeCompare(b.name));

    // Divido la ricerca in singole parole (es. "arte roma" -> ["arte", "roma"])
    const searchWords = term.split(/\s+/);

    const filtered = [...this.museums()].filter(museum => {
      const normalizedName = normalize(museum.name);
      // Il museo è valido solo se TUTTE le parole cercate sono contenute nel nome
      return searchWords.every(word => normalizedName.includes(word));
    });

    // Ordiniamo in ordine alfabetico e restituiamo TUTTI i risultati (niente più .slice)
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  });

  displayValue = computed(() => {
    const selectedId = this.selectedMuseumId();
    const found = this.museums().find(m => m.id === selectedId);
    return found ? found.name : this.searchTerm();
  });

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.isDropdownOpen.set(true);
    if (!value) {
      this.cleared.emit();
    }
  }

  clearSearch(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.searchTerm.set('');
    this.isDropdownOpen.set(true);
    this.cleared.emit();
  }

  selectMuseum(museum: MuseumHomePresentationResponse): void {
    this.searchTerm.set(museum.name);
    this.isDropdownOpen.set(false);
    this.museumSelected.emit(museum.id);
  }

  // 2. AUTOCOMPLETAMENTO CON IL TASTO TAB
  onKeyDown(event: KeyboardEvent): void {
    // Se premo Tab, la tendina è aperta e ci sono risultati disponibili
    const tabPressed = event.key === 'Tab' && this.isDropdownOpen();
    const enterPressed = event.key === 'Enter' && this.isDropdownOpen();
    if ((tabPressed || enterPressed) && this.filteredMuseums().length > 0) {
      event.preventDefault(); // Blocca il comportamento di default del Tab (non cambia input)
      this.selectMuseum(this.filteredMuseums()[0]); // Seleziona il primo elemento della lista
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }
}

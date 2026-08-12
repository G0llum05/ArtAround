import { Component, model, output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserNavigatorSettings, ToneType} from '../../models/appModel/userNavigatorSettings';

interface LanguageType{
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

@Component({
  selector: 'app-navigator-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navigator-settings.html',
  styleUrl: './navigator-settings.css'
})
export class NavigatorSettings{
  //two-way binding figlio padre
  tone = model<ToneType>('adulto');
  language = model<string>('it');
  duration = model<number>(30);

  // Unico output per chiedere al padre di nascondere la modale
  closeSettings = output<void>();
  supportedLanguages: LanguageType[] = SUPPORTED_LANGUAGES;

  // Aggiornano direttamente il model (e quindi il Navigator simultaneamente)
  setTone(newTone: ToneType) {
    this.tone.set(newTone);
  }

  setDuration(newDuration: number) {
    this.duration.set(newDuration);
  }

  close() {
    this.closeSettings.emit();
  }

  protected readonly SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
}

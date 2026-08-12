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
  settings = model<UserNavigatorSettings>({
    tone: 'adulto',
    language: 'en',
    duration: 30
  });

  // Unico output per chiedere al padre di nascondere la modale
  closeSettings = output<void>();

  // Aggiornano direttamente il model (e quindi il Navigator simultaneamente)
  setTone(newTone: ToneType) {
    this.settings.update(current => ({
      ...current,
      tone: newTone
      })
    );
  }

  setDuration(newDuration: number) {
    this.settings.update(current => ({
        ...current,
        duration: newDuration
      })
    );
  }

  setLanguage(newLanguage: string) {
    this.settings.update(current => ({
      ...current,
      language: newLanguage
    }))
  }

  close() {
    this.closeSettings.emit();
  }

  readonly supportedLanguages = SUPPORTED_LANGUAGES;
}

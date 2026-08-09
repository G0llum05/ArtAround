import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { delay, of } from 'rxjs';

export interface Tour {
  id: string;
  titolo: string;
  immagine: string;
  costo: number;
  postiDisponibili: number;
  postiTotali: number;
  durata: number;
  accessibile: boolean;
  gratuito: boolean;
  ufficiale: boolean;
  interessi: string[];  // es. ['Pittura', 'Rinascimento']
}

@Component({
  selector: 'app-visit-customization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './visit.html',
  styleUrl: './visit.css'
})
export class Visit implements OnInit {
  formVisit!: FormGroup; // il ! è Non-Null Assertion Operator (Operatore di asserzione non nulla)
  interestsList = signal<string[]>([]);
  partialInterestsList = signal<string[]>([]); // Quando qualcuno ha selezionato degli interessi ma torna a selezionare "qualsiasi" salvo le preferenze
  currentDuration = signal<string>('2h');

  fb = inject(FormBuilder);

  ngOnInit(): void {
    // Inizializzazione Form (valori di default)
    this.formVisit = this.fb.group({
      museo: ['', Validators.required],
      chiSei: ['Adulto'],
      interessi: [[]],
      durata: [2],
      accessibile: [false],
      gratuito: [false]
    });

    // Seleziono il campo museo tramite get(con ?, ovvero Safe Call Operator/Optional Chaining), values changes è un observable a cui ci si iscrive
    this.formVisit.get('museo')?.valueChanges.subscribe(museoSelezionato => {

      //Salvo gli interessi attualmente selezionati
      const oldInterest = this.formVisit.get('interessi')?.value || [];
      const oldPartialInterest = this.partialInterestsList();
      //Interessi totali uso set per evitare ripetizioni
      const totalInterest = Array.from(new Set([...oldInterest, ...oldPartialInterest]));
      this.partialInterestsList.set(totalInterest);

      this.formVisit.patchValue({ interessi:  []}); // Resetta al cambio museo (patchValue permette di cambiare un solo campo)
      this.caricaInteressiDaServer(museoSelezionato);
    });

    this.formVisit.get('durata')?.valueChanges.subscribe(duration => {
      let durationFormated: string = Math.floor(duration).toString() + 'h ';
      if(duration - Math.trunc(duration)==0.5){
        durationFormated += '30m';
      }
      if(duration===8){
        durationFormated += '+';
      }
      this.currentDuration.set(durationFormated);
    })
  }

  private caricaInteressiDaServer(museoId: string): void {
    const mockDatabase: any = {
      'uffizi': ['Rinascimento', 'Pittura', 'Scultura', 'Storia', 'Architettura'],
      'louvre': ['Antichità', 'Pittura', 'Scultura Francese', 'Gioielli storici']
    };

    //rende la risposta un observable
    of(mockDatabase[museoId])
      .pipe(delay(200))
      .subscribe((risposta: string[]) => {
      const nuoviInteressi: string[] = risposta ? risposta : [];

      // Aggiorno la lista visibile
      this.interestsList.set(nuoviInteressi);
      // Aggiorno la lista degli interessi parziali
      this.partialInterestsList.update(parziali =>
          parziali.filter(interesse => nuoviInteressi.includes(interesse))
      );
    });
  }


  // LOGICA BOTTONI CUSTOM
  setRuolo(ruolo: string): void {
    this.formVisit.patchValue({ chiSei: ruolo });
  }

  toggleInteresse(interest: string): void {
    const current: string[] = this.formVisit.get('interessi')?.value || [];
    if (interest === 'Qualsiasi') {
      if(current.length != 0){
        this.partialInterestsList.set(this.formVisit.get('interessi')?.value);
      }
      this.formVisit.patchValue({ interessi: [] });
      return;
    }

    const index = current.indexOf(interest);

    if (index > -1) {
      this.formVisit.patchValue({ interessi: [...this.partialInterestsList(), ...current.filter(i => i !== interest)] });
    } else {
      this.formVisit.patchValue({ interessi: [...current, ...this.partialInterestsList(), interest] });
    }
    this.partialInterestsList.set([]);
  }

  get isInterestDefault() { return this.formVisit.get('interessi')?.value.length === 0; }
}

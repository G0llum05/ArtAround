import { Component, OnInit, inject, signal, Signal, computed, DestroyRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { delay, of } from 'rxjs';
import { CardGrid } from '../../components/card-grid/card-grid';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; //per la disiscrizione dagli observable

import { VisitService } from '../../services/visit.service';
import { MuseumService } from '../../services/museum.service';

import { MuseumHomePresentationResponse, MuseumResponse } from '../../models/museum.model';
import { InputFieldSearchText } from '../../components/input-field-search-text/input-field-search-text';
import { VisitHomePresentationResponse, VisitResponse } from '../../models/visit.model';
import { VisitCard } from '../../components/visit-card/visit-card';

@Component({
  selector: 'app-visit-customization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardGrid, InputFieldSearchText, VisitCard],
  templateUrl: './visit.html',
  styleUrl: './visit.css'
})
export class Visit implements OnInit {
  fb = inject(FormBuilder);
  visitService = inject(VisitService);
  museumService = inject(MuseumService);
  destroyRef = inject(DestroyRef);  //permette di usare takeUntilDestroy che elimina tutti gli observable quando il componete viene distrutto

  private readonly STORAGE_KEY = 'visit_form' as const;

  formVisit!: FormGroup; // il ! è Non-Null Assertion Operator (Operatore di asserzione non nulla)

  interestsList = signal<string[]>([]);
  partialInterestsList = signal<string[]>([]); // Quando qualcuno ha selezionato degli interessi ma torna a selezionare "qualsiasi" salvo le preferenze
  currentDuration = signal<string>('2h');

  //Risultati della visita
  //museum
  museumList: Signal<MuseumHomePresentationResponse[]> = toSignal(this.museumService.getMuseumHomePresentation(), { initialValue: [] });
  //visit
  allVisitsOfMuseum = signal<VisitHomePresentationResponse[]>([]);
  isLoadingVisit = signal<boolean>(false);

  ngOnInit(): void {
    //Recupero e settings dei valori iniziali del form
    const savedData = sessionStorage.getItem(this.STORAGE_KEY);
    const initialValues = savedData ? JSON.parse(savedData) : {
      museumId: '',
      chiSei: 'Adulto',
      interessi: [],
      durata: 2,
      accessibile: false,
      gratuito: false,
      verificata: false,
    };

    // Inizializzazione Form (valori di default)
    this.formVisit = this.fb.group({
      museumId: [initialValues.museumId, Validators.required],
      chiSei: [initialValues.chiSei, Validators.required],
      interessi: [initialValues.interessi],
      durata: [initialValues.durata],
      accessibile: [initialValues.accessibile],
      gratuito: [initialValues.gratuito],
      verificata: [initialValues.verificata],
    });

    if (initialValues.museumId) {
      this.loadVisitOfMuseum(initialValues.museumId);
    }

    this.formVisit.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        formValues => {
          sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(formValues));
        }
      )

    // Seleziono il campo museo tramite get(con ?, ovvero Safe Call Operator/Optional Chaining), values changes è un observable a cui ci si iscrive
    this.formVisit.get('museumId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(museumId => {
        //Salvo gli interessi attualmente selezionati
        const oldInterest = this.formVisit.get('interessi')?.value || [];
        const oldPartialInterest = this.partialInterestsList();
        //Interessi totali uso set per evitare ripetizioni
        const totalInterest = Array.from(new Set([...oldInterest, ...oldPartialInterest]));
        this.partialInterestsList.set(totalInterest);

        this.formVisit.patchValue({ interessi: [] }); // Resetta al cambio museo (patchValue permette di cambiare un solo campo)

        if (museumId) {
          this.loadVisitOfMuseum(museumId);
        }
      });

    this.formVisit.get('durata')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(duration => {
        let durationFormated: string = Math.floor(duration).toString() + 'h ';
        if (duration - Math.trunc(duration) == 0.5) {
          durationFormated += '30m';
        }
        if (duration === 8) {
          durationFormated += '+';
        }
        this.currentDuration.set(durationFormated);
      })
  }

  // LOGICA BOTTONI CUSTOM
  setRuolo(ruolo: string): void {
    this.formVisit.patchValue({ chiSei: ruolo });
  }

  isInterestDefault(): boolean {
    return this.formVisit.get('interessi')?.value.length == 0;
  }

  toggleInteresse(interest: string): void {
    const current: string[] = this.formVisit.get('interessi')?.value || [];
    if (interest === 'Qualsiasi') {
      if (current.length != 0) {
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

  //caricamento visite del museo selezionato
  private loadVisitOfMuseum(museumID: string): void {
    console.log("Richiesta per id museo: ", museumID);
    this.isLoadingVisit.set(true);
    this.museumService.getAllMuseumVisits(museumID)
      .pipe(takeUntilDestroyed(this.destroyRef))  //Le chiamate http si chiudono quando terminano, questo previene anche il caso limite in cui si distrugge il componente durante la chiamata
      .subscribe({
        next: (visits) => {
          this.allVisitsOfMuseum.set(visits);
          console.log("Cosa mi manda il server?");
          this.isLoadingVisit.set(false);
        },
        error: (err) => {
          console.error("Errore:", err);
          this.allVisitsOfMuseum.set([]);
          this.isLoadingVisit.set(false);
        },
      })
  }
}

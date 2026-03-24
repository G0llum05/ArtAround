import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperaService } from '../../services/opera.service';
import { MuseumService } from '../../services/museum.service';
import { MakerService } from '../../services/maker.service';

@Component({
  selector: 'app-test-opera',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-opera.component.html',
  styleUrls: ['./test-opera.component.css']
})
export class TestOperaComponent implements OnInit {
  operas: any[] = [];
  museums: any[] = [];
  makers: any[] = [];

  // Form per Opera (TUTTI I CAMPI)
  newOpera = {
    title: '',
    description: '',
    startYear: null as number | null,
    endYear: null as number | null,
    makers: [] as string[],
    museum: '',
    location: { room: '', floor: '', building: '' },
    dimensions: { height: null as number | null, width: null as number | null, depth: null as number | null, unit: 'cm' },
    artisticCurrents: [] as string[],
    details: { 
        subjects: [] as string[], 
        colors: [] as string[], 
        places: [] as string[], 
        objectType: '', 
        materials: [] as string[], 
        techniques: [] as string[] 
    },
    copyOf: '',
    falsificationOf: ''
  };

  selectedMaker = ''; 
  newCurrent = '';
  newMaterial = '';
  newTechnique = '';

  // Form per Museum e Maker (per test rapido)
  newMuseum = { name: '', city: '' };
  newMaker = { name: '', surname: '' };

  constructor(
    private operaService: OperaService,
    private museumService: MuseumService,
    private makerService: MakerService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.operaService.getAllOperas().subscribe(data => this.operas = data);
    this.museumService.getAllMuseums().subscribe(data => this.museums = data);
    this.makerService.getAllMakers().subscribe(data => this.makers = data);
  }

  createMuseum() {
    this.museumService.createMuseum(this.newMuseum).subscribe(() => {
      this.loadAll();
      this.newMuseum = { name: '', city: '' };
    });
  }

  createMaker() {
    this.makerService.createMaker(this.newMaker).subscribe(() => {
      this.loadAll();
      this.newMaker = { name: '', surname: '' };
    });
  }

  addMakerToOpera() {
    if (this.selectedMaker && !this.newOpera.makers.includes(this.selectedMaker)) {
      this.newOpera.makers.push(this.selectedMaker);
    }
  }

  addCurrent() {
    if (this.newCurrent) {
      this.newOpera.artisticCurrents.push(this.newCurrent);
      this.newCurrent = '';
    }
  }

  addMaterial() {
    if (this.newMaterial) {
      this.newOpera.details.materials.push(this.newMaterial);
      this.newMaterial = '';
    }
  }

  addTechnique() {
      if (this.newTechnique) {
          this.newOpera.details.techniques.push(this.newTechnique);
          this.newTechnique = '';
      }
  }

  createOpera() {
    // Rimuoviamo i campi vuoti (ID opzionali) per evitare errori di cast su MongoDB
    const payload = JSON.parse(JSON.stringify(this.newOpera));
    
    // Funzione helper per pulire ID
    const cleanId = (id: string) => (id && id.trim() !== "") ? id : undefined;

    payload.museum = cleanId(payload.museum);
    payload.copyOf = cleanId(payload.copyOf);
    payload.falsificationOf = cleanId(payload.falsificationOf);
    payload.makers = Array.isArray(payload.makers) ? payload.makers.filter((id: string) => id && id.trim() !== "") : [];

    this.operaService.createOpera(payload).subscribe({
      next: () => {
        this.loadAll();
        this.resetOperaForm();
        alert('Opera creata con successo!');
      },
      error: (err) => console.error('Errore creazione opera:', err)
    });
  }

  resetOperaForm() {
    this.newOpera = {
        title: '',
        description: '',
        startYear: null,
        endYear: null,
        makers: [],
        museum: '',
        location: { room: '', floor: '', building: '' },
        dimensions: { height: null, width: null, depth: null, unit: 'cm' },
        artisticCurrents: [],
        details: { subjects: [], colors: [], places: [], objectType: '', materials: [], techniques: [] },
        copyOf: '',
        falsificationOf: ''
    };
  }

  deleteOpera(id: string) {
    this.operaService.deleteOpera(id).subscribe(() => this.loadAll());
  }

  getMakerNames(makers: any[]) {
     if (!makers) return '';
     return makers.map(m => (typeof m === 'string') ? m : (m.name + ' ' + m.surname)).join(', ');
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-visit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visit.html',
  styleUrl: './visit.css'
})
export class Visit {
  // Dati del form
  selectedMuseum = '';
  selectedProfile = 'Adulto';
  selectedInterests: string[] = ['Rinascimento', 'Scultura'];
  visitDuration = '02:00';

  // Opzioni
  profiles = [
    {
      name: 'Bambino',
      // Sostituisci la stringa con il path del tuo SVG
      svgPath: "M371.5-273Q323-306 300-360h360q-23 54-71.5 87T480-240q-60 0-108.5-33Zm-27-161.5Q330-449 330-470t14.5-35.5Q359-520 380-520t35.5 14.5Q430-491 430-470t-14.5 35.5Q401-420 380-420t-35.5-14.5Zm200 0Q530-449 530-470t14.5-35.5Q559-520 580-520t35.5 14.5Q630-491 630-470t-14.5 35.5Q601-420 580-420t-35.5-14.5ZM480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-32 5-62t16-59l80 14q-11 25-16 51.5t-5 55.5q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-16-2-31.5t-5-30.5q-81-9-150-48T485-651l70-41q32 37 72.5 63t88.5 39q-25-39-61.5-68.5T573-704l84-50q83 47 133 129.5T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80ZM200-615l413-155q-32-26-70-39.5T463-823q-95 0-169.5 57.5T200-615Zm-64 110q-7-20-11.5-41t-4.5-43q0-91 51-163t129-112q-2-4-2.5-7.5t-.5-8.5q0-17 11.5-28.5T337-920q14 0 24 8t14 20q22-5 43.5-8t44.5-3q67 0 127.5 26T697-802l122-46 28 75-711 268Zm271-188Z"
    },
    {
      name: 'Studente',
      svgPath: "M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z"
    },
    {
      name: 'Adulto',
      svgPath: "M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"
    },
    {
      name: 'Specialista',
      svgPath: "m387-412 35-114-92-74h114l36-112 36 112h114l-93 74 35 114-92-71-93 71ZM240-40v-309q-38-42-59-96t-21-115q0-134 93-227t227-93q134 0 227 93t93 227q0 61-21 115t-59 96v309l-240-80-240 80Zm410-350q70-70 70-170t-70-170q-70-70-170-70t-170 70q-70 70-70 170t70 170q70 70 170 70t170-70ZM320-159l160-41 160 41v-124q-35 20-75.5 31.5T480-240q-44 0-84.5-11.5T320-283v124Zm160-62Z"
    }
  ];

  allInterests = [
    'Arte Moderna', 'Rinascimento', 'Storia dell\'Arte',
    'Fotografia', 'Scultura', 'Architettura', 'Arte Contemporanea'
  ];

  // Metodi
  onMuseumChange() {
    console.log('Museo selezionato:', this.selectedMuseum);
    // Qui andrà la chiamata al backend per recuperare gli interessi
  }

  isInterestSelected(interest: string): boolean {
    return this.selectedInterests.includes(interest);
  }

  toggleInterest(interest: string) {
    if (this.selectedInterests.includes(interest)) {
      this.selectedInterests = this.selectedInterests.filter(i => i !== interest);
    } else {
      this.selectedInterests.push(interest);
    }
  }

  submitPreferences() {
    console.log('Avvio ricerca con:', {
      museum: this.selectedMuseum,
      profile: this.selectedProfile,
      interests: this.selectedInterests,
      duration: this.visitDuration
    });
    // Qui andrà la logica per mostrare i risultati o chiamare l'IA
  }
}

import { Component, OnDestroy, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NavigatorClientService } from '../../services/navigator.service';

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  source?: 'voice' | 'text';
}

@Component({
  selector: 'app-navigator-test',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navigator.component.html',
  styleUrl: './navigator.component.css'
})
export class NavigatorComponent implements OnInit, OnDestroy {
  @ViewChild('chatScrollContainer') private chatScrollContainer?: ElementRef;

  // State flags
  isRecording = false;
  isProcessing = false;
  errorMessage: string | null = null;
  statusMessage = 'Pronto per l\'ascolto vocale o l\'invio del form.';

  // Audio & Recording properties
  private mediaRecorder: MediaRecorder | null = null;
  private currentStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  public audioUrl: string | null = null;
  public latestTranscript = '';

  // Chat Feed
  public chatMessages: ChatMessage[] = [];

  // Base parameters (ALWAYS sent in every request)
  public selectedLang = 'it';
  public currentTone = 'medium';
  public currentLength = 30;

  // Default Fallback IDs per Museo di Palazzo Poggi
  private readonly DEFAULT_VISIT_ID = '650000000000000000000001';
  private readonly DEFAULT_MUSEUM_ID = '650000000000000000000002';

  // Visit & Museum State
  public selectedVisitId = this.DEFAULT_VISIT_ID;
  public selectedMuseumId = this.DEFAULT_MUSEUM_ID;
  public selectedVisitTitle = 'Visita Museo di Palazzo Poggi';
  public selectedMuseumName = 'Museo di Palazzo Poggi';
  public activeArtworkTitle = 'Opera 1 - Museo di Palazzo Poggi';
  public visitsList: any[] = [];
  public currentVisitDetails: any = null;
  public visitArtworks: any[] = [];
  public currentArtworkIndex = 0;

  // Form Controlled Action State
  public selectedActionType: 'ITEM_ACTION' | 'NON_ITEM_ACTION' = 'ITEM_ACTION';
  public selectedItemAction: 'EXPLAIN_ITEM' | 'NEXT_ITEM' | 'PREVIOUS_ITEM' = 'EXPLAIN_ITEM';
  public nonItemSelectionType: 'POI' | 'ARTIST' = 'POI';
  public selectedPoiType = 'TOILETTE';
  public targetArtistInput = '';

  // Options Lists
  public languages: LanguageOption[] = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fra', name: 'Français', flag: '🇫🇷' },
    { code: 'sp', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'cn', name: '中文', flag: '🇨🇳' }
  ];

  public toneOptions = [
    { code: 'infantile', label: '👶 Per bambini' },
    { code: 'simple', label: '🌱 Semplice' },
    { code: 'medium', label: '📖 Divulgativo' },
    { code: 'advanced', label: '🎓 Avanzato' },
    { code: 'technical', label: '🔬 Tecnico' }
  ];

  public lengthOptions = [
    { value: 15, label: '⚡ Breve (15 sec)' },
    { value: 30, label: '📖 Standard (30 sec)' },
    { value: 60, label: '📜 Dettagliata (60 sec)' }
  ];

  public poiOptions = [
    { code: 'TOILETTE', label: '🚻 Toilette / Bagno' },
    { code: 'DISABLED_TOILETTE', label: '♿ Bagno Disabili' },
    { code: 'BAR', label: '☕ Bar & Ristoro' },
    { code: 'RESTAURANT', label: '🍽️ Ristorante' },
    { code: 'SHOP', label: '🛍️ Shop / Bookshop' },
    { code: 'ENTRANCE', label: '🚪 Ingresso' },
    { code: 'EXIT', label: '🚪 Uscita' },
    { code: 'EMERGENCY_EXIT', label: '🚨 Uscita Emergenza' },
    { code: 'ELEVATOR', label: '🛗 Ascensore' },
    { code: 'STAIRS', label: '🪜 Scale' },
    { code: 'TICKET_OFFICE', label: '🎟️ Biglietteria' },
    { code: 'INFO_POINT', label: 'ℹ️ Info Point' },
    { code: 'CLOAKROOM', label: '🧥 Guardaroba' },
    { code: 'FIRST_AID', label: '🏥 Pronto Soccorso' }
  ];

  constructor(
    private navigatorService: NavigatorClientService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setLanguage(this.selectedLang);
    this.loadVisits();

    this.route.queryParams.subscribe(params => {
      if (params['visitId']) {
        this.onVisitChange(params['visitId']);
      }
    });

    this.chatMessages.push({
      id: 'welcome',
      sender: 'bot',
      text: '👋 Benvenuto nella Guida Museale (Museo di Palazzo Poggi). Configura l\'azione dal modulo oppure usa il microfono.',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  ngOnDestroy(): void {
    this.stopMicrophoneStream();
  }

  setLanguage(langCode: string): void {
    this.selectedLang = langCode;
    document.cookie = `lang=${langCode}; path=/; max-age=86400`;
  }

  selectTone(toneCode: string): void {
    this.currentTone = toneCode;
  }

  selectLength(lengthValue: number): void {
    this.currentLength = lengthValue;
  }

  selectPoi(poiCode: string): void {
    this.selectedActionType = 'NON_ITEM_ACTION';
    this.nonItemSelectionType = 'POI';
    this.selectedPoiType = poiCode;
  }

  navigateArtwork(action: 'explain' | 'author' | 'next' | 'prev'): void {
    if (action === 'explain') {
      this.selectedActionType = 'ITEM_ACTION';
      this.selectedItemAction = 'EXPLAIN_ITEM';
    } else if (action === 'next') {
      this.selectedActionType = 'ITEM_ACTION';
      this.selectedItemAction = 'NEXT_ITEM';
    } else if (action === 'prev') {
      this.selectedActionType = 'ITEM_ACTION';
      this.selectedItemAction = 'PREVIOUS_ITEM';
    } else if (action === 'author') {
      this.selectedActionType = 'NON_ITEM_ACTION';
      this.nonItemSelectionType = 'ARTIST';
    }
  }

  loadVisits(): void {
    this.navigatorService.getVisits().subscribe({
      next: (data: any) => {
        let rawList: any[] = [];
        if (Array.isArray(data)) {
          rawList = data;
        } else if (data && Array.isArray(data.visits)) {
          rawList = data.visits;
        } else if (data && data.data && Array.isArray(data.data)) {
          rawList = data.data;
        } else if (data && typeof data === 'object') {
          rawList = Object.values(data).filter(item => typeof item === 'object');
        }

        this.visitsList = rawList.map(v => ({
          ...v,
          _id: (v._id || v.id || '').toString(),
          title: v.title || v.name || 'Visita Museo di Palazzo Poggi'
        })).filter(v => !!v._id);

        if (this.visitsList.length > 0) {
          const poggiVisit = this.visitsList.find(v => {
            const title = (v.title || '').toLowerCase();
            const mName = (v.museum?.name || v.museumName || '').toLowerCase();
            return title.includes('poggi') || title.includes('palazzo') || mName.includes('poggi') || mName.includes('palazzo');
          });

          const defaultVisit = poggiVisit || this.visitsList[0];
          this.onVisitChange(defaultVisit._id);
        } else {
          this.selectedVisitId = this.DEFAULT_VISIT_ID;
          this.selectedMuseumId = this.DEFAULT_MUSEUM_ID;
          this.selectedVisitTitle = 'Visita Museo di Palazzo Poggi';
          this.selectedMuseumName = 'Museo di Palazzo Poggi';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn('Visite non caricate:', err);
        this.selectedVisitId = this.DEFAULT_VISIT_ID;
        this.selectedMuseumId = this.DEFAULT_MUSEUM_ID;
        this.selectedVisitTitle = 'Visita Museo di Palazzo Poggi';
        this.selectedMuseumName = 'Museo di Palazzo Poggi';
        this.cdr.detectChanges();
      }
    });
  }

  onVisitChange(visitId: string): void {
    if (!visitId) return;

    this.selectedVisitId = visitId;
    this.currentArtworkIndex = 0;

    const vObj = this.visitsList.find(v => v._id === visitId);
    if (vObj) {
      this.selectedVisitTitle = vObj.title || 'Visita Museo di Palazzo Poggi';
      if (vObj.museum) {
        this.selectedMuseumId = typeof vObj.museum === 'object' ? (vObj.museum._id || vObj.museum.id) : vObj.museum;
        this.selectedMuseumName = typeof vObj.museum === 'object' ? vObj.museum.name : 'Museo di Palazzo Poggi';
      } else if (vObj.museumId) {
        this.selectedMuseumId = vObj.museumId;
        this.selectedMuseumName = 'Museo di Palazzo Poggi';
      }
    }

    this.navigatorService.getVisitDetails(visitId).subscribe({
      next: (res: any) => {
        if (res) {
          this.currentVisitDetails = res;
          this.selectedVisitTitle = res.title || res.name || this.selectedVisitTitle;

          if (res.museum) {
            if (typeof res.museum === 'object') {
              this.selectedMuseumId = res.museum._id || res.museum.id || this.selectedMuseumId;
              this.selectedMuseumName = res.museum.name || this.selectedMuseumName || 'Museo di Palazzo Poggi';
            } else if (typeof res.museum === 'string') {
              this.selectedMuseumId = res.museum;
            }
          } else if (res.museumId) {
            this.selectedMuseumId = res.museumId;
          }

          this.visitArtworks = res.artworks || [];
          if (this.visitArtworks.length > 0) {
            this.activeArtworkTitle = this.visitArtworks[0].title || 'Opera #1';
          }
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.warn('Dettagli visita non caricati:', err);
      }
    });
  }

  onArtworkSelect(index: number): void {
    this.currentArtworkIndex = index;
    if (this.visitArtworks && this.visitArtworks[index]) {
      this.activeArtworkTitle = this.visitArtworks[index].title || (`Opera #${index + 1}`);
    }
  }

  // Estrazione sicura del testo della risposta
  private extractResponseText(data: any): string {
    if (!data) return 'Risposta ricevuta.';
    if (typeof data === 'string') return data;
    if (typeof data.text === 'string') return data.text;
    if (data.text && typeof data.text === 'object') {
      return data.text.text || data.text.description || data.text.reply || JSON.stringify(data.text);
    }
    if (typeof data.reply === 'string') return data.reply;
    if (typeof data.description === 'string') return data.description;
    return JSON.stringify(data);
  }

  submitFormAction(): void {
    if (this.isProcessing) return;

    const visitId = this.selectedVisitId || this.DEFAULT_VISIT_ID;
    const museumId = this.selectedMuseumId || this.currentVisitDetails?.museum?._id || this.currentVisitDetails?.museumId || this.DEFAULT_MUSEUM_ID;

    let itemAction: string | null = null;
    let targetPoiType: string | null = null;
    let targetArtist: string | null = null;
    let userDisplayLabel = '';

    if (this.selectedActionType === 'ITEM_ACTION') {
      itemAction = this.selectedItemAction;
      userDisplayLabel = `[ITEM_ACTION] ${itemAction}`;
    } else {
      if (this.nonItemSelectionType === 'POI') {
        targetPoiType = this.selectedPoiType;
        userDisplayLabel = `[NON_ITEM_ACTION] POI: ${targetPoiType}`;
      } else {
        targetArtist = this.targetArtistInput.trim() || 'Artista';
        userDisplayLabel = `[NON_ITEM_ACTION] Artista: ${targetArtist}`;
      }
    }

    this.errorMessage = null;
    this.chatMessages.push({
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: `${userDisplayLabel} (Visita: ${this.selectedVisitTitle}, Lingua: ${this.selectedLang}, Tono: ${this.currentTone}, Durata: ${this.currentLength}s)`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'text'
    });
    this.scrollToBottom();

    this.isProcessing = true;
    this.statusMessage = '⏳ Invio azione form al backend...';

    const formData = new FormData();
    formData.append('actionType', this.selectedActionType);
    if (itemAction) formData.append('itemAction', itemAction);
    if (targetPoiType) formData.append('targetPoiType', targetPoiType);
    if (targetArtist) formData.append('targetArtist', targetArtist);

    formData.append('language', this.selectedLang);
    formData.append('tone', this.currentTone);
    formData.append('length', this.currentLength.toString());
    formData.append('museumId', museumId);
    formData.append('visitId', visitId);
    formData.append('currentArtworkIndex', (this.currentArtworkIndex || 0).toString());

    this.navigatorService.sendStreamRequest(formData, (chunk) => {
      if (chunk.type === 'FINAL_RESPONSE') {
        this.isProcessing = false;
        const botReply = this.extractResponseText(chunk.data);

        this.chatMessages.push({
          id: Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString()
        });

        this.statusMessage = '✅ Risposta ricevuta dal backend!';
        this.scrollToBottom();
        this.cdr.detectChanges();
      } else if (chunk.type === 'ERROR') {
        this.isProcessing = false;
        this.errorMessage = chunk.error || 'Errore elaborazione form';
        this.statusMessage = 'Errore risposta backend.';
        this.cdr.detectChanges();
      }
    }).catch((err: any) => {
      this.isProcessing = false;
      this.errorMessage = 'Errore invio form al backend: ' + (err.message || err);
      this.statusMessage = 'Errore comunicazione backend.';
      this.cdr.detectChanges();
    });
  }

  async toggleRecording(): Promise<void> {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording(): Promise<void> {
    this.errorMessage = null;
    this.audioChunks = [];
    this.audioUrl = null;
    this.latestTranscript = '';

    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });

      let mimeType = 'audio/webm;codecs=wav';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const options = mimeType ? { mimeType } : undefined;
      this.mediaRecorder = new MediaRecorder(this.currentStream, options);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.stopMicrophoneStream();
        this.processRecordedAudio(mimeType || 'audio/webm');
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.statusMessage = '🎙️ Registrazione in corso... Parla ora!';

    } catch (err: any) {
      console.error('Microphone error:', err);
      this.stopMicrophoneStream();
      this.errorMessage = 'Impossibile accedere al microfono: ' + (err.message || err);
      this.statusMessage = 'Errore microfono.';
      this.cdr.detectChanges();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.statusMessage = '⏳ Invio audio in streaming...';
      this.cdr.detectChanges();
    }
  }

  private stopMicrophoneStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      this.currentStream = null;
    }
  }

  private async processRecordedAudio(mimeType: string): Promise<void> {
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
    this.audioUrl = URL.createObjectURL(audioBlob);

    const visitId = this.selectedVisitId || this.DEFAULT_VISIT_ID;
    const museumId = this.selectedMuseumId || this.currentVisitDetails?.museum?._id || this.currentVisitDetails?.museumId || this.DEFAULT_MUSEUM_ID;

    const formData = new FormData();
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
    formData.append('audio', audioBlob, `recording.${ext}`);
    formData.append('actionType', 'AUDIO_ACTION');

    formData.append('language', this.selectedLang);
    formData.append('tone', this.currentTone);
    formData.append('length', this.currentLength.toString());
    formData.append('museumId', museumId);
    formData.append('visitId', visitId);
    formData.append('currentArtworkIndex', (this.currentArtworkIndex || 0).toString());

    this.isProcessing = true;
    this.statusMessage = '🎙️ Invio audio in corso (in ascolto dello stream)...';

    try {
      await this.navigatorService.sendStreamRequest(formData, (chunk) => {
        if (chunk.type === 'TRANSCRIPTION') {
          this.latestTranscript = chunk.text || '(Vocale non decodificato)';
          this.chatMessages.push({
            id: Math.random().toString(36).substring(2, 9),
            sender: 'user',
            text: this.latestTranscript,
            timestamp: new Date().toLocaleTimeString(),
            source: 'voice'
          });
          this.statusMessage = '🤖 Trascrizione ricevuta! Elaborazione risposta AI in corso...';
          this.scrollToBottom();
          this.cdr.detectChanges();
        }
        else if (chunk.type === 'FINAL_RESPONSE') {
          this.isProcessing = false;
          const botReply = this.extractResponseText(chunk.data);

          this.chatMessages.push({
            id: Math.random().toString(36).substring(2, 9),
            sender: 'bot',
            text: botReply,
            timestamp: new Date().toLocaleTimeString()
          });

          this.statusMessage = '✅ Risposta finale completata!';
          this.scrollToBottom();
          this.cdr.detectChanges();
        }
        else if (chunk.type === 'ERROR') {
          this.isProcessing = false;
          this.errorMessage = chunk.error || 'Errore durante l\'elaborazione dello stream audio';
          this.statusMessage = 'Errore elaborazione stream.';
          this.cdr.detectChanges();
        }
      });
    } catch (err: any) {
      this.isProcessing = false;
      console.error('Audio Stream Error:', err);
      this.errorMessage = 'Errore stream audio: ' + (err.message || err);
      this.statusMessage = 'Errore comunicazione backend.';
      this.cdr.detectChanges();
    }
  }

  clearChat(): void {
    this.chatMessages = [{
      id: 'welcome',
      sender: 'bot',
      text: '👋 Chat resettata.',
      timestamp: new Date().toLocaleTimeString()
    }];
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatScrollContainer) {
        this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}

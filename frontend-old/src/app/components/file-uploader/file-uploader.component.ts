import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import XHRUpload from '@uppy/xhr-upload';

export interface UploadedFileResult {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.css'
})
export class FileUploaderComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('dashboardContainer', { static: false }) dashboardContainer!: ElementRef<HTMLDivElement>;

  @Input() museumId!: string;
  @Input() visitId?: string;
  @Input() artworkId?: string;
  @Input() isMeta: boolean = false;

  @Input() inline: boolean = true;
  @Input() height: number = 340;
  @Input() maxFileSize: number = 20 * 1024 * 1024; // 20 MB
  @Input() allowedFileTypes: string[] = ['image/*'];
  @Input() note: string = 'I formati immagine verranno transpillati automaticamente in WebP tramite Sharp.';

  @Output() uploadSuccess = new EventEmitter<UploadedFileResult[]>();
  @Output() uploadError = new EventEmitter<any>();

  private uppy!: Uppy;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initUppy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.uppy && (changes['museumId'] || changes['visitId'] || changes['artworkId'] || changes['isMeta'])) {
      const plugin = this.uppy.getPlugin('XHRUpload');
      if (plugin) {
        plugin.setOptions({
          endpoint: this.resolveEndpoint()
        });
      }
    }
  }

  private resolveEndpoint(): string {
    if (!this.museumId) {
      return '/api/upload';
    }

    if (this.visitId) {
      if (this.artworkId) {
        // assets/museums/:museumId/visit/:visitId/:artworkId
        return `/api/upload/museum/${this.museumId}/visit/${this.visitId}/artwork/${this.artworkId}`;
      }
      if (this.isMeta) {
        // assets/museums/:museumId/visit/:visitId/meta
        return `/api/upload/museum/${this.museumId}/visit/${this.visitId}/meta`;
      }
      return `/api/upload/museum/${this.museumId}/visit/${this.visitId}/meta`;
    }

    if (this.artworkId) {
      // assets/museums/:museumId/:artworkId
      return `/api/upload/museum/${this.museumId}/artwork/${this.artworkId}`;
    }

    // Default: assets/museums/:museumId/meta
    return `/api/upload/museum/${this.museumId}/meta`;
  }

  private initUppy(): void {
    if (!this.dashboardContainer || !this.dashboardContainer.nativeElement) {
      return;
    }

    const endpoint = this.resolveEndpoint();

    this.uppy = new Uppy({
      id: `uppy-${Math.random().toString(36).substring(2, 9)}`,
      autoProceed: false,
      restrictions: {
        maxFileSize: this.maxFileSize,
        allowedFileTypes: this.allowedFileTypes.length > 0 ? this.allowedFileTypes : undefined
      }
    });

    this.uppy.use(Dashboard, {
      target: this.dashboardContainer.nativeElement,
      inline: this.inline,
      height: this.height,
      width: '100%',
      showProgressDetails: true,
      note: this.note,
      theme: 'light',
      locale: {
        strings: {
          dropPasteFiles: 'Trascina qui i tuoi file oppure %{browseFiles}',
          browseFiles: 'sfoglia dai tuoi dispositivi',
          uploadXFiles: {
            0: 'Carica %{smart_count} file',
            1: 'Carica %{smart_count} file'
          },
          uploadingXFiles: {
            0: 'Caricamento di %{smart_count} file in corso',
            1: 'Caricamento di %{smart_count} file in corso'
          },
          complete: 'Caricamento completato'
        }
      }
    });

    this.uppy.use(XHRUpload, {
      id: 'XHRUpload',
      endpoint: endpoint,
      fieldName: 'files',
      formData: true,
      withCredentials: true
    });

    this.uppy.on('complete', (result: any) => {
      if (result.successful && result.successful.length > 0) {
        const fileMap = new Map<string, UploadedFileResult>();
        result.successful.forEach((f: any) => {
          const serverFiles = f.response?.body?.files;
          if (Array.isArray(serverFiles)) {
            serverFiles.forEach((fileObj: UploadedFileResult) => {
              if (fileObj && (fileObj.url || fileObj.filename)) {
                const key = fileObj.url || fileObj.filename;
                fileMap.set(key, fileObj);
              }
            });
          } else if (f.response?.body?.url) {
            fileMap.set(f.response.body.url, f.response.body as UploadedFileResult);
          }
        });

        const fileResults: UploadedFileResult[] = Array.from(fileMap.values());
        this.uploadSuccess.emit(fileResults);
      }
      if (result.failed && result.failed.length > 0) {
        this.uploadError.emit(result.failed);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.uppy) {
      this.uppy.destroy();
    }
  }
}

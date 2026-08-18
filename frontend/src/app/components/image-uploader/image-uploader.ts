import {
  Component,
  ElementRef,
  viewChild,
  signal,
  input,
  output,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Uppy, { UppyFile, Restrictions, Meta, Body } from '@uppy/core';
import DragDrop from '@uppy/drag-drop';

export type AppUppyFile = UppyFile<Meta, Body>;

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-uploader.html',
  styleUrl: './image-uploader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploader implements AfterViewInit, OnDestroy {
  // Container DOM element for Uppy DragDrop
  uppyContainer = viewChild.required<ElementRef<HTMLDivElement>>('uppyContainer');

  // Component Inputs
  allowedFileTypes = input<string[]>(['image/*']);
  maxFileSize = input<number>(10 * 1024 * 1024); // Default: 10 MB
  maxNumberOfFiles = input<number | null>(null);
  minNumberOfFiles = input<number | null>(null);
  autoProceed = input<boolean>(false);
  allowMultipleFiles = input<boolean>(true);
  inputName = input<string>('files[]');
  width = input<string | number>('100%');
  height = input<string | number>('100%');
  note = input<string | null>(null);
  showPreview = input<boolean>(true);

  // Localization strings
  dropHereOr = input<string>('Drop here or %{browse}');
  browse = input<string>('browse');

  // Component Outputs / Event Callbacks
  filesChange = output<AppUppyFile[]>();
  fileAdded = output<AppUppyFile>();
  fileRemoved = output<AppUppyFile>();
  dragOver = output<DragEvent>();
  dragLeave = output<DragEvent>();
  drop = output<DragEvent>();
  restrictionFailed = output<{ file?: AppUppyFile; error: Error }>();

  // Reactive State
  files = signal<AppUppyFile[]>([]);
  isDragging = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Internal Uppy instance
  private uppy: Uppy | null = null;
  private previewUrlMap = new Map<string, string>();

  ngAfterViewInit(): void {
    this.initUppy();
  }

  ngOnDestroy(): void {
    this.cleanupPreviewUrls();
    if (this.uppy) {
      this.uppy.destroy();
      this.uppy = null;
    }
  }

  private initUppy(): void {
    const restrictions: Partial<Restrictions> = {
      maxFileSize: this.maxFileSize(),
      allowedFileTypes: this.allowedFileTypes(),
    };

    if (this.maxNumberOfFiles() !== null) {
      restrictions.maxNumberOfFiles = this.maxNumberOfFiles()!;
    }
    if (this.minNumberOfFiles() !== null) {
      restrictions.minNumberOfFiles = this.minNumberOfFiles()!;
    }

    this.uppy = new Uppy({
      id: 'uppy-image-uploader-' + Math.random().toString(36).substring(2, 9),
      autoProceed: this.autoProceed(),
      restrictions,
    });

    this.uppy.use(DragDrop, {
      target: this.uppyContainer().nativeElement,
      inputName: this.inputName(),
      allowMultipleFiles: this.allowMultipleFiles(),
      width: this.width(),
      height: this.height(),
      note: this.note() ?? undefined,
      locale: {
        strings: {
          dropHereOr: this.dropHereOr(),
          browse: this.browse(),
        },
      },
      onDragOver: (event: DragEvent) => {
        this.isDragging.set(true);
        this.dragOver.emit(event);
      },
      onDragLeave: (event: DragEvent) => {
        this.isDragging.set(false);
        this.dragLeave.emit(event);
      },
      onDrop: (event: DragEvent) => {
        this.isDragging.set(false);
        this.drop.emit(event);
      },
    });

    this.uppy.on('file-added', (file: AppUppyFile) => {
      this.errorMessage.set(null);
      this.updateFiles();
      this.fileAdded.emit(file);
      this.filesChange.emit(this.files());
    });

    this.uppy.on('file-removed', (file: AppUppyFile) => {
      this.revokePreviewUrl(file.id);
      this.updateFiles();
      this.fileRemoved.emit(file);
      this.filesChange.emit(this.files());
    });

    this.uppy.on('restriction-failed', (file: AppUppyFile | undefined, error: Error) => {
      this.errorMessage.set(error.message);
      this.restrictionFailed.emit({ file, error });
    });

    this.uppy.on('error', (error: Error) => {
      this.errorMessage.set(error.message);
    });
  }

  private updateFiles(): void {
    if (!this.uppy) return;
    const currentFiles = this.uppy.getFiles();
    this.files.set([...currentFiles]);
  }

  getFilePreview(file: AppUppyFile): string | null {
    if (file.preview) {
      return file.preview;
    }

    if (file.data instanceof Blob || file.data instanceof File) {
      if (!this.previewUrlMap.has(file.id)) {
        const url = URL.createObjectURL(file.data);
        this.previewUrlMap.set(file.id, url);
      }
      return this.previewUrlMap.get(file.id) || null;
    }

    return null;
  }

  private revokePreviewUrl(fileId: string): void {
    const url = this.previewUrlMap.get(fileId);
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrlMap.delete(fileId);
    }
  }

  private cleanupPreviewUrls(): void {
    this.previewUrlMap.forEach((url) => URL.revokeObjectURL(url));
    this.previewUrlMap.clear();
  }

  removeFile(fileId: string): void {
    if (this.uppy) {
      this.uppy.removeFile(fileId);
    }
  }

  clearFiles(): void {
    if (this.uppy) {
      this.uppy.cancelAll();
      this.cleanupPreviewUrls();
      this.files.set([]);
      this.filesChange.emit([]);
    }
  }

  getFiles(): AppUppyFile[] {
    return this.uppy ? this.uppy.getFiles() : [];
  }

  getUppyInstance(): Uppy | null {
    return this.uppy;
  }

  formatFileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

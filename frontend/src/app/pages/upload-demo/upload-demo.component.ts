import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileUploaderComponent, UploadedFileResult } from '../../components/file-uploader/file-uploader.component';

@Component({
  selector: 'app-upload-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploaderComponent],
  templateUrl: './upload-demo.component.html',
  styleUrl: './upload-demo.component.css'
})
export class UploadDemoComponent {
  museumId: string = '';
  visitId: string = '';
  artworkId: string = '';
  isMeta: boolean = true;

  uploadedResults: UploadedFileResult[] = [];
  errorMessage: string | null = null;

  onUploadSuccess(files: UploadedFileResult[]): void {
    console.log('Upload success:', files);
    this.uploadedResults = [...this.uploadedResults, ...files];
    this.errorMessage = null;
  }

  onUploadError(err: any): void {
    console.error('Upload error:', err);
    this.errorMessage = 'Errore durante il caricamento dei file.';
  }
}

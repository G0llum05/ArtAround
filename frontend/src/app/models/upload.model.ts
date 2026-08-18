import { ImageOrientation } from './subModels/image.model';

export class UploadMuseumImgDTO {
  museumId: string;
  files: (File)[];
  file: File | null;
  orientation?: ImageOrientation | string;

  constructor(museumId: string, files?: File[] | File, orientation?: ImageOrientation | string) {
    this.museumId = museumId;
    this.files = Array.isArray(files) ? files : (files ? [files] : []);
    this.file = this.files[0] || null;
    this.orientation = orientation;
  }
}

export class UploadVisitImgDTO {
  museumId: string;
  visitId: string;
  files: (File)[];
  file: File | null;
  orientation?: ImageOrientation | string;

  constructor(museumId: string, visitId: string, files?: File[] | File, orientation?: ImageOrientation | string) {
    this.museumId = museumId;
    this.visitId = visitId;
    this.files = Array.isArray(files) ? files : (files ? [files] : []);
    this.file = this.files[0] || null;
    this.orientation = orientation;
  }
}

export class UploadArtworkImgDTO {
  museumId: string;
  artworkId: string;
  files: (File)[];
  file: File | null;
  orientation?: ImageOrientation | string;

  constructor(museumId: string, artworkId: string, files?: File[] | File, orientation?: ImageOrientation | string) {
    this.museumId = museumId;
    this.artworkId = artworkId;
    this.files = Array.isArray(files) ? files : (files ? [files] : []);
    this.file = this.files[0] || null;
    this.orientation = orientation;
  }
}

export class UploadArtistImgDTO {
  artistId: string;
  museumId?: string | null;
  files: (File)[];
  file: File | null;
  orientation?: ImageOrientation | string;

  constructor(artistId: string, files?: File[] | File, orientation?: ImageOrientation | string, museumId: string | null = null) {
    this.artistId = artistId;
    this.museumId = museumId;
    this.files = Array.isArray(files) ? files : (files ? [files] : []);
    this.file = this.files[0] || null;
    this.orientation = orientation;
  }
}

export class UploadUserPropicDTO {
  userId: string;
  files: File[];
  file: File;
  orientation?: ImageOrientation | string;

  constructor(userId: string, files?: File[] | File, orientation?: ImageOrientation | string) {
    this.userId = userId;
    this.files = Array.isArray(files) ? files : (files ? [files] : []);
    this.file = this.files[0] || null;
    this.orientation = orientation;
  }
}

export interface UploadedFileResponse {
  filename: string;
  path?: string;
  url: string;
  size?: number;
  mimeType?: string;
  orientation?: ImageOrientation | string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  url?: string;
  files?: UploadedFileResponse[];
  museumId?: string;
  visitId?: string;
  artworkId?: string;
  artistId?: string;
  userId?: string;
}

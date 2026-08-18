export type ImageOrientation = 'landscape' | 'portrait' | 'square';

export interface ImageSchema {
  url: string;
  orientation: ImageOrientation | string;
}

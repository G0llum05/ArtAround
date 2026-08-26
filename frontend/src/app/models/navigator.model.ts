import { ToneType } from './appModel/userNavigatorSettings';

export interface NavigatorRequest {
  language: string;
  length: number;
  tone: string | ToneType;
  museumId: string;
  visitId: string;
  currentArtworkIndex: number;
  itemAction?: string;
  targetPoiType?: string;
  targetArtist?: string;
}

export const TONE_MAPPING: Record<ToneType, string> = {
  bambino: 'infantile',
  studente: 'simple',
  adulto: 'medium',
  specialista: 'technical'
};

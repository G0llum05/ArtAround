import { ToneType } from './appModel/userNavigatorSettings';

export interface NavigatorRequest {
  language: string;
  length: number;
  tone: string | ToneType;
  museumId?: string;
  visitId?: string;
  artworkId?: string;
  currentArtworkIndex?: number;
  actionType?: string;
  itemAction?: string;
  targetPoiType?: string;
  targetArtist?: string;
  userQuery?: string;
  isGroup?: boolean;
  isTeacher?: boolean;
  sessionCode?: string;
}

export const TONE_MAPPING: Record<ToneType, string> = {
  bambino: 'infantile',
  studente: 'simple',
  adulto: 'medium',
  specialista: 'technical'
};

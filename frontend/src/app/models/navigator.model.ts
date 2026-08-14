export interface NavigatorRequest {
  language: string,
  length: number,
  tone: string,
  museumId: string,
  visitId: string,
  currentArtworkIndex: number,
  audioFile?: string,
  itemAction?: string,
  targetPoiType?: string,
  targetArtist?: string
}


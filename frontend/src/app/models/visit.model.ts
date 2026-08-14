import { ArtworkResponse } from "./artwork.model";
import { UserResponse } from "./user.model";
import { Schedule } from "./subModels/schedule.model";

export interface VisitHomePresentationResponse {
  id: string,
  title: string,
  description: string,
  isVerified: boolean,
  disableFriendly: boolean,
  duration: number, // minutes
  price: number,
  isClosingSoon: boolean,
  isNew: boolean,
  assets: {
    images: { url: string; orientation: string }[];
  },
}

export interface VisitResponse {
  id: string,
  title: string,
  description: string,
  price: number,
  license: string,
  creator: UserResponse,
  artworks: ArtworkResponse[], //aggiungere anche items????
  minDuration: number,
  maxDuration: number,
  isActive: boolean,
  availability: {
    always: boolean,
    startDate: Date,
    endDate: Date
  },

  weeklySchedule: Schedule[],

  disableFriendly: boolean,
  requirements: string,
  // quiz: Quiz,

  categories: string[],

  likesCount: number,
  views: {
    total: number,
    weekly: number
  },
  badge: string,
  isVerified?: boolean
}

export interface VisitRequest {
  title: string,
  description: string,
  price: number,
  license: string,
  creator: UserResponse,
  artworks: ArtworkResponse[], //aggiungere anche items????
  minDuration: number,
  maxDuration: number,
  isActive: boolean,
  availability: {
    always: boolean,
    startDate: Date,
    endDate: Date
  },

  weeklySchedule: Schedule[],

  disableFriendly: boolean,
  requirements: string,
  // quiz: Quiz,

  categories: string[],

  likesCount: number,
  views: {
    total: number,
    weekly: number
  },
  badge: string,
  isVerified?: boolean
}

export interface VisitImageRequest {
  museumId: string,
  visitId: string
}

import { ArtworkResponse } from "./artwork.model";
import { SocialSchema } from "./subModels/social.model";
import { VisitResponse } from "./visit.model";
import { Schedule } from "./subModels/schedule.model";
import { PointOfInterest } from "./subModels/pointOfInterest.model";
import { ImageSchema } from "./subModels/image.model";

export interface MuseumResponse {
  id: string,
  name: string,
  description: string,
  address: {
    street: string,
    city: string,
    zipCode: string,
    country: string
  },

  contact: [
    phone: string,
    email: string,
    website: string,
    social: SocialSchema
  ],

  maxCapacity: number,
  actualCapacity: number,

  visits: VisitResponse[],

  artworks: ArtworkResponse[],

  openingHours: Schedule[],

  ticketInfo: {
    prices: {
      planName: string,
      price: number,
      target: string
    }[],
    discountCode: number
  },

  isActive: boolean,

  services: {
    hasToilette: boolean,
    hasDisabledToilette: boolean,
    hasElevator: boolean,
    hasStairs: boolean,
    hasBar: boolean,
    hasRestaurant: boolean,
    hasShop: boolean,
    hasParking: boolean,
    hasAudioGuide: boolean,
    hasAirConditioning: boolean,
    hasHeating: boolean,
    hasWifi: boolean,
    hasGuidedTours: boolean,
    hasCloakroom: boolean
  },

  accessibility: {
    disableFriendly: boolean,
    wheelchairAccessible: boolean,
    childFriendly: boolean,
    petFriendly: boolean,
    tactilePaths: boolean,
    brailleSignage: boolean,
    audioDescriptions: boolean,
    notes: string
  },

  pointsOfInterest: PointOfInterest[],

  floors: {
    level: number,
    name: string,
    description: string
  }[],

  transportInfo: {
    publicTransport: string,
    parkingDetails: string
  },

  eventsAndExibitions: {
    specialEvents: string[],
    temporaryExibitions: string[]
  },

  requirements: string,

  assets?: {
    images: ImageSchema[]
  }
}

export interface MuseumRequest {
  name: string,
  description: string,
  address: {
    street: string,
    city: string,
    zipCode: string,
    country: string
  },

  contact: [
    phone: string,
    email: string,
    website: string,
    social: SocialSchema
  ],

  maxCapacity: number,
  actualCapacity: number,

  visits: VisitResponse[],

  artworks: ArtworkResponse[],

  openingHours: Schedule[],

  ticketInfo: {
    prices: {
      planName: string,
      price: number,
      target: string
    }[],
    discountCode: number
  },

  isActive: boolean,

  services: {
    hasToilette: boolean,
    hasDisabledToilette: boolean,
    hasElevator: boolean,
    hasStairs: boolean,
    hasBar: boolean,
    hasRestaurant: boolean,
    hasShop: boolean,
    hasParking: boolean,
    hasAudioGuide: boolean,
    hasAirConditioning: boolean,
    hasHeating: boolean,
    hasWifi: boolean,
    hasGuidedTours: boolean,
    hasCloakroom: boolean
  },

  accessibility: {
    disableFriendly: boolean,
    wheelchairAccessible: boolean,
    childFriendly: boolean,
    petFriendly: boolean,
    tactilePaths: boolean,
    brailleSignage: boolean,
    audioDescriptions: boolean,
    notes: string
  },

  pointsOfInterest: PointOfInterest[],

  floors: {
    level: number,
    name: string,
    description: string
  }[],

  transportInfo: {
    publicTransport: string,
    parkingDetails: string
  },

  eventsAndExibitions: {
    specialEvents: string[],
    temporaryExibitions: string[]
  },

  requirements: string,

  assets: {
    images: ImageSchema[]
  }
}

export interface MuseumVisitPlanResponse {
  id: number,
  name: string,
  city: string,
  maxCapacity: number,
  actualCapacity: number,
  ticketInfo: {
    prices: {
      planName: string,
      price: number,
      target: string
    }[],
    discountCode: number
  },
  imageUrls: string[]
}

export interface MuseumHomePresentationResponse {
  id: string,
  name: string,
  description: string,
  city: string,
  disableFriendly: boolean,
  assets: {
    images: ImageSchema[]
  }
}

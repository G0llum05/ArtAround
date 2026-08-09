import { ArtworkResponse } from "./artwork.model";
import { UserResponse } from "./user.model";
import { Schedule } from "./subModels/schedule.model";

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
    isRunning: boolean
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
    isRunning: boolean
}

export interface VisitImageRequest {
    museumId: string,
    visitId: string
}

export interface VisitHomePresentationRequest {
    museumId: string,
    visitId: string
}

export interface VisitHomePresentationResponse {
    id: string,
    title: string,
    description: string,
    verified: boolean,
    disabledFriendly: boolean,
    badge: string,
    imageUrls: string[]
}


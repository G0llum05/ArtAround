import { ArtistResponse } from "./artist.model";
import { ArtworkLocation } from "./subModels/artworkLocation.model";
import { ArtworkDimensions } from "./subModels/artworkDimensions.model"
import { ArtworkDetails } from "./subModels/artworkDetails.model"
import { ImageSchema } from "./subModels/image.model"
import { MuseumResponse } from "./museum.model";

export interface ArtworkResponse {
    id: string,
    title: string,
    description: string,
    startYear: number,
    endYear: number,
    artists: ArtistResponse[],
    museum: MuseumResponse,
    location: ArtworkLocation,
    dimensions: ArtworkDimensions
    artisticCurrents: string[],
    details: ArtworkDetails,
    copyOf: ArtworkResponse,
    falsificationOf: ArtworkResponse
    isActive: boolean,
    isPrivate: boolean,
    qrCode: string,
    assets: {
        images: ImageSchema[]
    } 
}

export interface ArtworkForPresentation {
    id: string,
    title: string,
    description: string,
    artists: ArtistResponse[],
    assets: {
        images: ImageSchema[]
    }

}

export interface ArtworkRequest {
    title: string,
    description: string,
    startYear: number,
    endYear: number,
    artists: ArtistResponse[],
    museum: MuseumResponse,
    location: ArtworkLocation,
    dimensions: ArtworkDimensions
    artisticCurrents: string[],
    details: ArtworkDetails,
    copyOf: ArtworkResponse,
    falsificationOf: ArtworkResponse
    isActive: boolean,
    isPrivate: boolean,
    qrCode: string,
    assets: {
        images: ImageSchema[]
    }
}

export interface ArtworkLLMRequest {
    title: string,
    description: string,
    startYear: number,
    endYear: number,
    artists: ArtistResponse[],
    museum: MuseumResponse,
    location: ArtworkLocation,
    dimensions: ArtworkDimensions
    artisticCurrents: string[],
    details: ArtworkDetails,
    copyOf: ArtworkResponse,
    falsificationOf: ArtworkResponse
}

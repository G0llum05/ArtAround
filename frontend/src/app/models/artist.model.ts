import { ArtworkResponse } from "./artwork.model";

export interface ArtistResponse {
    id: string,
    name: string,
    surname: string,
    artworks: ArtistResponse[],
    artisitcCurrents: string[],
    followerOf: ArtistResponse,
    teacherOf: ArtistResponse
}

export interface ArtistRequest {
    name: string,
    surname: string,
    artworks: ArtistResponse[],
    artisitcCurrents: string[],
    followerOf: ArtistResponse,
    teacherOf: ArtistResponse
}